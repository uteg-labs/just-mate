import type { ReportReason } from "@justmate/protocol"

export type BlockRow = { blockerId: string; blockedId: string }

export type BlockStore = {
  forUser(userId: string): Promise<BlockRow[]>
  sessionPair(sessionId: string): Promise<string[] | undefined>
  add(
    row: BlockRow & { reason?: ReportReason },
  ): Promise<{ blockedCount: number; reporters: number }>
  pause(userId: string): Promise<void>
}

// PROTOCOL.md › rule 12: user id → everyone they blocked or were blocked by
const blocks = new Map<string, Set<string>>()

export function rememberBlocks(rows: BlockRow[]) {
  for (const { blockerId, blockedId } of rows) {
    blocks.set(blockerId, (blocks.get(blockerId) ?? new Set()).add(blockedId))
    blocks.set(blockedId, (blocks.get(blockedId) ?? new Set()).add(blockerId))
  }
}

export function isBlocked(a: string, b: string): boolean {
  return blocks.get(a)?.has(b) ?? false
}

export function resetBlocks() {
  blocks.clear()
}
