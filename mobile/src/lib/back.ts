import { useEffect, useEffectEvent } from "react"
import { BackHandler } from "react-native"

// the app is a single route, so android's back has nothing to pop and would close the app
export function useBack(onBack: () => void, active = true) {
  const back = useEffectEvent(onBack)

  useEffect(() => {
    if (!active) return
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      back()
      return true
    })
    return () => sub.remove()
  }, [active])
}
