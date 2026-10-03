"""V2 profile generator — expanded pools + parallel generation.

Pools are ~3x larger than v1 so that 70% of 25k profiles have a unique vibe
combination (empirically: C(60, 2-5) combos >> 25k samples).

Parallel: each worker process generates a slice of profile IDs. Workers
don't share RNG, so they don't know what other profiles look like — same as
the team's "real data" feel.

Profile fields (same as v1):
  interests (list)
  my character    (multi-line, 2-5 sentences of self personality)
  my appearance   (single line, physical description of self)
  you character   (multi-line, 1-3 sentences of desired partner's personality)
  you appearance  (single line, physical description of desired partner)
"""
from __future__ import annotations

import hashlib
import json
import multiprocessing as mp
import random
import textwrap
from concurrent.futures import ProcessPoolExecutor, as_completed
from functools import partial
from pathlib import Path


# --- Vocabularies ---------------------------------------------------------

INTEREST_POOL: tuple[str, ...] = (
    # core (v1)
    "beer", "coffee", "boardgames", "rock", "techno", "hiking",
    "cinema", "books", "travel", "tech", "dogs", "climbing",
    "photography", "food",
    # hierarchical parents (so generators can use broad or narrow terms)
    "music", "outdoors", "fitness", "literature", "art", "social",
    # music subgenres (already some in user-added profiles)
    "jazz", "classical_music", "indie_folk", "electronic", "hip_hop",
    # food subcategories
    "cooking", "baking", "street_food", "vegan_cooking", "fine_dining",
    # outdoor activities
    "camping", "running", "cycling", "climbing", "backpacking", "swimming",
    # cultural
    "museums", "theater", "concerts", "festivals", "cinema",
    # lifestyle
    "meditation", "minimalism", "gardening", "pets", "cats", "dogs",
    # intellectual
    "science", "philosophy", "history", "languages",
    # games
    "video_games", "boardgames", "chess",
)

GENDERS: tuple[str, ...] = (
    "a guy", "a woman", "a person", "a friend", "a buddy",
    "someone", "a stranger",
)


# --- my character (60 sentences) -----------------------------------------
# Style: "Trait — concrete" with em-dash. Each profile picks 2-5.

MY_CHARACTER_SENTENCES: tuple[str, ...] = (
    # === v1 base (kept for continuity) ===
    "Quietly funny — the kind of joke that lands three seconds late and you realise it's been working on you the whole time",
    "Listens more than talks — picks up on what you didn't say and puts it gently on the table",
    "Reads people in the first minute — knows when to push, when to back off, when to just nod",
    "Loses entire evenings to good conversations — forgets to check the time until the bar is closing",
    "Picks the bar by the lighting — judges the wine list before the menu, the music before the food",
    "Old soul in a young body — finds comfort in jazz, foreign cinema, and rain against the window",
    "A good listener — hears the question behind the question, the joke behind the pause",
    "Picks restaurants by their bread basket, not their Instagram",
    "Reads people like novels — sometimes you turn out to be a short story, sometimes the kind of book that ruins your week",
    "Slow burn — takes three meetings to decide if he likes you, and then never shuts up about you",
    "Picks hobbies like vinyl — commits hard, never sells, occasionally pretends to understand them better than he does",
    "Believes the best nights start with a bad idea and end with the same song on repeat",
    "Quietly intense — observes more than she speaks, then drops one sentence that rewrites the conversation",
    "Believes in long lunches, longer books, and the kind of friend you can sit next to in silence and not need to fill it",
    "Judges a city by its light, a person by their first question",
    "Patient like a mountain — takes weather, detours, and bad jokes in stride",
    "Picks their words the way they pick their routes — slowly, on purpose, with the occasional surprise at the top",
    "Believes the best conversations happen on the way down, not at the summit",
    "Warm before they are sharp — soft on entry, leaves a small bruise you thank them for later",
    "Remembers the small things — your coffee order, the dog you had ten years ago, the song on the radio that morning",
    "Believes the right silence is worth more than the wrong sentence",
    "Reads strangers like weather — knows who's about to rain, who's about to clear up",
    "Picks friends the way they pick coffee — slow, deliberate, and a little obsessive",
    "Lives for the second drink — the part of the conversation where people stop being polite and start being honest",
    "Watches the room before they enter it — notices who is uncomfortable, who is bored, who is pretending",
    "Believes in good lighting and better timing — both are usually wrong, both are usually worth it",
    "Saves the best line for last — knows the last thing you hear is the thing you remember",
    "Will argue about pizza for an hour and then order exactly what you wanted",
    "Knows when to leave the party — usually twenty minutes before everyone else realises it's over",
    "Treats introductions like recipes — keeps the essentials, swaps the boring bits",
    # === v2 extensions: new angles ===
    "Asks better questions than they answer — leaves every conversation feeling a little more interesting than it started",
    "Believes most problems are 80% solved by sleeping on them — and the other 20% by talking to the right person",
    "Reads body language before names — knows who is bored, who is curious, who is pretending to be fine",
    "Has more hobbies than friends — usually the right way around for both",
    "Will cancel plans to read — and not feel guilty about it",
    "Believes good wine is cheaper than therapy, on balance",
    "Counts bookshops before restaurants when landing in a new city",
    "Has a playlist for every mood and a mood for every playlist",
    "Will recommend a book mid-sentence and not let you finish the one you're reading",
    "Picks the table by the light, not the menu",
    "Believes most disagreements are just two people missing the same word",
    "Will outlast every party and arrive first at every breakfast",
    "Remembers faces longer than names — and the stories behind them longer than either",
    "Believes the best gift is the one they would have bought themselves but didn't",
    "Has strong opinions about coffee, weaker ones about most other things",
    "Believes silence is a feature of good conversation, not a bug",
    "Picks friends the way some people pick stocks — slow research, then goes all in",
    "Treats strangers like old friends and old friends like strangers — on purpose",
    "Counts cafes the way other people count countries",
    "Will share the last bite but not the last word",
    "Believes most dating advice is for someone else",
    "Has a strong opinion about pizza and a stronger one about wine",
    "Reads strangers like weather, books like maps, and people like tables — pick the right light, the rest follows",
    "Believes the second date is the real first one",
    "Has read the same Murakami four times and noticed something new every time",
    "Will lose an argument on purpose if it makes you laugh",
    "Knows when to be early and when to be deliberately late",
    "Has at least one hobby they're slightly embarrassed by",
    "Believes good lighting is the cheapest confidence trick going",
    "Treats plans like weather forecasts — useful for the morning, useless by evening",
)


