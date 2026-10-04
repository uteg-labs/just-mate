import { type FormEvent, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { LANGS, type Lang } from "./copy"
import { Glyph } from "./Glyph"
import { POLL, type PollCopy } from "./poll-copy"
import "./site.css"
import "./poll.css"

type Sent = "idle" | "sending" | "done" | "error"
type Tally = { total: number; counts: Record<string, Record<string, number>> }

const VOTED = "justmate-poll-voted"

function initialLang(): Lang {
  const asked = new URLSearchParams(location.search).get("lang")
  if (asked === "en" || asked === "pl") return asked
  return navigator.language.toLowerCase().startsWith("pl") ? "pl" : "en"
}

// storage can throw in private mode; voting then simply isn't remembered
function hasVoted() {
  try {
    return localStorage.getItem(VOTED) !== null
  } catch {
    return false
  }
}

function rememberVote() {
  try {
    localStorage.setItem(VOTED, "1")
  } catch {}
}

const Header = ({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) => (
  <header className="top">
    <div className="wrap row">
      <a className="brand" href={`/?lang=${lang}`}>
        <img src="/favicon.svg" alt="" width={28} height={28} />
        <span>JustMate</span>
      </a>
      <div className="langs">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={l === lang}
            onClick={() => setLang(l)}
            lang={l}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  </header>
)

const Thanks = ({ t, lang }: { t: PollCopy; lang: Lang }) => (
  <div className="thanks">
    <p className="done" role="status">
      <Glyph name="circle-check" size={22} color="#30D158" />
      {t.done}
    </p>
    <p className="lead">{t.pitch}</p>
    <a className="btn glow" href={`/?lang=${lang}`}>
      {t.more}
      <Glyph name="arrow-right" size={18} color="#1A1205" />
    </a>
  </div>
)

const Vote = ({ t, lang }: { t: PollCopy; lang: Lang }) => {
  const [sent, setSent] = useState<Sent>(() => (hasVoted() ? "done" : "idle"))
  const [ready, setReady] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent("sending")
    const res = await fetch("/api/poll", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    }).catch(() => undefined)
    if (!res?.ok) return setSent("error")
    rememberVote()
    setSent("done")
  }

  if (sent === "done") return <Thanks t={t} lang={lang} />

  return (
    <form onSubmit={submit} onChange={(e) => setReady(e.currentTarget.checkValidity())}>
      {t.questions.map((q) => (
        <fieldset key={q.id} className="roles">
          <legend>{q.text}</legend>
          {Object.entries(q.options).map(([value, label]) => (
            <label key={value}>
              <input type="radio" name={q.id} value={value} required />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" className="btn glow" disabled={!ready || sent === "sending"}>
        {sent === "sending" ? t.sending : t.submit}
      </button>
      <p className="msg" role="status">
        {sent === "error" && t.error}
      </p>
      <p className="privacy">{t.privacy}</p>
    </form>
  )
}

const Results = ({ t }: { t: PollCopy }) => {
  const [tally, setTally] = useState<Tally>()

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/poll").catch(() => undefined)
      if (res?.ok) setTally(await res.json())
    }
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="results">
      <p className="total">
        <strong>{tally?.total ?? "…"}</strong> {t.answers}
      </p>
      {t.questions.map((q) => {
        const counts = tally?.counts[q.id] ?? {}
        const sum = Object.values(counts).reduce((a, b) => a + b, 0)
        return (
          <div key={q.id} className="q">
            <h2>{q.text}</h2>
            <ul className="bars">
              {Object.entries(q.options).map(([value, label]) => {
                const n = counts[value] ?? 0
                const pct = sum ? Math.round((n / sum) * 100) : 0
                return (
                  <li key={value}>
                    <span>{label}</span>
                    <strong>
                      {pct}% <small>{n}</small>
                    </strong>
                    <i>
                      <b style={{ width: `${pct}%` }} />
                    </i>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

const App = () => {
  const [lang, setLang] = useState(initialLang)
  const t = POLL[lang]
  const showResults = new URLSearchParams(location.search).has("results")

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.title
    const url = new URL(location.href)
    url.searchParams.set("lang", lang)
    history.replaceState(null, "", url)
  }, [lang, t])

  return (
    <>
      <Header lang={lang} setLang={setLang} />
      <main className="poll night">
        <div className="wrap narrow">
          <p className="eyebrow">{showResults ? t.results : t.eyebrow}</p>
          <h1>{t.heading}</h1>
          {showResults ? (
            <Results t={t} />
          ) : (
            <>
              <p className="lead">{t.lead}</p>
              <Vote t={t} lang={lang} />
            </>
          )}
        </div>
      </main>
    </>
  )
}

createRoot(document.getElementById("app") as HTMLElement).render(<App />)
