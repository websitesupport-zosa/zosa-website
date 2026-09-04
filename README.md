# Zosa Agentic — product site

A single-page static site. **No build step, no dependencies, no server code.**
Two files are the entire site:

```
index.html                          the whole site (markup + CSS + JS)
Zosa-Agentic-Logo-transparent.png   the header mark
```

Open `index.html` in a browser and it runs. That's also all a host needs.

---

## Deploying it live

Any static host works. Fastest options, roughly in order of effort:

**1. Netlify Drop** — https://app.netlify.com/drop
Drag this folder onto the page. It's live on a `*.netlify.app` URL in seconds,
no account needed to start. Add a custom domain later in Site settings → Domain
management.

**2. Cloudflare Pages** — https://pages.cloudflare.com
Create a project → "Direct Upload" → drag this folder. Build command: none.
Output directory: `/`.

**3. Vercel** — https://vercel.com
New Project → import the folder or a Git repo. Framework preset: **Other**.
Build command: leave empty. Output directory: `.`

**4. GitHub Pages**
Push these files to a repo, then Settings → Pages → Source: `main` / root.
Served at `https://<user>.github.io/<repo>/`.

**5. Existing hosting / S3 / nginx**
Copy both files into the web root. Nothing else to configure — no rewrites,
no SPA fallback, no Node runtime.

### Pointing zosa-agentic.ai at it
Whichever host is used, add the domain in its dashboard and set the DNS record
it gives you (usually a `CNAME` for `www` and an `A`/`ALIAS` for the apex).
HTTPS is automatic on all four hosts above.

---

## Two things to know before it goes live

**1. The contact form doesn't submit anywhere.**
On the Contact page, the form composes a pre-filled `mailto:` to
`info@zosa-agentic.ai` and opens the visitor's mail client. Nothing is sent or
stored by the page. For real submissions, point the form at a service —
[Formspree](https://formspree.io), [Web3Forms](https://web3forms.com) or a
Netlify Form (add `netlify` to the `<form>` tag) — and remove the JS handler at
the bottom of `index.html` marked `contact form → pre-filled email`.

**2. Fonts load from Google Fonts.**
Space Grotesk, Manrope and IBM Plex Mono come from `fonts.googleapis.com`, so
the page needs internet on first load. Offline or blocked, it falls back to
Segoe UI / system sans and still works. To self-host them instead, download the
woff2 files and swap the `<link>` in `<head>` for `@font-face` rules.

---

## How the file is organised

Everything lives in `index.html`. Searching for these comment banners will get
you to the right place:

| Section | What it is |
|---|---|
| `:root{` | Palette and type system — colours, fonts, radius |
| `top bar / product menu` | The nav; each tab is a `<button data-target="...">` |
| `circular stage` | The circle: ring, watermark, hub (the product mockup) |
| `the six cards` | Card styling; sizes are `em` off one font size (`--fs`) |
| `LIVING ORBIT + WARP` | The tab-change animation and the idle drift |
| `ABOUT / CONTACT` | The two document pages, and the site footer |
| `product menu routing` | JS: hash routing, page transitions |
| `fit the circle` | JS: measures the space and positions the six cards |

### Adding or editing a product page
Copy a whole `<section class="page" id="page-...">` block, give it a new `id`,
set its `--accent` / `--accent-soft` in the inline style, add a matching
`<button data-target="...">` to the nav, and edit the six `.node` cards and the
hub SVG. Routing, layout and animation pick it up automatically — the six cards
must keep their `data-fx` values, which place them on the arc.

### The layout is measured, not hard-coded
JS sizes the circle and positions the cards from the free space, so the
geometry is identical on every product tab and nothing overlaps at any window
size. Below 900px wide it unrolls into a single scrolling column with the
circle on top. All motion respects `prefers-reduced-motion`.
