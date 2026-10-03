// the reset link is read by the surface itself (Linking.useURL), so the router stays on the map
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  if (!path.includes("reset-password")) return path
  return initial ? "/" : null
}
