# JustMate brand

Source of truth for colour and type is `docs/DESIGN.md`; this folder holds the logo files. The name is **JustMate** (one word) in text; the lowercase `just-mate` is for file names only. Never recolour or redraw the files.

## Files

| File | Use it for |
|---|---|
| `just-mate-symbol.svg` | the mark alone: the white compass arrow on the amber and teal glow disc; avatars, social profile pictures, small spaces |
| `just-mate-wordmark.svg` | the name alone, on light backgrounds |
| `just-mate-wordmark-dark.svg` | the name alone, on dark or ink backgrounds |
| `just-mate-lockup.svg` | mark and name together, on light backgrounds; headers, og images, decks |
| `just-mate-lockup-dark.svg` | mark and name together, on dark or ink backgrounds; video, the compass and match screens |
| `just-mate-app-icon.svg` | the store and home-screen icon (default) |
| `just-mate-app-icon-cool.svg` | app icon, cool variant (teal-led glow) |
| `just-mate-app-icon-ring.svg` | app icon, ring variant |
| `favicon.svg` | browser tab and site favicon |

`design/prototype/assets/brand/` carries a copy of the same set for the design prototype.

## Colours

| Name | Hex | Used for |
|---|---|---|
| Ink (`--jm-ink`) | `#0A0A0D` | night background, dark wordmark ground |
| Paper (`--surface-1`) | `#FAFAFA` | base surface, light wordmark ground |
| Foreground (`--fg-1`) | `#171717` | text, primary buttons, selected fills |
| Glow (`--glow`) | `#FFB23F` | the one warm accent: zone glow, match moment |
| Glow core (`--glow-core`) | `#FFD9A0` | centre of dense zones |
| On glow (`--on-glow`) | `#1A1205` | text on amber |
| Logo teal | `#37C2B3` | symbol and app icon glow |
| Logo amber | `#FFC56F` | symbol and app icon glow |
| Logo cream | `#FFDDAA` | symbol and app icon glow |
| Logo ground | `#EDEDEF` | symbol disc base |

The full ladder (surfaces, text, temperature, shadows) is in `docs/DESIGN.md` §3.

## Fonts

| Family | Weights | Used for |
|---|---|---|
| Inter (Variable on web, `mobile/assets/fonts/InterVariable.ttf`; static cuts on native) | 400, 500, 600, 700, medium italic | all product text; the wordmark is Inter Bold 700 with tracking −0.036em, outlined to paths in the SVGs |
| System monospace (`ui-monospace`, `SF Mono`, Menlo) | regular | mono eyebrows and labels |

Inter is licensed under the SIL Open Font License.
