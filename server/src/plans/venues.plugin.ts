import { Elysia } from "elysia"

import { VENUES } from "./venues"

export const venuesPlugin = new Elysia({ name: "venues" }).get("/api/venues", () => VENUES)
