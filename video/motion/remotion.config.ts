import { Config } from "@remotion/cli/config"

Config.setVideoImageFormat("jpeg")
Config.setJpegQuality(92)
Config.setCodec("h264")
Config.setCrf(16)
Config.setConcurrency(null)
// Optional: point at a local Chromium (e.g. sandboxed CI without download access).
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME)
