# just-mate — Profile Embedding Card

> **Canonical Reference**

Source of truth for how a profile becomes:

1. `embedding_text` → OpenAI `text-embedding-3-small` (1536d)
2. `banner_vibe` → `match_offer.vibe` (`PROTOCOL.md`)

Each card has the same three sections, in the same order.

---

## Profile

```yaml
profile:
  id: "u_demo_01"
  intents:
    - beer
  interests:
    - rock
    - hiking
    - dogs
    - tech
  vibe: |
    Quietly funny — the kind of joke that lands three seconds late and you realise
    it's been working on you the whole time. Listens more than talks — picks up on
    what you didn't say and puts it gently on the table. Reads people in the first
    minute — knows when to push, when to back off, when to just nod. Loses entire
    evenings to good conversations — forgets to check the time until the bar is
    closing. Picks the bar by the lighting — judges the wine list before the menu,
    the music before the food.
```

---

## `embedding_text`

> Sent to OpenAI `text-embedding-3-small`.
>
> Sectioned template B. Vibe as 3rd section, intact.

```yaml
embedding_text: |
  Intent: beer.
  Interests: dogs, hiking, rock, tech.
  Vibe: Quietly funny — the kind of joke that lands three seconds late and you realise it's been working on you the whole time. Listens more than talks — picks up on what you didn't say and puts it gently on the table. Reads people in the first minute — knows when to push, when to back off, when to just nod. Loses entire evenings to good conversations — forgets to check the time until the bar is closing. Picks the bar by the lighting — judges the wine list before the menu, the music before the food.
```

---

## `banner_vibe`

> Returned in `match_offer.vibe`, shown quoted on match banner.

```yaml
banner_vibe: |
  "Quietly funny — the kind of joke that lands three seconds late and you realise
  it's been working on you the whole time. Listens more than talks — picks up on
  what you didn't say and puts it gently on the table. Reads people in the first
  minute — knows when to push, when to back off, when to just nod. Loses entire
  evenings to good conversations — forgets to check the time until the bar is
  closing. Picks the bar by the lighting — judges the wine list before the menu,
  the music before the food."
```

---

## Stats

```yaml
stats:
  intents_count: 1
  interests_count: 4
  vibe_sentences: 5
  vibe_words: 76
  vibe_pattern: "trait-concrete-5"   # each sentence: "Trait — concrete"
  separator: " — "
  embedding_tokens_estimate: ~120   # text-embedding-3-small: ~1 token / 4 chars
```
