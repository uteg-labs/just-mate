import { Player, type PlayerRef } from "@remotion/player"
import { type RefObject, type SyntheticEvent, useEffect, useMemo, useRef, useState } from "react"
import { FPS, H, W } from "../../video/motion/src/theme"
import { PIECES, type Piece, total } from "../../video/motion/src/timeline"
import { Video, type VideoProps } from "../../video/motion/src/Video"
import durations from "../../video/motion/src/vo-durations.json"
import { CAPTIONS, type Copy, type Lang } from "./copy"
import { Glyph } from "./Glyph"

type Cue = { key: string; from: number; to: number }
type Control = { listen: (e?: SyntheticEvent) => void; silence: () => void }

const HOLD = 10
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
const said = durations as Record<string, number>

// one clip speaks at a time; the hero button reaches its clip through here
export const clips = new Map<string, Control>()

function cuesOf(piece: Piece) {
  let at = 0
  return piece.scenes.flatMap((s) => {
    const start = at
    at += s.frames
    return (s.vo ?? []).map((q): Cue => {
      const key = q.src.replace(/^audio\/vo\//, "").replace(/\.mp3$/, "")
      const from = start + q.at
      return { key, from, to: from + Math.ceil((said[key] ?? 2) * FPS) + HOLD }
    })
  })
}

function useInView(ref: RefObject<HTMLElement | null>, ratio: number, margin = "0px") {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting && e.intersectionRatio >= ratio),
      { threshold: [0, ratio], rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, ratio, margin])
  return inView
}

export const Clip = ({
  id,
  poster,
  lang,
  t,
  eager = false,
}: {
  id: string
  poster: number
  lang: Lang
  t: Copy["clip"]
  eager?: boolean
}) => {
  const piece = PIECES.find((p) => p.id === id) ?? PIECES[0]
  const box = useRef<HTMLElement>(null)
  const player = useRef<PlayerRef>(null)
  const bar = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  const near = useInView(box, 0, "600px")
  const seen = useInView(box, eager ? 0.2 : 0.5)
  const [mounted, setMounted] = useState(eager)
  const [held, setHeld] = useState(reduced)
  const [playing, setPlaying] = useState(false)
  const [audible, setAudible] = useState(false)
  const [cue, setCue] = useState<string>()

  const dur = total(piece.scenes)
  const cues = useMemo(() => cuesOf(piece), [piece])
  const Comp = useMemo(
    () => (props: VideoProps) => <Video scenes={piece.scenes} {...props} />,
    [piece],
  )
  const props = useMemo<VideoProps>(
    () => ({
      voice: true,
      music: true,
      sfx: true,
      musicSrc: `audio/music-${id.toLowerCase()}.mp3`,
    }),
    [id],
  )

  useEffect(() => {
    if (near) setMounted(true)
  }, [near])

  useEffect(() => {
    const p = player.current
    if (!mounted || !p) return
    const onFrame = (e: { detail: { frame: number } }) => {
      const f = e.detail.frame
      bar.current?.style.setProperty("transform", `scaleX(${f / (dur - 1)})`)
      setCue(cues.findLast((c) => f >= c.from && f < c.to)?.key)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      p.mute()
      setAudible(false)
      p.seekTo(0)
      p.play()
    }
    p.addEventListener("frameupdate", onFrame)
    p.addEventListener("play", onPlay)
    p.addEventListener("pause", onPause)
    p.addEventListener("ended", onEnded)
    setPlaying(p.isPlaying())
    return () => {
      p.removeEventListener("frameupdate", onFrame)
      p.removeEventListener("play", onPlay)
      p.removeEventListener("pause", onPause)
      p.removeEventListener("ended", onEnded)
    }
  }, [mounted, cues, dur])

  useEffect(() => {
    const p = player.current
    if (!mounted || !p) return
    if (!seen || held) return p.pause()
    if (!started.current) p.seekTo(0)
    started.current = true
    p.play()
  }, [seen, held, mounted])

  useEffect(() => {
    const listen = (e?: SyntheticEvent) => {
      const p = player.current
      if (!p) return
      for (const [other, c] of clips) if (other !== id) c.silence()
      started.current = true
      p.seekTo(0)
      p.unmute()
      p.play(e)
      setAudible(true)
      setHeld(false)
    }
    const silence = () => {
      player.current?.mute()
      setAudible(false)
    }
    clips.set(id, { listen, silence })
    return () => {
      clips.delete(id)
    }
  }, [id])

  const toggleSound = (e: SyntheticEvent) => {
    if (!audible) return clips.get(id)?.listen(e)
    clips.get(id)?.silence()
  }

  const togglePlay = (e: SyntheticEvent) => {
    const p = player.current
    if (!p) return
    if (playing) {
      p.pause()
      setHeld(true)
      return
    }
    started.current = true
    p.play(e)
    setHeld(false)
  }

  return (
    <figure className="clip" ref={box}>
      <div className="frame">
        {mounted ? (
          <Player
            ref={player}
            component={Comp}
            inputProps={props}
            durationInFrames={dur}
            fps={FPS}
            compositionWidth={W}
            compositionHeight={H}
            initialFrame={poster}
            initiallyMuted
            numberOfSharedAudioTags={10}
            loop={!audible}
            style={{ width: "100%", aspectRatio: "16 / 9", display: "block" }}
            acknowledgeRemotionLicense
          />
        ) : (
          <div className="ph" />
        )}
        <div className="bar">
          <div ref={bar} />
        </div>
        <div className="ctrl">
          <button
            type="button"
            className="ib"
            onClick={togglePlay}
            aria-label={playing ? t.pause : t.play}
          >
            <Glyph name={playing ? "pause" : "play"} size={16} color="#fff" />
          </button>
          <button type="button" className="snd" onClick={toggleSound}>
            <Glyph name={audible ? "volume-2" : "volume-x"} size={16} color="#fff" />
            <span>{audible ? t.mute : t.sound}</span>
          </button>
        </div>
      </div>
      <figcaption className="cap" lang={lang}>
        {cue ? CAPTIONS[lang][cue] : ""}
      </figcaption>
    </figure>
  )
}
