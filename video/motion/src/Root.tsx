import { Composition, continueRender, delayRender } from "remotion"
import { FPS, fontReady, H, W } from "./theme"
import { PIECES, total } from "./timeline"
import { Video, type VideoProps } from "./Video"

const wait = delayRender("Loading Inter")
fontReady.then(() => continueRender(wait))

export const Root = () => (
  <>
    {PIECES.map((p) => (
      <Composition
        key={p.id}
        id={p.id}
        component={(props: VideoProps) => <Video scenes={p.scenes} {...props} />}
        durationInFrames={total(p.scenes)}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          voice: true,
          music: true,
          sfx: true,
          musicSrc: `audio/music-${p.id.toLowerCase()}.mp3`,
        }}
      />
    ))}
  </>
)
