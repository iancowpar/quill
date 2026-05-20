# Quill

A LinkedIn writing partner. Two ways in:

1. **Scan for signals** — runs a web search for what's actually being discussed
   in PM, AI adoption, and product leadership over the past seven days.
2. **Paste from my feed** — drop in post titles, topics, or URLs you're already
   seeing trend in your feed.

Either path returns a set of topics with a fit rating and 2–3 angles in your
voice. Pick one to generate a full post draft.

The writer's voice profile and frameworks are baked into the backend system
prompt (`voice.js`). The UI never asks who is writing or shows that profile.

## Stack

- React + Vite frontend on `:5173`
- Express backend on `:3001`
- Anthropic Messages API (model: `claude-sonnet-4-6`); `web_search` tool used by
  scan mode only
- Draft history in `localStorage` (key `quill.history.v1`, capped at 50)

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

- `POST /api/scan` — runs a web search; returns 5–7 trending topics with fit
  ratings and 2–3 voice-matched angles each.
- `POST /api/angles` — body `{ inputs: ["...", "..."] }`. No web search; turns
  the pasted list into the same topic-card format.
- `POST /api/draft` — body `{ topic, angle }`; returns a 150–250 word post in
  the configured voice.
- `GET /api/health` — sanity check.

## Files

- `voice.js` — the voice profile and hard rules. Edit here to tune output.
- `server.js` — Express API.
- `src/App.jsx` — screen router (Scan / Draft / History).
- `src/screens/ScanScreen.jsx` — both input modes (scan + paste) on one screen.
- `src/storage.js` — localStorage wrapper for draft history.

## Notes

- Scans take 20–40 seconds (web search). Paste mode is ~10–20 seconds.
- Scan responses are parsed as JSON; the parser tolerates fenced code blocks
  and surrounding prose.
- Drafts auto-save on blur and on every (re)generation.
