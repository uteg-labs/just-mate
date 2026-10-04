import { expoClient } from "@better-auth/expo/client"
import { createAuthClient } from "better-auth/react"
import * as SecureStore from "expo-secure-store"

import { currentLanguage } from "@/localization/i18n"

export const apiURL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"

export const authClient = createAuthClient({
  baseURL: apiURL,
  plugins: [expoClient({ scheme: "justmate", storagePrefix: "justmate", storage: SecureStore })],
  // auth emails follow the app's language, not the device's
  fetchOptions: {
    onRequest: (ctx) => {
      ctx.headers.set("accept-language", currentLanguage())
      return ctx
    },
  },
})
