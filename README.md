# Zithara AI Layer — Frontend

Vite + React console for the Tyaani / Zithara AI agent. Configure the brand, knowledge sources, ads, and model, then test chat in the Playground.

Companion API: [`ai_poc_be`](https://github.com/dileep-zithara/ai_poc_be).

## Requirements

- Node.js 20+
- npm
- Backend running (default `http://localhost:4200`)

## Setup

```bash
cd ai_poc_fe
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5175`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on port 5175 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |

## Environment

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE` | `http://localhost:4200/api` | Backend API prefix |

For production, point this at the public API, for example:

```bash
VITE_API_BASE=https://api.zagent.zithara.live/api
```

Rebuild after changing `VITE_*` variables. They are inlined at build time.

## Screens

| Tab | What it does |
|---|---|
| Business Profile | Fetch brand, stores, hours, policies from a website |
| Documents | Upload `.docx` files into the knowledge base |
| Ad Source Context | Sync or import Meta ads, map an ad to a product |
| Web Sources | Crawl site pages into the KB |
| Playground | Test chat, channels, ads, and webhook JSON |
| Model Settings | Provider API keys and active model |
| Customize | AI replies, human handoff, nudges |

On a phone, use the header menu to switch tabs. Playground splits **Chat** and **Ad context** into two views.

## Typical flow

1. Start [`ai_poc_be`](https://github.com/dileep-zithara/ai_poc_be)
2. Open this app
3. **Model Settings** — save a provider key
4. **Business Profile** — Fetch everything from the brand site
5. **Ad Source Context** — Fetch live ads (needs `ZITHARA_PROD_DATABASE_URL` on the backend)
6. **Playground** — send a customer message or a webhook sample

Website import is async. The UI polls until the server finishes; a 504 on the public API usually means the old backend is still running.

## Deploy notes

1. Pull this repo
2. Set `VITE_API_BASE` for the environment
3. `npm ci && npm run build`
4. Serve `dist/` (Nginx, S3, etc.)
5. Restart / republish after every pull
