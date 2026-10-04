import { describe, expect, test } from "bun:test"
import { AGE_MAX, defaultAgeRange, parseProfile } from "@justmate/protocol"

import { fillAgeRanges } from "../src/profile/age-range"
import { makeProfile } from "./fixtures"

describe("defaultAgeRange", () => {
  test("spans five years either side of the age", () => {
    expect(defaultAgeRange(30, "date")).toEqual({ ageMin: 25, ageMax: 35 })
    expect(defaultAgeRange(30, "mate")).toEqual({ ageMin: 25, ageMax: 35 })
  })

  test("never reaches below adults for date or for an adult", () => {
    expect(defaultAgeRange(19, "date")).toEqual({ ageMin: 18, ageMax: 24 })
    expect(defaultAgeRange(19, "mate")).toEqual({ ageMin: 18, ageMax: 24 })
    expect(defaultAgeRange(16, "date")).toEqual({ ageMin: 18, ageMax: 21 })
  })

  test("lets a minor in mate mode start at the youngest account age", () => {
    expect(defaultAgeRange(17, "mate")).toEqual({ ageMin: 16, ageMax: 22 })
  })

  test("opens the top to 60+ from 55 on", () => {
    expect(defaultAgeRange(54, "date")).toEqual({ ageMin: 49, ageMax: 59 })
    expect(defaultAgeRange(55, "date")).toEqual({ ageMin: 50, ageMax: AGE_MAX })
    expect(defaultAgeRange(80, "mate")).toEqual({ ageMin: 60, ageMax: AGE_MAX })
  })

  test("every age gets a range the profile parser accepts", () => {
    for (let age = 16; age <= AGE_MAX; age++) {
      const adult = age >= 18
      const profile = makeProfile({
        age,
        adult,
        mode: adult ? "date" : "mate",
        date: { ...makeProfile().date, ...defaultAgeRange(age, "date") },
        mate: { ...makeProfile().mate, ...defaultAgeRange(age, "mate") },
      })
      expect(parseProfile(profile).ok).toBe(true)
    }
  })
})

describe("fillAgeRanges", () => {
  test("anchors a start range that leaves the age out on the age", () => {
    const filled = fillAgeRanges(makeProfile({ age: 20 }))
    expect(filled.date).toEqual({ ...makeProfile().date, ageMin: 18, ageMax: 25 })
    expect(filled.mate).toEqual({ ...makeProfile().mate, ageMin: 18, ageMax: 25 })
  })

  test("keeps a start range the age sits inside", () => {
    const profile = makeProfile({ age: 30 })
    expect(fillAgeRanges(profile)).toEqual(profile)
  })

  test("keeps a range the user picked", () => {
    const profile = makeProfile({
      age: 45,
      date: { ...makeProfile().date, ageMin: 24, ageMax: 36 },
      mate: { ...makeProfile().mate, ageMin: 40, ageMax: 50 },
    })
    expect(fillAgeRanges(profile)).toEqual(profile)
  })

  test("fills each mode on its own", () => {
    const mate = { ...makeProfile().mate, ageMin: 30, ageMax: 40 }
    const filled = fillAgeRanges(makeProfile({ age: 38, mate }))
    expect(filled.date).toMatchObject({ ageMin: 33, ageMax: 43 })
    expect(filled.mate).toEqual(mate)
  })
})
