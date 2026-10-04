import { Elysia } from "elysia"

import { venues } from "./venues"

export const venuesPlugin = new Elysia({ name: "venues" }).get("/api/venues", () => venues)
