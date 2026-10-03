"""Embed profiles via OpenAI text-embedding-3-small and cache as numpy.

Dual-encoder output: TWO embeddings per profile.

  data/profile_embeddings_self.npy    shape (N, 1536) float32
  data/profile_embeddings_target.npy  shape (N, 1536) float32
  data/profile_ids.json               list[str] of ids in same order

self text   = interests + [Self] Character + [Self] Appearance
target text = [Target] Character + [Target] Appearance

The split is deliberate: self is the "who I am" vector (anchored at the speaker's
own features and interests), target is the "what I want in a partner" vector.
At inference time the match head compares self_A against target_B (and the
mirror) — that's the asymmetric matching that resolves the
"I'm redheaded" / "I'm looking for a redhead" interference problem.

Profile fields (current canonical TXT format):
  interests (list)
  my character   (multi-line, 2-4 sentences of self personality)
  my appearance  (single line, physical description of self)
  you character  (multi-line, 1-3 sentences of desired partner's personality)
  you appearance (single line, physical description of desired partner)
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import TypedDict

import numpy as np
from openai import OpenAI


EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536


class Profile(TypedDict):
    id: str
    interests: list[str]
    my_character: str
    my_appearance: str
    you_character: str
    you_appearance: str


# --- Parser --------------------------------------------------------------

_ID_HEADER = re.compile(r"^(u_\d{6})\.$")
_INTEREST = re.compile(r"^\s+-\s+([A-Za-z][A-Za-z0-9_]*)\s*$")
_MULTI_START = re.compile(r"^(my character|you character):\s*\|\s*$")
_FIELD = re.compile(r"^(my appearance|you appearance):\s*(.*)$")
# Anything that looks like the start of the next field (or the next profile).
_NEXT_FIELD = re.compile(r"^(interests|my character|you character|my appearance|you appearance):\s*")
_ID_HEADER_END = re.compile(r"^u_\d{6}\.$")


def parse_profiles(path: Path) -> list[Profile]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    profiles: list[Profile] = []
    i = 0
    while i < len(lines):
        m = _ID_HEADER.match(lines[i])
        if not m:
            i += 1
            continue
        pid = m.group(1)
        i += 1

        if i >= len(lines) or lines[i] != "interests:":
            raise ValueError(f"{pid}: expected 'interests:' on line {i}")
        i += 1
        interests: list[str] = []
        while i < len(lines) and _INTEREST.match(lines[i]):
            interests.append(_INTEREST.match(lines[i]).group(1))  # type: ignore[union-attr]
            i += 1

        my_character = _read_multi(lines, i, pid, "my character")
        i = _MULTI_END

        if i >= len(lines):
            raise ValueError(f"{pid}: missing my appearance after my character")
        m = _FIELD.match(lines[i])
        if not m or m.group(1) != "my appearance":
            raise ValueError(f"{pid}: expected 'my appearance:' on line {i}")
        my_appearance = m.group(2).strip()
        i += 1

        you_character = _read_multi(lines, i, pid, "you character")
        i = _MULTI_END

        if i >= len(lines):
            raise ValueError(f"{pid}: missing you appearance after you character")
        m = _FIELD.match(lines[i])
        if not m or m.group(1) != "you appearance":
            raise ValueError(f"{pid}: expected 'you appearance:' on line {i}")
        you_appearance = m.group(2).strip()
        i += 1

        profiles.append(Profile(
            id=pid,
            interests=interests,
            my_character=my_character,
            my_appearance=my_appearance,
            you_character=you_character,
            you_appearance=you_appearance,
        ))
    return profiles


def _read_multi(lines: list[str], i: int, pid: str, field: str) -> str:
    """Read a multi-line block until the next known field marker. Each
    contribution is stripped of leading whitespace and joined with spaces.
    Lines that don't start with a known field are still treated as part of
    the block (handles hand-typed input with inconsistent indentation)."""
    if i >= len(lines) or not _MULTI_START.match(lines[i]) or _MULTI_START.match(lines[i]).group(1) != field:  # type: ignore[union-attr]
        raise ValueError(f"{pid}: expected '{field}: |' on line {i}")
    i += 1
    parts: list[str] = []
    while i < len(lines):
        line = lines[i]
        if _ID_HEADER_END.match(line):
            break
        if _NEXT_FIELD.match(line):
            break
        parts.append(line.strip())
        i += 1
    global _MULTI_END
    _MULTI_END = i
    return " ".join(parts)


_MULTI_END = 0


# --- Embedding text construction -----------------------------------------

def build_self_text(profile: Profile) -> str:
    """The "who I am" text. Includes interests — they describe the speaker."""
    interests = ", ".join(profile["interests"])
    return (
        f"Interests: {interests}.\n"
        f"[Self] Character: {profile['my_character']}\n"
        f"[Self] Appearance: {profile['my_appearance']}"
    )


def build_target_text(profile: Profile) -> str:
    """The "what I want in a partner" text. No interests — those describe self."""
    return (
        f"[Target] Character: {profile['you_character']}\n"
        f"[Target] Appearance: {profile['you_appearance']}"
    )


# --- Embedding ------------------------------------------------------------

def _embed_batch(client: OpenAI, texts: list[str], batch_size: int = 100) -> np.ndarray:
    out: list[list[float]] = []
    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        resp = client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        out.extend(item.embedding for item in resp.data)
    return np.asarray(out, dtype=np.float32)


def embed_profiles(
    profiles: list[Profile],
    api_key: str | None = None,
    batch_size: int = 100,
) -> tuple[np.ndarray, np.ndarray]:
    """Returns (self_embeddings, target_embeddings), each (N, 1536) float32."""
    client = OpenAI(api_key=api_key or os.environ.get("OPENAI_API_KEY"))
    self_texts = [build_self_text(p) for p in profiles]
    target_texts = [build_target_text(p) for p in profiles]
    self_emb = _embed_batch(client, self_texts, batch_size=batch_size)
    target_emb = _embed_batch(client, target_texts, batch_size=batch_size)
    assert self_emb.shape == (len(profiles), EMBEDDING_DIM)
    assert target_emb.shape == (len(profiles), EMBEDDING_DIM)
    return self_emb, target_emb


# --- CLI ------------------------------------------------------------------

def save_embeddings(
    profiles: list[Profile],
    self_emb: np.ndarray,
    target_emb: np.ndarray,
    out_dir: Path,
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    np.save(out_dir / "profile_embeddings_self.npy", self_emb)
    np.save(out_dir / "profile_embeddings_target.npy", target_emb)
    (out_dir / "profile_ids.json").write_text(
        json.dumps([p["id"] for p in profiles], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    import sys
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/profiles_descriptions.txt")
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("data")
    profiles = parse_profiles(src)
    print(f"parsed {len(profiles)} profiles from {src}")
    print()
    print("=== sample self_text ===")
    print(build_self_text(profiles[0]))
    print()
    print("=== sample target_text ===")
    print(build_target_text(profiles[0]))
    print()
    self_emb, target_emb = embed_profiles(profiles)
    print(f"self_embeddings:   {self_emb.shape} {self_emb.dtype}")
    print(f"target_embeddings: {target_emb.shape} {target_emb.dtype}")
    save_embeddings(profiles, self_emb, target_emb, out_dir)
    print(f"saved to {out_dir}/profile_embeddings_self.npy + profile_embeddings_target.npy + profile_ids.json")