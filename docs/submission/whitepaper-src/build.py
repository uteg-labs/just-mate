import re, sys, glob, asyncio, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).parent
SL = '<line x1="3" y1="3" x2="21" y2="21"/>'
ICONS = {
  "face-off": '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.3 1.6 3.5 1.6 3.5-1.6 3.5-1.6"/><line x1="9" y1="9.5" x2="9.01" y2="9.5"/><line x1="15" y1="9.5" x2="15.01" y2="9.5"/>' + SL,
  "chat-off": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>' + SL,
  "pin-off": '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>' + SL,
  "pin": '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  "calendar": '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  "zap": '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  "nav": '<polygon points="12 2 19 21 12 17 5 21 12 2"/>',
  "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "heart": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  "repeat": '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  "clock": '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  "check": '<path d="M20 6 9 17l-5-5"/>',
  "games": '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/><circle cx="8.5" cy="15.5" r="1"/>',
  "id": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/>',
  "eye-off": '<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><line x1="2" y1="2" x2="22" y2="22"/>',
  "life": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/>',
  "walk": '<circle cx="13" cy="4" r="2"/><path d="m9 20 3-6 3 3v4"/><path d="m6 12 3-4 4 1 3 3h3"/><path d="m12 14-1-5"/>',
}
def icon(m):
    name = m.group(1)
    return f'<svg viewBox="0 0 24 24">{ICONS[name]}</svg>'

def assemble(parts, css, out):
    body = "\n".join((ROOT / p).read_text() for p in parts)
    body = re.sub(r"\{\{i:([\w-]+)\}\}", icon, body)
    html = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>JustMate — Whitepaper</title><link rel="stylesheet" href="{css}"></head><body>{body}</body></html>'
    (ROOT / out).write_text(html)
    return ROOT / out

async def render(html_path, pdf_path, landscape=False):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto(html_path.as_uri())
        await pg.wait_for_load_state("networkidle")
        await pg.evaluate("document.fonts.ready")
        await pg.pdf(path=str(pdf_path), prefer_css_page_size=True, print_background=True)
        await b.close()

if __name__ == "__main__":
    kind = sys.argv[1] if len(sys.argv) > 1 else "wp"
    if kind == "wp":
        parts = sorted(glob.glob(str(ROOT / "p[0-9].html")))
        h = assemble([pathlib.Path(p).name for p in parts], "style.css", "whitepaper.html")
        asyncio.run(render(h, ROOT / "JustMate-Whitepaper.pdf"))
    else:
        h = assemble(["deck_body.html"], "deck.css", "deck.html")
        asyncio.run(render(h, ROOT / "JustMate-Deck.pdf"))
    print("ok")
