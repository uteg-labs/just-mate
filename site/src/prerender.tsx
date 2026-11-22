import { renderToString } from "react-dom/server"
import { App } from "./App"
import { COPY, HOME, LANGS, type Lang, LINKS } from "./copy"

const LOCALE: Record<Lang, string> = { en: "en_GB", pl: "pl_PL" }

function esc(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")
}

function jsonLd(lang: Lang, origin: string) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#org`,
        name: "JustMate",
        url: `${origin}/`,
        logo: `${origin}/icon-512.png`,
        sameAs: [LINKS.github, LINKS.youtube],
      },
      {
        "@type": "WebSite",
        name: "JustMate",
        url: origin + HOME[lang],
        inLanguage: lang,
        publisher: { "@id": `${origin}/#org` },
      },
    ],
  }
  return JSON.stringify(data).replaceAll("<", "\\u003c")
}

function head(lang: Lang, origin: string) {
  const t = COPY[lang].meta
  const url = origin + HOME[lang]
  const alternates = LANGS.map((l) => [l, origin + HOME[l]]).concat([["x-default", `${origin}/`]])
  return [
    `<title>${esc(t.title)}</title>`,
    `<meta name="description" content="${esc(t.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    ...alternates.map(([l, href]) => `<link rel="alternate" hreflang="${l}" href="${href}" />`),
    `<meta property="og:title" content="${esc(t.title)}" />`,
    `<meta property="og:description" content="${esc(t.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="${LOCALE[lang]}" />`,
    ...LANGS.filter((l) => l !== lang).map(
      (l) => `<meta property="og:locale:alternate" content="${LOCALE[l]}" />`,
    ),
    `<script type="application/ld+json">${jsonLd(lang, origin)}</script>`,
  ].join("\n    ")
}

export function page(lang: Lang, origin: string, template: string) {
  return template
    .replaceAll("%ORIGIN%", origin)
    .replace('<html lang="en">', `<html lang="${lang}">`)
    .replace("%HEAD%", () => head(lang, origin))
    .replace("%APP%", () => app(lang))
}

// react adds image preloads ahead of the markup; inside #app they don't match what hydrates
function app(lang: Lang) {
  return renderToString(<App lang={lang} />).replace(/<link rel="preload" as="image"[^>]*\/>/g, "")
}

export const pages = LANGS.map((lang) => ({
  lang,
  file: HOME[lang] === "/" ? "index.html" : `${HOME[lang].slice(1)}.html`,
}))
