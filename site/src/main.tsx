import { hydrateRoot } from "react-dom/client"
import { App } from "./App"
import { HOME, LANGS, type Lang } from "./copy"
import "./site.css"

function isLang(value: string | null): value is Lang {
  return LANGS.includes(value as Lang)
}

function preferred(): Lang | undefined {
  const asked = new URLSearchParams(location.search).get("lang") ?? localStorage.getItem("lang")
  if (isLang(asked)) return asked
  if (navigator.language.toLowerCase().startsWith("pl")) return "pl"
}

const lang = document.documentElement.lang as Lang
const want = preferred()

if (want && want !== lang) location.replace(HOME[want])
else hydrateRoot(document.getElementById("app") as HTMLElement, <App lang={lang} />)
