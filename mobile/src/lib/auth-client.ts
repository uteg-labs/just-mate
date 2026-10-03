import { expoClient } from "@better-auth/expo/client"
import { magicLinkClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import * as SecureStore from "expo-secure-store"

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({ scheme: "justmate", storagePrefix: "justmate", storage: SecureStore }),
    magicLinkClient(),
  ],
})