# --- you character (60 sentences) ----------------------------------------

YOU_CHARACTER_SENTENCES: tuple[str, ...] = (
    # === v1 base ===
    "Doesn't take themselves too seriously — picks a bar by the playlist, not the price list",
    "Knows what they want and orders it without hesitation",
    "Loves good coffee more than good conversation, and good conversation more than both",
    "Can out-walk and out-laugh the speaker — without trying",
    "Reads the menu before they sit down and orders for both without asking",
    "Knows when to be loud and when to be quiet",
    "Tall and a little strange — takes the long way home on purpose",
    "Laughs at their own typos first",
    "No posers, no small talk enthusiasts",
    "Treats strangers like old friends and old friends like strangers",
    "Remembers a drink three meetings in",
    "Picks the wine, leaves the music to the speaker",
    "Reads the back of the book before the front",
    "Knows a long walk beats a long conversation and a long conversation beats both",
    "Shows up twenty minutes late but always brings the wine",
    "Will argue about pizza for an hour, then order what the speaker wants",
    "Has at least one strong opinion about vinyl",
    "Knows when to leave the party before it gets embarrassing",
    "Believes a good library is worth more than a good therapist",
    "Reads strangers like weather — knows who's about to clear up",
    "Saves the best line for last",
    "Will share the last bite but not the last word",
    "Knows how to fix a bike and order wine without a phone",
    "Has at least one friend who thinks they're the funny one",
    "Believes the second date is the real one",
    "Counts bookshops, not countries",
    "Has read the same Murakami four times and noticed something new every time",
    "Will lose an argument on purpose if it makes the speaker laugh",
    "Knows when to be early and when to be deliberately late",
    "Picks music by mood, never by genre",
    "Has at least one hobby they're slightly embarrassed by",
    # === v2 extensions ===
    "Will read on a first date — and somehow get a second one anyway",
    "Believes most disagreements are about vocabulary, not values",
    "Reads the back of the book before the front, the credits before the film",
    "Has a strong opinion about pizza and a stronger one about wine",
    "Believes good lighting beats good conversation — both is ideal",
    "Has at least one tattoo and one regret, and won't tell you which is which",
    "Counts cafes in every new city before counting anything else",
    "Believes the second date is the only one that matters",
    "Knows when to leave a party twenty minutes before everyone else",
    "Picks the wine, leaves the playlist to the speaker",
    "Reads strangers like weather, books like maps, and people like tables",
    "Believes most plans are weather forecasts — useful for the morning, useless by evening",
    "Will argue about coffee for an hour, then order what you ordered",
    "Has at least one strong opinion about typography",
    "Believes a good library is worth more than any apartment",
    "Knows how to fix a flat, change a tire, and order wine without looking at the menu",
    "Has at least one friend who thinks they're the funny one — usually correctly",
    "Believes silence is a feature of good conversation, not a bug",
    "Picks music by mood, never by genre or decade",
    "Has at least one hobby they're slightly embarrassed by — usually cooking or running",
    "Believes good wine is cheaper than therapy, on balance",
    "Will out-walk and out-laugh the speaker, then ask if you want to go again",
    "Knows the bartender at three different places by name",
    "Believes a long walk beats a long conversation and a long conversation beats both",
    "Has read the same book five times and never noticed the ending before",
    "Believes most advice is for someone else — and most of theirs is, too",
    "Counts the things that aren't on Instagram",
    "Has a strong opinion about coffee and a stronger one about how it's made",
    "Believes the best gift is the one they would have bought themselves but didn't",
    "Knows when to be loud, when to be quiet, and when to just leave the room",
)


