// Browser preview: every piece in a Remotion <Player>, no MP4 render needed.
// Build: `bun run preview:build` → out/preview/ (index.html + preview.js + assets).
import { Player, type PlayerRef } from "@remotion/player"
import { useEffect, useMemo, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import vo from "../scripts/vo.json"
import { FPS, H, W } from "../src/theme"
import { PIECES, total } from "../src/timeline"
import { Video, type VideoProps } from "../src/Video"

const lines = vo.lines as Record<string, string>
const fmt = (frames: number) => {
  const s = frames / FPS
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`
}
const keyOf = (src: string) => src.replace(/^audio\/vo\//, "").replace(/\.mp3$/, "")

const pick = () => {
  const h = location.hash.slice(1)
  return PIECES.some((p) => p.id === h) ? h : PIECES[0].id
}

const App = () => {
  const [id, setId] = useState(pick)
  const [frame, setFrame] = useState(0)
  const [layers, setLayers] = useState({ voice: true, music: true, sfx: true })
  const player = useRef<PlayerRef>(null)
  const piece = PIECES.find((p) => p.id === id) ?? PIECES[0]
  const dur = total(piece.scenes)

  const rows = useMemo(() => {
    let at = 0
    return piece.scenes.map((s) => {
      const row = {
        id: s.id,
        from: at,
        to: at + s.frames,
        say: (s.vo ?? []).map((q) => lines[keyOf(q.src)] ?? ""),
      }
      at += s.frames
      return row
    })
  }, [piece])

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new piece remounts the player, so the listener re-attaches
  useEffect(() => {
    const p = player.current
    if (!p) return
    const on = (e: { detail: { frame: number } }) => setFrame(e.detail.frame)
    p.addEventListener("frameupdate", on)
    return () => p.removeEventListener("frameupdate", on)
  }, [id])

  const choose = (next: string) => {
    setId(next)
    setFrame(0)
    history.replaceState(null, "", `#${next}`)
  }

  const Comp = useMemo(
    () => (props: VideoProps) => <Video scenes={piece.scenes} {...props} />,
    [piece],
  )
  const props: VideoProps = { ...layers, musicSrc: `audio/music-${piece.id.toLowerCase()}.mp3` }

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <span className="dot" aria-hidden="true" />
          just-mate <span className="muted">motion</span>
        </div>
        <nav className="pieces" aria-label="Pieces">
          {PIECES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.id === id ? "piece on" : "piece"}
              onClick={() => choose(p.id)}
            >
              <span className="pt">{p.title}</span>
              <span className="pd">{fmt(total(p.scenes))}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="stage">
        <div className="frame">
          <Player
            key={piece.id}
            ref={player}
            component={Comp}
            inputProps={props}
            durationInFrames={dur}
            fps={FPS}
            compositionWidth={W}
            compositionHeight={H}
            style={{ width: "100%", aspectRatio: "16 / 9" }}
            controls
            numberOfSharedAudioTags={10}
            clickToPlay
            spaceKeyToPlayOrPause
            acknowledgeRemotionLicense
          />
        </div>
        <p className="about">{piece.about}</p>
        <fieldset className="layers">
          <legend className="sr">Audio layers</legend>
          {(["voice", "music", "sfx"] as const).map((k) => (
            <label key={k} className="chk">
              <input
                id={`layer-${k}`}
                type="checkbox"
                checked={layers[k]}
                onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })}
              />
              {k === "sfx" ? "sound effects" : k}
            </label>
          ))}
        </fieldset>
      </main>

      <section className="script" aria-label="Scenes">
        <h2>Scenes and voiceover</h2>
        <ol>
          {rows.map((r) => {
            const now = frame >= r.from && frame < r.to
            return (
              <li key={`${r.id}-${r.from}`} className={now ? "row now" : "row"}>
                <button type="button" onClick={() => player.current?.seekTo(r.from)}>
                  <span className="tc">{fmt(r.from)}</span>
                  <span className="sid">{r.id}</span>
                  <span className="say">{r.say.filter(Boolean).join(" ") || "—"}</span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="note">
          Scratch voice and music. Final takes from ElevenLabs drop into public/audio with the same
          file names.
        </p>
      </section>
    </div>
  )
}

createRoot(document.getElementById("app") as HTMLElement).render(<App />)
