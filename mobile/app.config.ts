import type { ExpoConfig } from "expo/config"

const LOCATION_COPY =
  "JustMate uses your location only while you search, to light up zones and point the compass."

export default (): ExpoConfig => ({
  name: "JustMate",
  slug: "justmate",
  scheme: "justmate",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "dark",
  backgroundColor: "#0A0A0D",
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: "sk.uteg.justmate",
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: "sk.uteg.justmate",
    adaptiveIcon: {
      backgroundColor: "#0A0A0D",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    // google maps renders blank without it; ios uses apple maps and needs nothing
    config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-localization",
    "expo-secure-store",
    [
      "expo-splash-screen",
      { backgroundColor: "#0A0A0D", image: "./assets/images/splash-icon.png", imageWidth: 76 },
    ],
    ["expo-maps", { requestLocationPermission: true, locationPermission: LOCATION_COPY }],
    ["expo-location", { locationWhenInUsePermission: LOCATION_COPY }],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
})
