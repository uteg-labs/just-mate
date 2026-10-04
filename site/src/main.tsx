import { type FormEvent, type SyntheticEvent, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { Clip, clips } from "./Clip"
import { COPY, type Copy, LANGS, type Lang, LINKS, SHOTS, type Story, TEAM } from "./copy"
import { Glyph } from "./Glyph"
import "./site.css"

type Sent = "idle" | "sending" | "done" | "error" | "invalid"

function initialLang(): Lang {
  const asked = new URLSearchParams(location.search).get("lang")
  if (asked === "en" || asked === "pl") return asked
  return navigator.language.toLowerCase().startsWith("pl") ? "pl" : "en"
}

const Header = ({ t, lang, setLang }: { t: Copy; lang: Lang; setLang: (l: Lang) => void }) => (
  <header className="top">
    <div className="wrap row">
      <a className="brand" href="#top">
        <img src="favicon.svg" alt="" width={28} height={28} />
        <span>just-mate</span>
      </a>
      <nav className="links" aria-label="Sections">
        <a href="#how">{t.nav.how}</a>
        <a href="#safety">{t.nav.safety}</a>
        <a href="#venues">{t.nav.venues}</a>
      </nav>
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
      <a className="btn sm primary" href="#join">
        {t.nav.join}
      </a>
    </div>
  </header>
)

const Hero = ({ t, lang }: { t: Copy; lang: Lang }) => {
  const watch = (e: SyntheticEvent) => {
    clips.get("Main")?.listen(e)
    document.getElementById("film")?.scrollIntoView({ behavior: "smooth", block: "center" })
  }
  return (
    <section className="hero aurora" id="top">
      <div className="wrap">
        <p className="eyebrow">{t.hero.eyebrow}</p>
        <h1>{t.hero.title}</h1>
        <p className="lead">{t.hero.lead}</p>
        <div className="ctas">
          <a className="btn primary" href="#join">
            {t.hero.join}
            <Glyph name="arrow-right" size={18} color="#FAFAFA" />
          </a>
          <button type="button" className="btn tint" onClick={watch}>
            <Glyph name="volume-2" size={18} />
            {t.hero.watch}
          </button>
        </div>
      </div>
      <div className="wrap wide" id="film">
        <Clip id="Main" poster={540} lang={lang} t={t.clip} eager />
      </div>
    </section>
  )
}

const Problem = ({ t }: { t: Copy["problem"] }) => (
  <section className="problem">
    <div className="wrap">
      <p className="eyebrow">{t.eyebrow}</p>
      <h2>{t.title}</h2>
      <p className="lead">{t.lead}</p>
      <dl className="stats">
        {t.stats.map((s) => (
          <div key={s.n}>
            <dt>{s.n}</dt>
            <dd>
              {s.label}
              <small>{s.src}</small>
            </dd>
          </div>
        ))}
      </dl>
      <h3 className="sub">{t.barriersTitle}</h3>
      <ol className="barriers">
        {t.barriers.map((b) => (
          <li key={b.t}>
            <strong>{b.t}</strong>
            <span>{b.d}</span>
          </li>
        ))}
      </ol>
    </div>
  </section>
)

const Rules = ({ t }: { t: Copy["rules"] }) => (
  <section className="rules">
    <div className="wrap">
      <p className="eyebrow">{t.eyebrow}</p>
      <h2>{t.title}</h2>
      <ul className="cards">
        {t.items.map((r, i) => (
          <li key={r.icon} className={`rule r${i}`}>
            <Glyph name={r.icon} size={30} color={i === 2 ? "#F5F5F7" : "#1A1205"} slash />
            <h3>{r.t}</h3>
            <p>{r.d}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
)

const Speeds = ({ t }: { t: Copy["speeds"] }) => (
  <section className="speeds" id="how">
    <div className="wrap">
      <p className="eyebrow">{t.eyebrow}</p>
      <h2>{t.title}</h2>
      <div className="pair">
        <a className="speed plan" href="#plan">
          <Glyph name="calendar-heart" size={28} />
          <h3>{t.plan.t}</h3>
          <p>{t.plan.d}</p>
        </a>
        <a className="speed now" href="#now">
          <span className="dot" aria-hidden="true" />
          <h3>{t.now.t}</h3>
          <p>{t.now.d}</p>
        </a>
      </div>
      <p className="end">{t.end}</p>
    </div>
  </section>
)

const Shots = ({ label }: { label: string }) => (
  <figure className="shots">
    <div className="strip">
      {SHOTS.map((s) => (
        <img key={s} src={`shots/${s}.webp`} alt="" loading="lazy" width={402} height={874} />
      ))}
    </div>
    <figcaption className="eyebrow">{label}</figcaption>
  </figure>
)

const StorySection = ({ s, i, t, lang }: { s: Story; i: number; t: Copy; lang: Lang }) => (
  <section id={s.id} className={`story${s.dark ? " night" : ""}${i % 2 ? " flip" : ""}`}>
    <div className="wrap grid">
      <div className="text">
        <p className="tag">{s.tag}</p>
        <h2>{s.title}</h2>
        <p className="body">{s.body}</p>
        <ul className="points">
          {s.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        {s.note && <p className="note">{s.note}</p>}
      </div>
      <Clip id={s.piece} poster={s.poster} lang={lang} t={t.clip} />
    </div>
    {s.shots && (
      <div className="wrap">
        <Shots label={t.shots} />
      </div>
    )}
  </section>
)

const Pays = ({ t }: { t: Copy["pays"] }) => (
  <section className="pays">
    <div className="wrap">
      <p className="eyebrow">{t.eyebrow}</p>
      <h2>{t.title}</h2>
      <ul className="tiles">
        {t.items.map((p) => (
          <li key={p.n}>
            <strong>{p.n}</strong>
            <span>{p.d}</span>
          </li>
        ))}
      </ul>
      <p className="readout">{t.readout}</p>
    </div>
  </section>
)

const Care = ({ t }: { t: Copy["care"] }) => (
  <section className="care aurora">
    <div className="wrap narrow">
      <img src="favicon.svg" alt="" width={56} height={56} />
      <h2>{t.title}</h2>
      <p>{t.body}</p>
    </div>
  </section>
)

const Demo = ({ t }: { t: Copy["demo"] }) => (
  <section className="demo">
    <div className="wrap">
      <p className="eyebrow">{t.eyebrow}</p>
      <h2>{t.title}</h2>
      <div className="lists">
        <div>
          <h3>{t.realTitle}</h3>
          <ul className="real">
            {t.real.map((r) => (
              <li key={r}>
                <Glyph name="check" size={18} color="#14B8A6" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{t.cannedTitle}</h3>
          <ul className="canned">
            {t.canned.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="docs">
        <a className="btn tint" href={LINKS.deck} target="_blank" rel="noreferrer">
          <Glyph name="file-text" size={18} />
          {t.deck} · PDF
        </a>
        <a className="btn tint" href={LINKS.whitepaper} target="_blank" rel="noreferrer">
          <Glyph name="file-text" size={18} />
          {t.whitepaper} · PDF
        </a>
        <a className="btn tint" href={LINKS.github} target="_blank" rel="noreferrer">
          <Glyph name="github" size={18} />
          {t.github}
        </a>
      </div>
      <p className="team">
        <span className="eyebrow">{t.team}</span>
        {TEAM.join(" · ")}
      </p>
    </div>
  </section>
)

const Join = ({ t, lang }: { t: Copy["join"]; lang: Lang }) => {
  const [sent, setSent] = useState<Sent>("idle")

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent("sending")
    const body = JSON.stringify({ ...Object.fromEntries(new FormData(e.currentTarget)), lang })
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }).catch(() => undefined)
    if (res?.ok) return setSent("done")
    setSent(res?.status === 400 ? "invalid" : "error")
  }

  return (
    <section className="join night" id="join">
      <div className="wrap narrow">
        <h2>{t.title}</h2>
        <p className="lead">{t.body}</p>
        {sent === "done" ? (
          <p className="done" role="status">
            <Glyph name="circle-check" size={22} color="#30D158" />
            {t.done}
          </p>
        ) : (
          <form onSubmit={submit}>
            <label className="field">
              <span>{t.email}</span>
              <input type="email" name="email" required autoComplete="email" maxLength={254} />
            </label>
            <fieldset className="roles">
              <legend>{t.role}</legend>
              <label>
                <input type="radio" name="role" value="person" defaultChecked />
                <span>{t.roles.person}</span>
              </label>
              <label>
                <input type="radio" name="role" value="venue" />
                <span>{t.roles.venue}</span>
              </label>
            </fieldset>
            <label className="field">
              <span>{t.city}</span>
              <input
                name="city"
                placeholder={t.cityHint}
                maxLength={80}
                autoComplete="address-level2"
              />
            </label>
            <input
              className="hp"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <button type="submit" className="btn glow" disabled={sent === "sending"}>
              {sent === "sending" ? t.sending : t.submit}
            </button>
            <p className="msg" role="status">
              {sent === "error" && t.error}
              {sent === "invalid" && t.invalid}
            </p>
            <p className="privacy">{t.privacy}</p>
          </form>
        )}
      </div>
    </section>
  )
}

const Footer = ({ t }: { t: Copy["footer"] }) => (
  <footer className="foot">
    <div className="wrap row">
      <p className="brand">
        <img src="favicon.svg" alt="" width={24} height={24} />
        <span>just-mate</span>
        <em>{t.tagline}</em>
      </p>
      <p>{t.built}</p>
      <p className="help">{t.help}</p>
    </div>
  </footer>
)

const App = () => {
  const [lang, setLang] = useState(initialLang)
  const t = COPY[lang]

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.meta.description)
    const url = new URL(location.href)
    url.searchParams.set("lang", lang)
    history.replaceState(null, "", url)
  }, [lang, t])

  return (
    <>
      <Header t={t} lang={lang} setLang={setLang} />
      <main>
        <Hero t={t} lang={lang} />
        <Problem t={t.problem} />
        <Rules t={t.rules} />
        <Speeds t={t.speeds} />
        {t.stories.map((s, i) => (
          <StorySection key={s.id} s={s} i={i} t={t} lang={lang} />
        ))}
        <Pays t={t.pays} />
        <Care t={t.care} />
        <Demo t={t.demo} />
        <Join t={t.join} lang={lang} />
      </main>
      <Footer t={t.footer} />
    </>
  )
}

createRoot(document.getElementById("app") as HTMLElement).render(<App />)
