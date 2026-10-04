import type { ExpoConfig } from "expo/config"
import pkg from "./package.json"

const LOCATION_COPY =
  "JustMate uses your location while the map is open to show your spot, and shares it only while you search, to light up zones and point the compass. Nobody else ever sees where you are."

const CAMERA_COPY =
  "JustMate uses the front camera once for the selfie check. The photo is described once to match you, then dropped: never stored or shown."

const INTER = [
  { family: "Inter-Regular", file: "400Regular/Inter_400Regular", weight: 400 },
  { family: "Inter-Medium", file: "500Medium/Inter_500Medium", weight: 500 },
  { family: "Inter-SemiBold", file: "600SemiBold/Inter_600SemiBold", weight: 600 },
  { family: "Inter-Bold", file: "700Bold/Inter_700Bold", weight: 700 },
  {
    family: "Inter-MediumItalic",
    file: "500Medium_Italic/Inter_500Medium_Italic",
    weight: 500,
    style: "italic",
  },
].map(({ file, ...rest }) => ({ ...rest, path: `@expo-google-fonts/inter/${file}.ttf` }))

export default (): ExpoConfig => ({
  name: "JustMate",
  owner: "uteg-labs",
  slug: "just-mate",
  scheme: "justmate",
  version: pkg.version,
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
    [
      "expo-font",
      {
        ios: { fonts: INTER.map((f) => f.path) },
        // android names each family after the ios postscript name, so theme/type.ts stays platform-free
        android: {
          fonts: INTER.map(({ family, ...definition }) => ({
            fontFamily: family,
            fontDefinitions: [definition],
          })),
        },
      },
    ],
    [
      "expo-splash-screen",
      { backgroundColor: "#FAFAFA", image: "./assets/images/splash-icon.png", imageWidth: 76 },
    ],
    ["expo-maps", { requestLocationPermission: true, locationPermission: LOCATION_COPY }],
    ["expo-location", { locationWhenInUsePermission: LOCATION_COPY }],
    [
      "expo-image-picker",
      { cameraPermission: CAMERA_COPY, photosPermission: false, microphonePermission: false },
    ],
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
  extra: {
    eas: { projectId: "f3316851-3772-406c-969e-53476e1133bc" },
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
})
