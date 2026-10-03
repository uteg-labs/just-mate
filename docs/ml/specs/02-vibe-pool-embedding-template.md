# T02 — Vibe pool + embedding template

**Goal:** canonical vibe card pool and the embedding-text-template module that turns a profile dict into the sectioned string sent to OpenAI. Cached deterministic — same user → same vibe + same embedding text forever.

**Time:** 30 min.

**Prerequisites:** T01.

---

## What we lock in here

- **Vibe format:** `Trait — concrete` × 5 sentences per vibe card. EN. 60 ± 20 words per card.
- **Embedding template (Option B from brainstorming):**
  ```
  Intent: {sorted intents}.
  Interests: {sorted interests}.
  Vibe: {full vibe card}.
  ```
- **Banner vibe format:** quoted string, no sectioning — sent in `match_offer.vibe` (PROTOCOL.md).
- **Determinism:** `pick_vibe(user_id)` is `sha256(user_id) % len(pool)`. One user → one vibe, always.
- **Sorting:** intents and interests sorted alphabetically before embedding (reproducibility, no semantic difference).
- **`identity`:** no nickname, no demographic, no position in embedding text.

---

## Files to create

```
ml/
├── canned/
│   └── vibes.json         # the 20-vibe pool
├── src/just_mate_ml/
│   └── embedding_text.py  # profile_to_embedding_text, profile_to_banner_vibe, pick_vibe
└── tests/
    ├── test_vibes.py
    └── test_embedding_text.py
```

---

## `ml/canned/vibes.json`

