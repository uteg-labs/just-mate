import { anchorAgeRanges, isSameAgeRange, type Profile, START_AGE_RANGE } from "@justmate/protocol"

// a range still at the start values that leaves out the user's own age was never set by hand
export function fillAgeRanges(profile: Profile): Profile {
  const { age } = profile
  return anchorAgeRanges(
    profile,
    (range) => isSameAgeRange(range, START_AGE_RANGE) && (age < range.ageMin || age > range.ageMax),
  )
}
