import { renderToStaticMarkup } from "react-dom/server"
import { LANGS, type Lang } from "./copy"
import { Footer, SkipLink } from "./Footer"
import { DOCS, PAGES, type Page, pagePath, REVIEWED, UI } from "./legal-copy"

export const footerHtml = (lang: Lang) => renderToStaticMarkup(<Footer lang={lang} />)

const Doc = ({ lang, page }: { lang: Lang; page: Page }) => {
  const doc = DOCS[lang][page]
  const ui = UI[lang]
  return (
    <>
      <SkipLink lang={lang} />
      <header className="top">
        <div className="wrap row">
          <a className="brand" href={lang === "pl" ? "/?lang=pl" : "/"}>
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span>JustMate</span>
          </a>
          <nav className="langs links" aria-label="Language">
            {LANGS.map((l) => (
              <a key={l} href={pagePath(l, page)} lang={l} aria-current={l === lang || undefined}>
                {l.toUpperCase()}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="doc">
        <div className="wrap narrow">
          <h1>{doc.title}</h1>
          <p className="lead">{doc.intro}</p>
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {s.ul && (
                <ul>
                  {s.ul.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <p className="meta">
            {ui.updated}: {REVIEWED}
          </p>
          <p>
            <a href={lang === "pl" ? "/?lang=pl" : "/"}>{ui.home}</a>
          </p>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}

const faqLd = (lang: Lang) =>
  JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: DOCS[lang].faq.sections.map((s) => ({
      "@type": "Question",
      name: s.h,
      acceptedAnswer: { "@type": "Answer", text: s.p?.join(" ") },
    })),
  })

export function pageHtml(lang: Lang, page: Page, origin: string, head: string) {
  const doc = DOCS[lang][page]
  const alt = LANGS.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="${origin}${pagePath(l, page)}" />`,
  ).join("\n    ")
  const ld = page === "faq" ? `<script type="application/ld+json">${faqLd(lang)}</script>` : ""
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${doc.title} · JustMate</title>
    <meta name="description" content="${doc.intro.replaceAll('"', "&quot;")}" />
    <link rel="canonical" href="${origin}${pagePath(lang, page)}" />
    ${alt}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/site.css" />
    ${ld}
    ${head}
  </head>
  <body>
    ${renderToStaticMarkup(<Doc lang={lang} page={page} />)}
  </body>
</html>
`
}

export const allPages = LANGS.flatMap((lang) => PAGES.map((page) => ({ lang, page })))
