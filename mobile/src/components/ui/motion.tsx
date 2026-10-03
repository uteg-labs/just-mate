import { createContext, type ReactNode, use } from "react"
import { useReducedMotion } from "react-native-reanimated"

const ReduceMotionContext = createContext(false)

// the in-app switch (settings › feel) adds to the system setting, never overrides it off
export const MotionScope = ({ reduce, children }: { reduce: boolean; children: ReactNode }) => (
  <ReduceMotionContext value={reduce}>{children}</ReduceMotionContext>
)

export function useReduceMotion() {
  const system = useReducedMotion()
  return use(ReduceMotionContext) || system
}
