// in memory, one window per key; a restart forgets the counts, which is fine for a cost cap
export function fixedWindow(max: number, windowMs: number) {
  const windows = new Map<string, { start: number; count: number }>()
  return (key: string, now = Date.now()): boolean => {
    const window = windows.get(key)
    if (!window || now - window.start >= windowMs) {
      windows.set(key, { start: now, count: 1 })
      return true
    }
    window.count += 1
    return window.count <= max
  }
}
