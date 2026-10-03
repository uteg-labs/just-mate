import { Redirect } from "expo-router"

// profile is not persisted yet, so every launch starts at onboarding
export default function Index() {
  return <Redirect href="/onboarding" />
}
