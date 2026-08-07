# Kiwibin

Kiwibin is a lightweight Hastebin-compatible paste site running on Cloudflare Workers and KV.

The repository contains two small layers:

```text
Cloudflare Worker
├── Hastebin-compatible API
└── Vite-built Preact frontend
```

The frontend is written in TypeScript and keeps paste format in the URL extension, so existing clients and routes remain compatible:

- `POST /documents` — create a plain-text paste
- `GET /documents/:key` — retrieve paste JSON
- `GET /raw/:key` — retrieve paste text
- `/:key` — view a paste
- `/:key.:extension` — view a paste with a syntax/format hint

## Local development

Install dependencies:

```sh
npm install
```

Run the frontend and Worker in separate terminals:

```sh
npm run dev
npm run dev:worker
```

Vite runs at `http://localhost:5173` and proxies `/documents` and `/raw` to the local Worker at `http://127.0.0.1:8787`.

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

The build writes the Vite frontend to `dist/`; Wrangler serves that directory as the Worker asset binding.

## Preview security

Markdown preview disables raw HTML and sanitizes generated markup with DOMPurify. HTML preview is rendered in an iframe with an empty `sandbox` policy and a restrictive content-security policy. Preview JavaScript is intentionally disabled.

## Scope

Kiwibin intentionally stays small: no accounts, server-side rendering, collaborative editing, large editor framework, or arbitrary JavaScript execution in previews.
