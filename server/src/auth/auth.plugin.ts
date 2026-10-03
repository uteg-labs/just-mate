import { Elysia } from "elysia"

import { auth } from "./auth"

export const authPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    authenticated: {
      async resolve({ request, status }) {
        const result = await auth.api.getSession({ headers: request.headers })
        if (!result) return status(401, { error: "unauthorized" })
        return { user: result.user, session: result.session }
      },
    },
  })
  .get("/api/account", ({ user }) => ({ user }), { authenticated: true })
