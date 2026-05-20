# Signal

A LinkedIn writing partner. Scans for trending topics across product management,
AI adoption, and product leadership, then generates angles and full post drafts
in a specific voice.

The writer's voice profile and frameworks are baked into the backend system
prompt (`voice.js`). The UI never asks who is writing or shows that profile.

## Stack

- React + Vite frontend on `:5173`
- Express backend on `:3001`
- Anthropic Messages API with `web_search` tool (model: `claude-sonnet-4-6`)
- Draft history in `localStorage`

## Setup

```bash
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY
npm install
npm run dev
```

`npm run dev` runs Vite and the API together via `concurrently`. Open
<http://localhost:5173>.

To run them separately:

```bash
node server.js   # API on :3001
npm run vite     # frontend on :5173 (proxies /api to the backend)
```

## Endpoints

- `POST /api/scan` — runs a web search and returns 5–7 trending topics,
  each with a fit rating and 2–3 voice-matched angles.
- `POST /api/draft` — body `{ topic, angle }` → returns a 150–250 word
  LinkedIn post written in the configured voice.
- `GET /api/health` — sanity check.

## Files

- `voice.js` — the voice profile and hard rules. Edit here to tune output.
- `server.js` — Express API.
- `src/App.jsx` — screen router (Scan / Draft / History).
- `src/screens/` — one file per screen.
- `src/storage.js` — localStorage wrapper for draft history (capped at 50).

## Notes

- Scans take 20–40 seconds because the model runs web search.
- A scan response is parsed as JSON; the parser tolerates fenced code blocks.
- Drafts auto-save on blur and on every (re)generation.