```json
{
  "_format": "trait-concrete-5",
  "_constraints": {
    "sentences": 5,
    "sentence_pattern": "Trait — concrete",
    "separator": " — ",
    "language": "en",
    "min_words": 40,
    "max_words": 80,
    "target_words": 60
  },
  "vibes": [
    "Quietly funny — the kind of joke that lands three seconds late and you realise it's been working on you the whole time. Listens more than talks — picks up on what you didn't say and puts it gently on the table. Reads people in the first minute — knows when to push, when to back off, when to just nod. Loses entire evenings to good conversations — forgets to check the time until the bar is closing. Picks the bar by the lighting — judges the wine list before the menu, the music before the food.",

    "Loud laugher, bad puns, knows every bar's happy hour by heart — will order for the table before you sit down. Sketchbook in one hand, espresso in the other — talks about cinema like other people talk about the weather. The friend who suggests the weird restaurant — remembers what you liked six orders and three cities ago. Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. Picks the bar by the lighting — judges the wine list before the menu, the music before the food.",

    "Early bird, slow walker, will outlast you in any conversation — prefers a long dinner to a short party. Reads people in the first minute — knows when to push, when to back off, when to just nod. Best ideas arrive after the second coffee and the first bad pun — morning meetings get a no from me. Walks into the room like they've been there for hours — lowers the temperature of any conversation by exactly one degree. Two drinks in and you know my whole life story.",

    "Deadpan delivery, hot takes on everything — will try any food once, even the ones you warn them about. Will recommend a song before you finish your sentence — has a playlist for every mood you haven't named yet. Sketches plans on napkins — solves your problem before you've finished describing it. Explains things with diagrams you didn't ask for — will debug your calendar app over coffee. Has a strong opinion about every endurance sport — will race you up the escalator if you let them.",

    "Will recommend a song before you finish your sentence — has a playlist for every mood you haven't named yet. Best ideas arrive after the second coffee and the first bad pun — morning meetings get a no from me. Writes haiku when nervous — will propose a small art project instead of making small talk. Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. The friend who suggests the weird restaurant — remembers what you liked six orders and three cities ago.",

    "Happier with a coffee and a chapter than a club — asks the kind of questions that turn small talk into real talk. Reads people in the first minute — knows when to push, when to back off, when to just nod. Sketchbook in one hand, espresso in the other — talks about cinema like other people talk about the weather. Best ideas arrive after the second coffee and the first bad pun — morning meetings get a no from me. Walks into the room like they've been there for hours — lowers the temperature of any conversation by exactly one degree.",

    "Hiking boots and headphones are my two personalities — suggests a trail before suggesting a bar. Has a strong opinion about every endurance sport — will race you up the escalator if you let them. Reads people in the first minute — knows when to push, when to back off, when to just nod. Owns too many plants, mentions one dog in every third sentence — will show you photos without being asked. Loses entire evenings to good conversations — forgets to check the time until the bar is closing.",

    "Sketchbook in one hand, espresso in the other — talks about cinema like other people talk about the weather. Explains things with diagrams you didn't ask for — will debug your calendar app over coffee. Will recommend a song before you finish your sentence — has a playlist for every mood you haven't named yet. Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. The friend who suggests the weird restaurant — remembers what you liked six orders and three cities ago.",

    "Has lived in three cities and loved two of them — will tell you where to eat in any neighbourhood you've never heard of. The friend who suggests the weird restaurant — remembers what you liked six orders and three cities ago. Best ideas arrive after the second coffee and the first bad pun — morning meetings get a no from me. Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. Walks into the room like they've been there for hours — lowers the temperature of any conversation by exactly one degree.",

    "Sketches plans on napkins — solves your problem before you've finished describing it. Explains things with diagrams you didn't ask for — will debug your calendar app over coffee. Reads people in the first minute — knows when to push, when to back off, when to just nod. Deadpan delivery, hot takes on everything — will try any food once, even the ones you warn them about. Two drinks in and you know my whole life story.",

    "Owns too many plants, mentions one dog in every third sentence — will show you photos without being asked. Hiking boots and headphones are my two personalities — suggests a trail before suggesting a bar. Reads people in the first minute — knows when to push, when to back off, when to just nod. Writes haiku when nervous — will propose a small art project instead of making small talk. The friend who suggests the weird restaurant — remembers what you liked six orders and three cities ago.",

    "Has a strong opinion about every endurance sport — will race you up the escalator if you let them. Hiking boots and headphones are my two personalities — suggests a trail before suggesting a bar. Deadpan delivery, hot takes on everything — will try any food once, even the ones you warn them about. Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. Two drinks in and you know my whole life story.",

    "Explains things with diagrams you didn't ask for — will debug your calendar app over coffee. Sketchbook in one hand, espresso in the other — talks about cinema like other people talk about the weather. Reads people in the first minute — knows when to push, when to back off, when to just nod. Best ideas arrive after the second coffee and the first bad pun — morning meetings get a no from me. Loses entire evenings to good conversations — forgets to check the time until the bar is closing.",

    "The friend who suggests the weird restaurant — remembers what you liked six orders and three cities ago. Has lived in three cities and loved two of them — will tell you where to eat in any neighbourhood you've never heard of. Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. Will recommend a song before you finish your sentence — has a playlist for every mood you haven't named yet. Two drinks in and you know my whole life story.",

    "Skeptical of everything, loyal to the people who pass the test — will mock your taste, then quietly send a better option. Reads people in the first minute — knows when to push, when to back off, when to just nod. Sketchbook in one hand, espresso in the other — talks about cinema like other people talk about the weather. Best ideas arrive after the second coffee and the first bad pun — morning meetings get a no from me. Walks into the room like they've been there for hours — lowers the temperature of any conversation by exactly one degree.",

    "Best ideas arrive after the second coffee and the first bad pun — morning meetings get a no from me. Writes haiku when nervous — will propose a small art project instead of making small talk. Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. Reads people in the first minute — knows when to push, when to back off, when to just nod. Loses entire evenings to good conversations — forgets to check the time until the bar is closing.",

    "Will pick the bar with the best lighting and stay for one more round — asks bartenders for the off-menu story. Has lived in three cities and loved two of them — will tell you where to eat in any neighbourhood you've never heard of. Sketchbook in one hand, espresso in the other — talks about cinema like other people talk about the weather. Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. Walks into the room like they've been there for hours — lowers the temperature of any conversation by exactly one degree.",

    "Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. Listens more than talks — picks up on what you didn't say and puts it gently on the table. Reads people in the first minute — knows when to push, when to back off, when to just nod. Will recommend a song before you finish your sentence — has a playlist for every mood you haven't named yet. Two drinks in and you know my whole life story.",

    "Writes haiku when nervous — will propose a small art project instead of making small talk. Sketchbook in one hand, espresso in the other — talks about cinema like other people talk about the weather. Asks the second question — remembers what you said three conversations ago and brings it back at exactly the right time. Best ideas arrive after the second coffee and the first bad pun — morning meetings get a no from me. Two drinks in and you know my whole life story.",

    "Walks into the room like they've been there for hours — lowers the temperature of any conversation by exactly one degree. Reads people in the first minute — knows when to push, when to back off, when to just nod. Listens more than talks — picks up on what you didn't say and puts it gently on the table. Best ideas arrive after the second coffee and the first bad pun — morning meetings get a no from me. Loses entire evenings to good conversations — forgets to check the time until the bar is closing."
  ]
}
```

