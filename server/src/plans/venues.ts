import type { Venue } from "@justmate/protocol"

// the venue table, loaded once with the plans; PlanRepo.load reads it
export const venues: Venue[] = []
export const venueById = new Map<string, Venue>()

export function setVenues(list: Venue[]) {
  venues.splice(0, venues.length, ...list)
  venueById.clear()
  for (const v of list) venueById.set(v.id, v)
}
