from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="JustMate ML")


class Profile(BaseModel):
    id: str
    interests: list[str]
    intents: list[str]


class ScoreRequest(BaseModel):
    self: Profile
    candidates: list[Profile]


class Score(BaseModel):
    id: str
    score: float


def baseline(a: Profile, b: Profile) -> float:
    left, right = set(a.interests), set(b.interests)
    union = left | right
    jaccard = len(left & right) / len(union) if union else 0
    return 0.7 * jaccard + 0.3 * min(1, len(set(a.intents) & set(b.intents)))


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


# mirrors server/src/compat.ts until the Shared Encoder + Match Head land (ML-MATCHING §6)
@app.post("/score")
def score(req: ScoreRequest) -> list[Score]:
    return [Score(id=c.id, score=baseline(req.self, c)) for c in req.candidates]
