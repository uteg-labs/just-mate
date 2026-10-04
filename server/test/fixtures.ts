import { DEFAULT_PROFILE, type Profile } from "@justmate/protocol"

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    ...DEFAULT_PROFILE,
    mode: "date",
    name: "Alex",
    age: 27,
    adult: true,
    interests: ["coffee", "wine", "cinema", "books"],
    vibe: "plans the trip — forgets the charger",
    ...overrides,
  }
}