> **Note:** we deliberately repeat sentences across vibes. Pool diversity matters, sentence diversity doesn't — same handful of good sentences reshuffled is fine.

---

## `ml/src/just_mate_ml/embedding_text.py`

```python
"""Profile → embedding text / banner vibe.

Three public functions:
- pick_vibe(user_id)        → vibe string (deterministic per user_id)
- profile_to_embedding_text(profile) → string for OpenAI embedding
- profile_to_banner_vibe(profile)    → quoted string for PROTOCOL.md match_offer.vibe

Determinism contract: same user_id → same vibe across runs.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import TypedDict


class Vibe(TypedDict):
    pass  # vibes are plain strings


class Profile(TypedDict, total=False):
    intents: list[str]
    interests: list[str]
    vibe: str


_POOL_CACHE: list[str] | None = None
_POOL_PATH = Path(__file__).resolve().parents[2] / "canned" / "vibes.json"


def _load_pool() -> list[str]:
    global _POOL_CACHE
    if _POOL_CACHE is None:
        with open(_POOL_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        _POOL_CACHE = data["vibes"]
    return _POOL_CACHE


def pick_vibe(user_id: str) -> str:
    """Hash user_id, mod-pool → deterministic per-user vibe."""
    pool = _load_pool()
    h = int(hashlib.sha256(user_id.encode("utf-8")).hexdigest(), 16)
    return pool[h % len(pool)]


def profile_to_embedding_text(profile: Profile) -> str:
    """Sectioned template B — sent to text-embedding-3-small."""
    intents = ", ".join(sorted(profile.get("intents", [])))
    interests = ", ".join(sorted(profile.get("interests", [])))
    vibe = profile["vibe"].strip()
    return (
        f"Intent: {intents}.\n"
        f"Interests: {interests}.\n"
        f"Vibe: {vibe}."
    )


def profile_to_banner_vibe(profile: Profile) -> str:
    """Quoted vibe string for match_offer.vibe (PROTOCOL.md)."""
    return f'"{profile["vibe"].strip()}"'
```

---

## Tests

### `tests/test_vibes.py`

```python
from just_mate_ml.embedding_text import pick_vibe


def test_deterministic_per_user():
    """Same user_id → same vibe across calls."""
    assert pick_vibe("u_abc") == pick_vibe("u_abc")


def test_distinct_users_can_share_vibe():
    """Hash collision is allowed; some pairs will share."""
    ids = [f"u_{i}" for i in range(100)]
    vibes = {pick_vibe(i) for i in ids}
    # at 100 random ids we should have many distinct vibes, not all the same
    assert len(vibes) >= 5


def test_vibe_format_trait_concrete_5():
    """Every pool entry has 5 sentences, each containing an em-dash."""
    import json
    from pathlib import Path
    pool_path = Path(__file__).resolve().parents[1] / "canned" / "vibes.json"
    with open(pool_path) as f:
        pool = json.load(f)["vibes"]
    for vibe in pool:
        sentences = [s.strip() for s in vibe.split(".") if s.strip()]
        assert len(sentences) == 5, f"vibe has {len(sentences)} sentences: {vibe[:80]}"
        for s in sentences:
            assert " — " in s, f"sentence missing em-dash: {s}"


def test_vibe_pool_size_20():
    import json
    from pathlib import Path
    pool_path = Path(__file__).resolve().parents[1] / "canned" / "vibes.json"
    with open(pool_path) as f:
        pool = json.load(f)["vibes"]
    assert len(pool) == 20
```

