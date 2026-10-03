import { Redirect } from "expo-router"
import { useEffect, useState } from "react"

import { authClient } from "@/lib/auth-client"
import { hasCompletedOnboarding } from "@/lib/onboarding"

export default function Index() {
  const { data: session } = authClient.useSession()
  const [destination, setDestination] = useState<"/home" | "/onboarding">()

  useEffect(() => {
    if (!session) return
    void hasCompletedOnboarding(session.user.id).then((complete) =>
      setDestination(complete ? "/home" : "/onboarding"),
    )
  }, [session])

  return destination ? <Redirect href={destination} /> : null
}
