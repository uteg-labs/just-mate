import { useEffect, useState } from "react"

const TICK_MS = 250

// ticks a little faster than a second so an m:ss clock never skips a digit
export function useNow() {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  return now
}

export function secondsUntil(endsAt: number, now: number) {
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}