### `tests/test_embedding_text.py`

```python
from just_mate_ml.embedding_text import (
    profile_to_embedding_text,
    profile_to_banner_vibe,
    pick_vibe,
)


def _demo_profile(user_id):
    return {
        "intents": ["beer"],
        "interests": ["rock", "hiking", "dogs"],
        "vibe": pick_vibe(user_id),
    }


def test_intents_sorted_alphabetically():
    """Order in input must not leak into embedding text."""
    profile = _demo_profile("u_abc")
    profile["intents"] = ["music", "beer", "friends"]  # input order
    text = profile_to_embedding_text(profile)
    # must come out sorted
    assert "Intent: beer, friends, music." in text


def test_interests_sorted_alphabetically():
    profile = _demo_profile("u_abc")
    profile["interests"] = ["rock", "dogs", "hiking", "tech"]  # input order
    text = profile_to_embedding_text(profile)
    assert "Interests: dogs, hiking, rock, tech." in text


def test_three_sections_in_canonical_order():
    profile = _demo_profile("u_abc")
    text = profile_to_embedding_text(profile)
    assert text.startswith("Intent:")
    # Vibe section must come after Interests
    i_intent = text.index("Intent:")
    i_interests = text.index("Interests:")
    i_vibe = text.index("Vibe:")
    assert i_intent < i_interests < i_vibe


def test_banner_vibe_quoted():
    profile = _demo_profile("u_abc")
    banner = profile_to_banner_vibe(profile)
    assert banner.startswith('"') and banner.endswith('"')
    # No embedded section markers — banner shows the raw vibe string
    assert "Intent:" not in banner
    assert "Interests:" not in banner


def test_full_example_matches_spec():
    """Locks in the canonical example from the brainstorming session."""
    profile = {
        "intents": ["beer"],
        "interests": ["rock", "hiking", "dogs", "tech"],
        "vibe": (
            "Quietly funny — the kind of joke that lands three seconds late. "
            "Listens more than talks — picks up on what you didn't say. "
            "Reads people in the first minute — knows when to push. "
            "Loses entire evenings to good conversations. "
            "Picks the bar by the lighting."
        ),
    }
    text = profile_to_embedding_text(profile)
    assert text == (
        "Intent: beer.\n"
        "Interests: dogs, hiking, rock, tech.\n"
        "Vibe: Quietly funny — the kind of joke that lands three seconds late. "
        "Listens more than talks — picks up on what you didn't say. "
        "Reads people in the first minute — knows when to push. "
        "Loses entire evenings to good conversations. "
        "Picks the bar by the lighting."
    )
```

---

## CLI

```bash
cd ml
uv run pytest tests/test_vibes.py tests/test_embedding_text.py -v
```

---

## Definition of Done

- [ ] `ml/canned/vibes.json` exists with `_format`, `_constraints`, and 20 vibes
- [ ] Every vibe has exactly 5 sentences, each with an em-dash (test enforces)
- [ ] `pick_vibe(user_id)` is deterministic per user_id
- [ ] `profile_to_embedding_text` sorts intents/interests alphabetically
- [ ] Banner vibe is wrapped in double quotes, no section markers
- [ ] All 8 tests pass
- [ ] Canonical example from brainstorming locked as `test_full_example_matches_spec`

---

## Common pitfalls

| Symptom | Fix |
|---|---|
| `FileNotFoundError: vibes.json` | check path in `_POOL_PATH`; should resolve to `ml/canned/vibes.json` |
| Pickle tests fail with import error | run `uv add pytest` (already in T01) |
| `vibe has N sentences` test fails for some entry | regenerate that entry to the right shape — don't relax the test |
| Em-dash appears as `–` (en-dash) or `-` (hyphen) | it's `—` (em-dash, U+2014) — same character as `Trait — concrete` |