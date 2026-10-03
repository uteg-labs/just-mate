import { useEffect } from "react"
import { Keyboard, type KeyboardEvent, Platform } from "react-native"
import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

import { duration } from "@/theme/motion"

const SHOW = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
const HIDE = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"

// the morph surface is laid out against the window, so a sheet rides up with the keyboard instead
export function useKeyboardLift(isActive: boolean) {
  const lift = useSharedValue(0)

  useEffect(() => {
    const move = (height: number, e: KeyboardEvent) =>
      lift.set(withTiming(height, { duration: e.duration || duration.default }))
    const subscriptions = [
      Keyboard.addListener(SHOW, (e) => move(e.endCoordinates.height, e)),
      Keyboard.addListener(HIDE, (e) => move(0, e)),
    ]
    return () => {
      for (const s of subscriptions) s.remove()
    }
  }, [lift])

  return useAnimatedStyle(() => ({ transform: [{ translateY: isActive ? -lift.get() : 0 }] }))
}
