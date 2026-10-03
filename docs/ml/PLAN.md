# just-mate — ML plan

> **Goal**: extract rich text descriptions from user photos via an LLM API, then match profiles using a Siamese text-embedding model. **No face detection, no ONNX, no embeddings beyond text.**

## Pipeline

```
photo + (intents, interests)
   ↓
LLM API (GPT-4o-mini vision)         ← T07
   ↓
description text: 2-3 sentences covering
   appearance + personality + preferences
   ↓
profile text: "Intent: ... Interests: ... Description: ..."
   ↓
OpenAI text-embedding-3-small (1536d)   ← T03
   ↓ e
Shared Encoder (1536 → 128)              ← T04 (trained)
   ↓ z
Match Head (257 → 1)                     ← T04 (trained)
   ↓
sigmoid → score ∈ [0, 1]                ← T06 (evaluated)
```

A single Siamese text-based pipeline. The photo enters once, via the LLM API, and produces a text description. Everything downstream is text embeddings.

## Tasks

| # | Task | Status |
|---|---|---|
| 01 | Project bootstrap (Python + deps) | required |
| 02 | 1000 synthetic profiles + descriptions | required (descriptions come from T07 or canned pool) |
| 03 | Pair-label dataset (OpenAI text embeddings + labels) | required |
| 04 | Model architecture (Encoder + Match Head) | required |
| 05 | Training | required |
| 06 | Evaluation (model vs rule-based baseline) | required |
| **07** | **Photo → LLM → text description** | **primary deliverable** |

## T07 architecture

```
photo_path + (intents, interests)
   ↓
[OpenAI gpt-4o-mini with vision]
   prompt: "Describe this person: appearance, personality, who they're looking for"
   ↓
description: "30-year-old athletic man with short dark hair, outgoing. 
              Looking for active women aged 25-35 who enjoy outdoors."
   ↓
saved to profile["description"]
```

- **Model**: `gpt-4o-mini` (vision-capable, ~$1-2 for 1000 photos)
- **Input**: photo (base64 in message) + intent/interests chips as text
- **Output**: 2-3 sentence plain prose description

## Profile shape

```python
{
  "id": "u_000001",
  "intents": ["beer", "friends"],            # text signal
  "interests": ["rock", "hiking", "dogs"],   # text signal
  "description": "30-year-old athletic man with short dark hair, ...",  # NEW (from LLM)
  "photo_path": "/path/to/photo.jpg",         # for re-running T07
}
```

## Embedding text

```
Intent: beer, friends.
Interests: dogs, hiking, rock, tech.
Description: 30-year-old athletic man with short dark hair, outgoing personality. Looking for active women aged 25-35 who enjoy outdoors.
```

~150-300 tokens per profile. ~$0.001 per profile to embed.

## Cost estimate (1000 profiles)

- T07 LLM calls (gpt-4o-mini vision): ~$1-2 for 1000 photos
- T03 OpenAI text embeddings: ~$0.001 for 1000 profiles
- T05 training: ~free (CPU, 1000 samples)
- **Total: ~$2-3 for end-to-end M0 pipeline**

## Out of scope (other roles)

- Photo upload + storage — backend
- Profile edit UI — mobile role
- ONNX / C++ binary serving — backend (only needed if model goes to production; M0 ships rule-based baseline)
- Bun/Elysia integration — backend

## File layout

```
ml/
├── pyproject.toml
├── data/
│   ├── profiles.jsonl             # 1000 profiles incl. description (from T07)
│   ├── embeddings.npy             # 1000 × 1536 (text embeddings only)
│   ├── user_id_index.json
│   ├── pairs.npz
│   └── photos/                    # input for T07 (one photo per profile, by id)
├── src/just_mate_ml/
│   ├── profile_text.py            # includes description
│   ├── describe.py                # T07: photo + LLM → description (NEW)
│   ├── train.py
│   ├── evaluate.py
│   ├── data/
│   │   ├── profiles.py            # now generates/loads with description
│   │   ├── pairs.py
│   │   ├── triplets.py
│   │   ├── embed.py
│   │   ├── compat.py
│   │   └── baseline.py
│   └── model/
│       ├── encoder.py
│       ├── head.py
│       ├── losses.py
│       └── siamese.py
├── checkpoints/
│   └── model_v0.pt
├── reports/
│   └── eval_report.md
└── tests/
```