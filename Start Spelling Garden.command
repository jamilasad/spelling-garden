#!/bin/bash
# Double-click to start Spelling Garden. Keep this window open while practising.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is needed to run Spelling Garden. Install it from https://nodejs.org and try again."
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi
(sleep 1.2; open "http://localhost:${PORT:-8080}") &
exec node tools/server.mjs
