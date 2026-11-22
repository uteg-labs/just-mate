import { COPY, type Lang, TEAM } from "./copy"
import { ISSUES, OPERATOR, PAGES, pagePath, UI } from "./legal-copy"

export const SkipLink = ({ lang }: { lang: Lang }) => (
  <a className="skip" href="#main">
    {UI[lang].skip}
  </a>
)

const facts = ["legalName", "address", "companyId", "register", "vatId", "phone"] as const

export const Footer = ({ lang }: { lang: Lang }) => {
  const t = COPY[lang].footer
  const ui = UI[lang]
  return (
    <footer className="foot">
      <div className="wrap row">
        <p className="brand">
          <img src="/favicon.svg" alt="" width={24} height={24} />
          <span>JustMate</span>
          <em>{t.tagline}</em>
        </p>
        <p>{t.built}</p>
        <p className="help">{t.help}</p>
      </div>
      <div className="wrap">
        <nav className="legal" aria-label={ui.links.privacy}>
          {PAGES.map((p) => (
            <a key={p} href={pagePath(lang, p)}>
              {ui.links[p]}
            </a>
          ))}
        </nav>
        <p className="operator">
          {ui.operator}: {OPERATOR.legalName || ui.team} ({TEAM.join(", ")}).
          {facts.map((k) => OPERATOR[k] && ` ${ui[k]}: ${OPERATOR[k]}.`)} {ui.contact}:{" "}
          {OPERATOR.email ? (
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
          ) : (
            <a href={ISSUES}>{ui.contactVia}</a>
          )}
        </p>
      </div>
    </footer>
  )
}
