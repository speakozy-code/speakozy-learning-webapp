#!/usr/bin/env bash
# Pre-upload gate: tests + production build + basic artifact checks.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

npm test
npm run build

test -f dist/index.html || { echo "FAILED: dist/index.html missing"; exit 1; }
test -f firebase.json || { echo "FAILED: firebase.json missing"; exit 1; }
test -f supabase/schema.sql || { echo "FAILED: supabase/schema.sql missing"; exit 1; }

if [ ! -f .env ]; then
  echo "WARNING: no .env file — this build runs in DEMO mode."
  echo "Copy .env.example to .env and fill the backend values BEFORE building for real."
fi

echo "READY: dist/ built and checked."
echo "Hosting target: speakozy-learning (separate site — do NOT deploy over speakozy.web.app)."
echo "Next: firebase use --add <project> && firebase deploy --only hosting:speakozy-learning"
