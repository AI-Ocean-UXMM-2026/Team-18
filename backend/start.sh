#!/usr/bin/env bash
# Starts the PathFinder API. Run from anywhere:  bash backend/start.sh
set -e
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  echo "No .env found — copying .env.example. Edit DATABASE_URL, JWT_SECRET and GEMINI_API_KEY!"
  cp .env.example .env
fi
if [ ! -d node_modules ]; then
  echo "Installing backend dependencies…"
  npm install
fi
npm run dev
