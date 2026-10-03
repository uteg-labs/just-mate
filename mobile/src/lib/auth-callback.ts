import { getSetCookie, storageAdapter } from "@better-auth/expo/client"
import * as SecureStore from "expo-secure-store"

// the expo client's cookie slot (`storagePrefix` in auth-client.ts)
const cookieKey = "justmate_cookie"
const storage = storageAdapter(SecureStore)
const schemes = new Set(["justmate:", "exp:", "exp+justmate:"])

// a verified magic link lands on `justmate://…?cookie=…`: the session to keep
export function authCookieOf(value: string | null): string | undefined {
  if (!value) return
  try {
    const url = new URL(value)
    if (!schemes.has(url.protocol)) return
    return url.searchParams.get("cookie") ?? undefined
  } catch {}
}

export async function storeAuthCookie(cookie: string) {
  const current = await storage.getItemAsync(cookieKey)
  await storage.setItemAsync(cookieKey, getSetCookie(cookie, current ?? undefined))
}
