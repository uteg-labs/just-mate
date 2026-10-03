import * as SecureStore from "expo-secure-store"

function key(userId: string) {
  return `justmate_onboarding_${userId}`
}

export async function hasCompletedOnboarding(userId: string) {
  return (await SecureStore.getItemAsync(key(userId))) === "true"
}

export async function completeOnboarding(userId: string) {
  await SecureStore.setItemAsync(key(userId), "true")
}
