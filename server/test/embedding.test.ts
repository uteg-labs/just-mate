import { expect, test } from "bun:test"
import { DEFAULT_PROFILE } from "@justmate/protocol"

import {
  buildSelfText,
  buildTargetText,
  embeddingInputsChanged,
} from "../src/profile/embedding-text"

const profile = {
  ...DEFAULT_PROFILE,
  interests: ["chess", "climbing"],
  character: "Calm — listens first",
  appearance: "tall, glasses",
  partnerCharacter: "funny and curious",
  taste: "short dark hair",
}

test("self text carries interests and own traits", () => {
  expect(buildSelfText(profile)).toBe(
    "Interests: chess, climbing.\n[Self] Character: Calm — listens first\n[Self] Appearance: tall, glasses",
  )
})

test("target text carries the partner traits only", () => {
  expect(buildTargetText(profile)).toBe(
    "[Target] Character: funny and curious\n[Target] Appearance: short dark hair",
  )
})

test("embeddings are recomputed only when an embedded field changes", () => {
  expect(embeddingInputsChanged(undefined, profile)).toBe(true)
  expect(embeddingInputsChanged(profile, { ...profile, name: "Other" })).toBe(false)
  expect(embeddingInputsChanged(profile, { ...profile, taste: "red hair" })).toBe(true)
})
