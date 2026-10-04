import { describe, expect, test } from "bun:test"

import {
  type Question,
  SAMPLE_ICEBREAKERS,
  SAMPLE_QUESTIONS,
  SAMPLE_VIBES,
} from "../src/onboarding/samples"

delete process.env.OPENAI_API_KEY
const {
  describeAppearance,
  isIcebreaker,
  isQuestion,
  isVibe,
  writeCharacter,
  writeIcebreaker,
  writeQuestion,
  writeRelated,
  writeTaste,
  writeVibe,
} = await import("../src/onboarding/llm")

describe("without an API key", () => {
  test("questions fall back to the mode's sample for that step", async () => {
    const qa = [{ q: "Pick a deal-breaker.", a: "no banter" }]
    const req = { mode: "mate" as const, name: "Alex", interests: ["chess"], qa }
    expect(await writeQuestion(req, "en")).toEqual({
      ...(SAMPLE_QUESTIONS.en.mate[1] as Question),
      source: "sample",
    })
  })

  test("the sample question comes in the app's language", async () => {
    const req = { mode: "date" as const, name: "Alex", interests: ["chess"], qa: [] }
    expect(await writeQuestion(req, "sk")).toEqual({
      ...(SAMPLE_QUESTIONS.sk.date[0] as Question),
      source: "sample",
    })
  })

  test("the vibe falls back to a sample line that was not shown yet", async () => {
    const avoid = SAMPLE_VIBES.slice(1)
    const reply = await writeVibe({ mode: "date", interests: ["coffee"], qa: [], avoid })
    expect(reply).toEqual({ vibe: SAMPLE_VIBES[0] as string, source: "sample" })
  })

  test("the ice-breaker falls back to a sample line for the mode", async () => {
    const reply = await writeIcebreaker({
      mode: "mate",
      interests: ["chess"],
      partnerInterests: ["chess", "climbing"],
      partnerVibe: "",
    })
    expect(reply.source).toBe("sample")
    expect(SAMPLE_ICEBREAKERS.mate).toContain(reply.line as never)
  })

  test("related interests fall back to the fixed list minus what is on screen", async () => {
    expect(await writeRelated({ mode: "date", item: "coffee", have: ["flat white"] })).toEqual({
      items: ["café hopping", "specialty roasters"],
    })
    expect(await writeRelated({ mode: "date", item: "knitting", have: [] })).toEqual({ items: [] })
  })

  test("the character falls back to the answers, one per line", async () => {
    const qa = [
      { q: "Pick a deal-breaker.", a: "no banter" },
      { q: "Sunday plan?", a: "a long walk" },
    ]
    expect(await writeCharacter({ mode: "date", interests: ["coffee"], qa })).toEqual({
      character: "no banter\na long walk",
      source: "sample",
    })
  })

  test("taste falls back to the picks themselves, and no picks is no taste", async () => {
    expect(await writeTaste({ picks: ["dark hair", "glasses"] })).toEqual({
      taste: "dark hair; glasses",
      source: "sample",
    })
    expect(await writeTaste({ picks: [] })).toEqual({ taste: "", source: "sample" })
  })

  test("the selfie is not described without a model", async () => {
    expect(await describeAppearance({ photo: "/9j/4AAQ" })).toEqual({
      appearance: "",
      source: "sample",
    })
  })
})

describe("output rules", () => {
  const options = ["a long walk", "a record shop", "a quiz night", "a quiet bar"]

  test("a question is sentence case, short, new and has 4 lowercase options", () => {
    expect(isQuestion({ question: "Where do you go to think?", options }, [])).toBe(true)
    expect(isQuestion({ question: "Where Do You Go?", options }, [])).toBe(false)
    expect(isQuestion({ question: "Čo ťa baví?", options }, [])).toBe(true)
    expect(isQuestion({ question: "Čo Ťa baví?", options }, [])).toBe(false)
    expect(isQuestion({ question: "Where do you go?!", options }, [])).toBe(false)
    expect(isQuestion({ question: "Where do you go?", options: options.slice(1) }, [])).toBe(false)
    expect(
      isQuestion({ question: "Where do you go?", options: [...options.slice(1), "A Bar"] }, []),
    ).toBe(false)
    expect(
      isQuestion({ question: "Where do you go?", options }, [{ q: "where do you go?", a: "x" }]),
    ).toBe(false)
  })

  test("a vibe is two lowercase clauses under 60 characters", () => {
    expect(isVibe("reads the menu twice — orders the first thing", [])).toBe(true)
    expect(isVibe("reads the menu twice, orders the first thing", [])).toBe(false)
    expect(isVibe("Reads the menu twice — orders the first thing", [])).toBe(false)
    expect(isVibe("reads every menu twice and then again — orders the first thing", [])).toBe(false)
    expect(
      isVibe("plans the trip — forgets the charger", ["plans the trip — forgets the charger"]),
    ).toBe(false)
  })

  test("an ice-breaker is one short line without quotes or emoji", () => {
    expect(isIcebreaker("What's the last thing you got properly into?")).toBe(true)
    expect(isIcebreaker("")).toBe(false)
    expect(isIcebreaker(' "Hey you" ')).toBe(false)
    expect(isIcebreaker("Nice to meet you 👋")).toBe(false)
    expect(isIcebreaker("a".repeat(141))).toBe(false)
  })
})
