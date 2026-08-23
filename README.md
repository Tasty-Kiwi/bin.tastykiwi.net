# Kiwibin

Kiwibin is a lightweight Hastebin-compatible paste site running on Cloudflare Workers and KV. It is designed to be useful both to people in a browser and to machine clients making an ordinary HTTP request.

The repository contains two small layers:

```text
Cloudflare Worker
├── Hastebin-compatible API
└── Vite-built Preact frontend
```

The frontend is written in TypeScript and keeps paste format in the URL extension, so existing clients and routes remain compatible.

## Paste representations

Each paste has a human- and agent-readable canonical page plus specialized representations:

- `POST /documents` — create a plain-text paste
- `GET /documents/:key` — retrieve paste JSON
- `GET /:key` — canonical paste page
- `GET /:key.:extension` — canonical paste page with a syntax/format hint
- `GET /raw/:key` — exact stored source as `text/plain`
- `GET /html/:key` — standalone rendered HTML with scripts disabled
- `GET /solarized.css` — the default semantic-element theme used by HTML previews
- `GET /solarized-light.css` — the Solarized Light semantic-element theme

Canonical paste pages contain the escaped source in the initial HTML response. Reading a paste does not require JavaScript, a browser, or knowledge of the `/documents/:key` API. When available, the page advertises its `/raw/:key` alternate; HTML pages also advertise `/html/:key`.

Rendered HTML is sandboxed with a restrictive Content Security Policy. It supports HTML/CSS rendering, but arbitrary JavaScript execution is intentionally not supported.

New pastes are retained for 365 days.

HTML previews use the Solarized theme by default. It styles elements directly rather than requiring classes: `html`, `body`, `header`, `main`, `section`, `article`, `footer`, `h1`–`h4`, `p`, `strong`, `em`, `small`, `ul`, `ol`, `li`, `dl`, `dt`, `dd`, `a`, `blockquote`, `code`, `pre`, `kbd`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `hr`, `figure`, `figcaption`, `img`, `details`, and `summary`.

The stylesheets are also available at `/solarized.css` and `/solarized-light.css` for pages that need to include them explicitly.

The in-app HTML preview has Dark, Light, and Bare controls that update the shareable anchor. `#preview+dark` and `#preview+light` apply their Solarized theme across the preview and surrounding Kiwibin surface; `#preview+bare` disables Kiwibin styling inside the preview. Plain `#preview` uses the default dark theme. Standalone `/html/:key` rendering also uses the default dark theme.

## Local development

Install dependencies:

```sh
npm install
```

For the interactive frontend, run Vite and the Worker in separate terminals:

```sh
npm run dev
npm run dev:worker
```

Vite runs at `http://localhost:5173` and proxies `/documents`, `/raw`, `/html`, `/solarized.css`, and `/solarized-light.css` to the local Worker at `http://127.0.0.1:8787`. Canonical paste routes should be tested through Wrangler, because the Worker injects their initial source representation.

The full-stack, production-like route is:

```sh
npm run build
npm run dev:worker
```

Then verify the representations without running JavaScript:

```sh
curl -i http://localhost:8787/about.md
curl -i http://localhost:8787/raw/about
curl -i http://localhost:8787/html/about
```

The first response should be HTML containing the paste source itself. Missing pastes and unsupported paths return `404` instead of an empty SPA shell.

Run the checks and production build with:

```sh
npm run typecheck
npm test
npm run build
```

## Deployment

Configure the `STORAGE` KV namespace and the documented Worker variables in `wrangler.toml`, then run:

```sh
npm run deploy
```

The build writes the Vite frontend to `dist/`; Wrangler serves that directory as the Worker asset binding. Wrangler also runs `npm run build` automatically before deployment, so a direct `npx wrangler deploy` is safe for production build environments.

## Browser preview and security

Markdown preview disables raw HTML and sanitizes generated markup with DOMPurify. The in-app HTML preview is rendered in an iframe with an empty `sandbox` policy and a restrictive content-security policy. Saved HTML pastes also expose an `Open rendered page` action for `/html/:key`. Preview and standalone-render JavaScript are intentionally disabled.

## Scope

Kiwibin intentionally stays small: no accounts, full server-side application rendering, collaborative editing, large editor framework, or arbitrary JavaScript execution in previews/rendered pages.