# --- appearance (60 traits) -----------------------------------------------

APPEARANCE_TRAITS: tuple[str, ...] = (
    # hair + eyes + build combos
    "tall, dark wavy hair, square jaw, easy tan",
    "light brown hair to mid-back, green eyes, freckles across the nose, slim build",
    "dark wavy hair pushed back, hazel eyes, square jaw, light stubble, lean build",
    "thinning sandy hair combed to one side, gray-blue eyes, round glasses, weathered tan",
    "jet-black hair to mid-back, dark brown eyes, sharp cheekbones, no makeup most days, petite build",
    "black curly hair, short on the sides, ice-blue eyes, square jaw, athletic build",
    "shoulder-length auburn hair, dimples, athletic build, medium height",
    "bald with a well-kept beard, warm brown eyes, broad shoulders, stocky build",
    "long black braids, warm smile, easy tan, lean build",
    "salt-and-pepper curls, kind eyes, weathered tan, wiry build",
    "buzz cut, ice-blue eyes, lean build, square shoulders",
    "afro, warm smile, broad shoulders, tall and gentle",
    "straight bob, glasses, petite build, walks fast",
    "soft voice, kind eyes, petite frame, short brown hair",
    "lanky, weather-tanned, hazel eyes, shaggy hair",
    "stocky build, shaved head, kind eyes, easy smile",
    "long red curls, green eyes, freckled, average height",
    "dark hair in a low bun, deep brown eyes, soft jaw, slim",
    "shaggy blonde hair, blue eyes, soft tan, lean build",
    "tall and angular, sharp cheekbones, deep-set eyes, dark hair",
    "round face, black hair in two braids, brown eyes, average height",
    "long platinum hair, pale skin, blue eyes, willowy build",
    "shoulder-length chestnut hair, hazel eyes, soft jaw, medium height",
    "dreadlocks to shoulders, dark eyes, lean build, easy smile",
    "fade cut, deep brown skin, kind eyes, broad shoulders, tall and gentle",
    "cropped silver hair, sharp eyes, square jaw, medium build",
    "soft curls to the jawline, deep brown eyes, full lips, average height",
    "close-cropped curls, warm brown eyes, square shoulders, athletic build",
    "ginger beard, receding hairline, pale blue eyes, soft build",
    "pixie cut, sharp jaw, dark eyes, lean and tall",
    # v2 extensions — broader diversity of features
    "long straight black hair, dark almond eyes, light olive skin, slim build",
    "wavy auburn hair past shoulders, deep green eyes, light freckles, athletic build",
    "tight coils to mid-back, warm dark skin, full smile, average height",
    "sandy blond waves, pale blue eyes, light tan, lean and tall",
    "shoulder-length silver-gray hair, dark skin, kind eyes, medium build",
    "high cheekbones, straight black hair to mid-back, dark eyes, narrow build",
    "short messy curls, deep brown eyes, easy tan, medium height and slim",
    "long dark hair, full beard, kind eyes, broad shoulders, stocky build",
    "copper curls, light green eyes, freckled cheeks, slim and average height",
    "shoulder-length sandy hair, blue-gray eyes, light tan, lean",
    "smooth white skin, soft blonde curls, hazel eyes, average height and slim",
    "medium brown skin, black hair in locs, warm eyes, tall and lean",
    "warm brown skin, sharp features, short black hair, athletic and lean",
    "dark brown skin, deep brown eyes, fade haircut, broad shoulders, tall",
    "pale skin, dyed-red short hair, green eyes, slim and average height",
    "round glasses, soft brown hair, freckled, slim and average height",
    "warm brown eyes, easy smile, broad shoulders, gray at the temples, average height",
    "tight curls, deep brown skin, easy smile, average height and stocky",
    "long black hair, dark eyes, narrow face, slim and tall",
    "short strawberry blond hair, pale skin, blue eyes, light freckles, lean",
    "thick black eyebrows, dark eyes, jet-black hair, medium height and stocky",
    "high forehead, silver-streaked hair pulled back, keen eyes, average height",
    "white-streaked beard, weathered hands, kind eyes, broad shoulders, stocky",
    "long brown hair, deep brown eyes, easy laugh, slim and tall",
    "soft jaw, kind eyes, light brown hair, average height and slim",
    "square jaw, light brown hair, easy smile, tall and lean",
    "warm dark skin, close-cropped hair, full lips, medium build",
    "round face, dark hair in a bun, kind eyes, average height and slim",
    "pale skin, light brown curls, green eyes, slim and average height",
    "broad shoulders, easy tan, dark eyes, sandy hair, tall and lean",
)


