import { getSetCookie, storageAdapter } from "@better-auth/expo/client"
import * as SecureStore from "expo-secure-store"

const cookieKey = "justmate_cookie"
const storage = storageAdapter(SecureStore)
const schemes = new Set(["justmate:", "exp:", "exp+justmate:"])

export type AuthDestination = "/" | "/onboarding"

type AuthCallback = {
  cookie: string
  destination: AuthDestination
}

export function parseAuthCallback(value: string): AuthCallback | undefined {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return
  }

  const cookie = url.searchParams.get("cookie")

  if (!schemes.has(url.protocol) || !cookie) return

  const route = [url.hostname, ...url.pathname.split("/")].find((part) => part === "onboarding")

  return { cookie, destination: route ? "/onboarding" : "/" }
}

export async function storeAuthCallback(callback: AuthCallback) {
  const current = await storage.getItemAsync(cookieKey)
  await storage.setItemAsync(cookieKey, getSetCookie(callback.cookie, current ?? undefined))
}
