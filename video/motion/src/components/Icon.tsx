import { Img } from "remotion"
import icons from "../data/icons.json"
import { c } from "../theme"

// Lucide glyphs (same set as the JustMate DS, copied from its bundle) + a few extras.
const extra: Record<string, string> = {
  "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  "map-pin":
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  repeat:
    '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  slash: '<path d="M3 3l18 18"/>',
  sofa: '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/><path d="M12 4v9"/>',
  "calendar-heart":
    '<path d="M3 10h18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h7"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21.29 14.7a2.43 2.43 0 0 0-2.65-.52c-.3.12-.57.3-.8.53l-.34.34-.35-.34a2.43 2.43 0 0 0-2.65-.53c-.3.12-.56.3-.79.53-.95.94-1 2.53.2 3.74L17.5 22l3.6-3.55c1.2-1.21 1.14-2.8.19-3.74Z"/>',
  laptop:
    '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
  "id-card":
    '<path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
}
const all: Record<string, string> = { ...(icons as Record<string, string>), ...extra }

// Rendered as an SVG data URI so the static path strings never go through innerHTML.
export const Icon = ({
  name,
  size = 24,
  color = c.fg,
  stroke = 1.75,
  slash = false,
}: {
  name: string
  size?: number
  color?: string
  stroke?: number
  slash?: boolean
}) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${all[name] ?? ""}${slash ? extra.slash : ""}</svg>`
  return (
    <Img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      style={{ width: size, height: size, display: "block", flexShrink: 0 }}
    />
  )
}
