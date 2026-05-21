#!/bin/bash
# Quill — double-click to start the dev server and open the app in your browser.
# Lives in the project; a symlink at ~/Desktop/Quill.command points here.

set -e

# Finder doesn't inherit your shell PATH, so add common Homebrew/Node locations
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

PROJECT="/Users/kristencowpar/Cowork HQ/signal"
cd "$PROJECT"

clear
echo "── Quill ─────────────────────────────"
echo "Project: $PROJECT"
echo ""

# First-run safety: install deps if missing
if [ ! -d node_modules ]; then
  echo "Installing dependencies (one-time, ~10s)…"
  npm install
  echo ""
fi

# Bail with a useful message if .env is missing
if [ ! -f .env ]; then
  echo "Missing .env file."
  echo ""
  echo "Fix:"
  echo "  cp .env.example .env"
  echo "  open .env   # then paste your ANTHROPIC_API_KEY"
  echo ""
  read -n 1 -s -r -p "Press any key to close…"
  exit 1
fi

# Open the browser once Vite has had a moment to boot
( sleep 3 && open "http://localhost:5173" ) &

echo "Starting both servers. Browser will open in a few seconds."
echo "Press Ctrl+C to stop."
echo ""

exec npm run dev