# --- demographics (40) ----------------------------------------------------

DEMOGRAPHICS: tuple[str, ...] = (
    "26, female", "32, male", "28, female", "35, male",
    "22, female", "31, male", "29, non-binary", "30, female",
    "27, male", "33, male", "24, female", "40, male",
    "37, female", "26, male", "34, non-binary", "23, female",
    "38, male", "29, female", "31, female", "36, male",
    # v2 extensions
    "21, female", "42, male", "25, non-binary", "39, female",
    "28, male", "45, male", "23, non-binary", "33, female",
    "27, female", "44, female", "26, non-binary", "30, male",
    "41, male", "22, non-binary", "34, female", "38, female",
    "29, male", "43, female", "32, non-binary", "46, male",
)


# --- you appearance templates ---------------------------------------------

YOU_APPEARANCE_TEMPLATES: tuple[str, ...] = (
    "{TRAIT}, the kind of eyes you can't look away from",
    "tall, dark hair, easy smile, soft hands",
    "warm smile, hands that move when they speak, doesn't need much makeup",
    "{TRAIT}, beard optional but a plus",
    "tall and a little strange, weather-tanned, hair they don't fix when the wind blows",
    "soft voice, kind eyes, the kind of laugh that fills a quiet café",
    "{TRAIT}, dresses like they don't think about it",
    "tall, athletic build, hair they wash and forget",
    "broad-shouldered, warm hands, the kind of smile you notice across a room",
    "{TRAIT}, weather-tanned, sharp jaw, easy laugh",
    "soft features, dark eyes, the kind of presence that fills a doorway",
    "{TRAIT}, gentle voice, hands that gesture when they talk",
    "tall and angular, sharp cheekbones, dark hair, deep-set eyes",
    "round face, kind eyes, warm hands, easy laugh",
    "{TRAIT}, soft jaw, low voice, no pretence",
)


CHAR_TWISTS: tuple[str, ...] = (
    "Coffee snob welcome, podcast snob not",
    "Bonus if you have a dog and don't mind walking in the rain",
    "Walking buddy, photography buddy, both welcome",
    "Dogs a big plus — mine will judge you first",
    "Will share the last bite but not the last word",
    "Has at least one friend who thinks they're the funny one",
    "Believes the second date is the real one",
    "Counts bookshops, not countries",
    "Has read the same Murakami four times and noticed something new every time",
    "Picks music by mood, never by genre",
    "Has at least one hobby they're slightly embarrassed by",
    "Believes a long walk beats a long conversation and both beat a short one",
    "Has a strong opinion about typography",
    "Knows how to fix a flat without checking the phone",
    "Has at least one tattoo and one regret",
)


# --- Generation ----------------------------------------------------------

def _seeded_rng(profile_id: str) -> random.Random:
    seed = int(hashlib.sha256(profile_id.encode("utf-8")).hexdigest()[:16], 16)
    return random.Random(seed)


