import type { ExpoConfig } from "expo/config"

const LOCATION_COPY =
  "JustMate uses your location only while you search, to light up zones and point the compass."

const CAMERA_COPY =
  "JustMate uses the camera once to describe features like your hair and cheekbones. The photo is not stored."

export default (): ExpoConfig => ({
  name: "JustMate",
  slug: "justmate",
  scheme: "justmate",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  backgroundColor: "#FAFAFA",
  ios: {
    bundleIdentifier: "sk.uteg.justmate",
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: "sk.uteg.justmate",
    adaptiveIcon: {
      backgroundColor: "#EDEDEF",
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
    ["expo-font", { fonts: ["./assets/fonts/InterVariable.ttf"] }],
    [
      "expo-splash-screen",
      { backgroundColor: "#FAFAFA", image: "./assets/images/splash-icon.png", imageWidth: 76 },
    ],
    ["expo-maps", { requestLocationPermission: true, locationPermission: LOCATION_COPY }],
    ["expo-location", { locationWhenInUsePermission: LOCATION_COPY }],
    ["expo-image-picker", { cameraPermission: CAMERA_COPY }],
  ],
  web: {
    name: "just-mate · Meet for real.",
    shortName: "just-mate",
    description:
      "Pick what you're up for. When someone nearby wants the same thing, both phones ping. Accept, and a compass walks you to each other.",
    themeColor: "#FAFAFA",
    backgroundColor: "#FAFAFA",
    favicon: "./assets/brand/favicon.svg",
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
})
