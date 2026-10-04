# Whitepaper source (22 pages)

The detailed product and technical whitepaper: `p1.html`–`p6.html` (chapters 00–14) + `style.css` + `assets/`.

```bash
cd docs/submission/whitepaper-src
pip install playwright && python3 -m playwright install chromium   # once
python3 build.py wp          # → whitepaper.html + JustMate-Whitepaper.pdf here
cp JustMate-Whitepaper.pdf ../JustMate-Whitepaper.pdf
```

`{{i:name}}` in the parts are Lucide-style icons filled in by `build.py`. The cover glows are a pre-rendered PNG (`assets/cover-bg.png`) and the lede highlight is a box-shadow, because Chromium on Linux writes CSS gradients as PDF function shadings that pdf.js and some viewers can't draw.

Rule for every sentence: it describes what the build does, or it is labelled production path (`M1`).
