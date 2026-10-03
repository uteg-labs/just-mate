import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({
  path: [
    fileURLToPath(new URL(".env.local", import.meta.url)),
    fileURLToPath(new URL(".env", import.meta.url)),
  ],
})

const url = process.env.DATABASE_URL

if (!url) throw new Error("DATABASE_URL is required")

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
})
