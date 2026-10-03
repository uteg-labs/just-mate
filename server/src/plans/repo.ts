import type { Intent, LatLng, Mode, PlanKind, PlanState, PlanUntil } from "@justmate/protocol"

// one plan as the server keeps it; PROTOCOL.md › Plans has what each side sees of it
export type PlanRow = {
  id: string
  kind: PlanKind
  mode: Mode
  category: string
  intents: Intent[]
  venueId: string
  alts: string[]
  slots: number[]
  startsAt: number
  flex: boolean
  until: PlanUntil
  state: PlanState
  /** proposal: side a · invitation: who put it out */
  ownerId: string
  /** proposal: side b · invitation: who it's offered to, or who took it */
  guestId: string | null
  accepted: string[]
  passed: string[]
  suggestedBy: string | null
  expiresAt: number | null
}

export type PlanRepo = {
  load(): Promise<{ rows: PlanRow[]; anchors: [string, LatLng][] }>
  save(row: PlanRow): Promise<void>
  remove(id: string): Promise<void>
  saveAnchor(userId: string, at: LatLng): Promise<void>
}

export function memoryRepo(): PlanRepo {
  const rows = new Map<string, PlanRow>()
  const anchors = new Map<string, LatLng>()
  return {
    load: async () => ({ rows: [...rows.values()], anchors: [...anchors] }),
    save: async (row) => void rows.set(row.id, structuredClone(row)),
    remove: async (id) => void rows.delete(id),
    saveAnchor: async (userId, at) => void anchors.set(userId, at),
  }
}