def _sample(rng: random.Random, pool: tuple[str, ...], k: int) -> list[str]:
    k = min(k, len(pool))
    return rng.sample(list(pool), k)


def _wrap(text: str, width: int = 78) -> str:
    return textwrap.fill(
        text,
        width=width,
        initial_indent="  ",
        subsequent_indent="  ",
        break_long_words=False,
        break_on_hyphens=False,
    )


def make_block(profile_id: str) -> str:
    rng = _seeded_rng(profile_id)

    interests = _sample(rng, INTEREST_POOL, rng.randint(3, 6))

    # my character: 2-5 sentences (wider range than v1's 2-4 for more variety)
    n_my_char = rng.randint(2, 5)
    my_char_sentences = _sample(rng, MY_CHARACTER_SENTENCES, n_my_char)
    my_char_text = ". ".join(my_char_sentences) + "."
    my_char_wrapped = _wrap(my_char_text)

    demo = rng.choice(DEMOGRAPHICS)
    my_app_trait = rng.choice(APPEARANCE_TRAITS)
    my_appearance = f"{demo}. {my_app_trait.capitalize()}."

    # you character: 1-4 sentences
    n_you_char = rng.randint(1, 4)
    you_char_sentences = _sample(rng, YOU_CHARACTER_SENTENCES, n_you_char)
    you_char_text = ". ".join(you_char_sentences) + "."
    you_char_wrapped = _wrap(you_char_text)

    you_app_template = rng.choice(YOU_APPEARANCE_TEMPLATES)
    you_app_trait = rng.choice(APPEARANCE_TRAITS)
    you_appearance = you_app_template.format(TRAIT=you_app_trait)

    interests_str = "\n".join(f"  - {x}" for x in interests)
    return (
        f"{profile_id}.\n"
        f"interests:\n"
        f"{interests_str}\n"
        f"my character: |\n"
        f"{my_char_wrapped}\n"
        f"my appearance: {my_appearance}\n"
        f"you character: |\n"
        f"{you_char_wrapped}\n"
        f"you appearance: {you_appearance}\n"
    )


def _worker(indices: list[int]) -> list[tuple[int, str]]:
    return [(i, make_block(f"u_{i:06d}")) for i in indices]


def generate_parallel(n: int, n_workers: int = 10) -> str:
    """Run n_workers worker processes, each generating a slice of profile IDs.

    Each worker is fully independent (its own process, its own imports,
    its own _seeded_rng per profile). Workers don't share any RNG state, so
    they don't know what other profiles look like."""
    chunks: list[list[int]] = [[] for _ in range(n_workers)]
    for i in range(n):
        chunks[i % n_workers].append(i)

    print(f"  generating {n} profiles across {n_workers} workers")
    pieces: list[tuple[int, str]] = []
    with ProcessPoolExecutor(max_workers=n_workers) as ex:
        futures = [ex.submit(_worker, chunk) for chunk in chunks if chunk]
        for fut in as_completed(futures):
            pieces.extend(fut.result())
    pieces.sort(key=lambda x: x[0])
    return "\n".join(block for _, block in pieces)


def save(blocks_text: str, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(blocks_text, encoding="utf-8")


# --- CLI -----------------------------------------------------------------

if __name__ == "__main__":
    import re
    import sys
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 25_000
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("data/profiles_descriptions.txt")
    n_workers = int(sys.argv[3]) if len(sys.argv) > 3 else 10

    text = generate_parallel(n, n_workers)
    save(text, out)

    n_blocks = sum(1 for line in open(out) if re.match(r"^u_\d{6}\.$", line))
    print(f"wrote {n_blocks} profiles to {out}")

    # Quick diversity check
    vibes = set()
    for line in open(out):
        m = re.match(r"^u_\d{6}\.$", line)
        if not m:
            continue
        pid = m.group(0)[:-1]
    # count unique "my character" paragraphs
    char_paras: set[str] = set()
    blocks = text.split("\nu_")
    for b in blocks:
        if "my character:" not in b:
            continue
        # extract the paragraph block between 'my character: |' and 'my appearance:'
        parts = b.split("my character: |", 1)
        if len(parts) < 2:
            continue
        rest = parts[1].split("\nmy appearance:", 1)
        if len(rest) < 2:
            continue
        char_paras.add(rest[0].strip())
    print(f"unique my-character paragraphs: {len(char_paras)} / {n_blocks} "
          f"({100 * len(char_paras) / max(1, n_blocks):.1f}%)")