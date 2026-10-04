import { AbsoluteFill, Audio, Sequence, Series } from "remotion"
import { asset, FPS } from "./theme"
import type { Scene } from "./timeline"

export type VideoProps = { voice: boolean; music: boolean; sfx: boolean; musicSrc: string }

// cues end after their sound so the Player can hand its shared audio tags to the next one
const LINE = 8 * FPS
const BLIP = 2 * FPS

export const Video = ({
  scenes,
  voice,
  music,
  sfx,
  musicSrc,
}: VideoProps & { scenes: Scene[] }) => {
  let at = 0
  const cues = scenes.flatMap((s) => {
    const start = at
    at += s.frames
    return [
      ...(voice ? (s.vo ?? []) : []).map((q) => ({
        ...q,
        at: start + q.at,
        volume: q.volume ?? 1,
        frames: LINE,
      })),
      ...(sfx ? (s.sfx ?? []) : []).map((q) => ({
        ...q,
        at: start + q.at,
        volume: q.volume ?? 0.5,
        frames: BLIP,
      })),
    ]
  })
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Series>
        {scenes.map((s) => (
          <Series.Sequence key={s.id} durationInFrames={s.frames} name={s.id}>
            <s.C dur={s.frames} />
          </Series.Sequence>
        ))}
      </Series>
      {music && <Audio src={asset(musicSrc)} volume={0.32} />}
      {cues.map((q) => (
        <Sequence
          key={`${q.src}@${q.at}`}
          from={q.at}
          durationInFrames={q.frames}
          layout="none"
          name={q.src}
        >
          <Audio src={asset(q.src)} volume={q.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
