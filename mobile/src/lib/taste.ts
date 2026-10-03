import { useEffect, useState } from "react"

const api = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"

export type TastePhoto = { id: string; group: string; description: string; uri: string }

// todo: remove once "who are you looking for" is chosen in onboarding
export const LOOKING_FOR: "GIRL" | "BOYS" = "GIRL"

const GROUP = { GIRL: "women", BOYS: "man" } as const

type Item = Omit<TastePhoto, "uri"> & { photo: string }

type Status = "loading" | "ready" | "failed"

export function useTastePhotos(active: boolean) {
  const [status, setStatus] = useState<Status>("loading")
  const [photos, setPhotos] = useState<TastePhoto[]>([])

  useEffect(() => {
    if (!active) return
    setStatus("loading")
    fetch(`${api}/taste`)
      .then((res) => res.json())
      .then((items: Item[]) => {
        setPhotos(
          items
            .filter((item) => item.group === GROUP[LOOKING_FOR])
            .map(({ photo, ...item }) => ({ ...item, uri: `${api}${photo}` })),
        )
        setStatus("ready")
      })
      .catch((error) => {
        console.warn("[taste] photos unavailable:", error)
        setStatus("failed")
      })
  }, [active])

  return { status, photos }
}
