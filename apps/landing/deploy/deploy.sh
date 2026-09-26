#!/usr/bin/env bash
# Builds the static site for SITE_URL and ships it to the server, where Docker serves it behind the Caddy proxy.
# Runs locally (`npm run deploy -w @layout-fixer/landing`) and from .github/workflows/deploy-landing.yml, which
# builds first and sets SKIP_BUILD=1.
set -euo pipefail

HOST="${DEPLOY_HOST:-myserver-saber}"
SITE_URL="${SITE_URL:?Set SITE_URL, e.g. SITE_URL=https://layoutfixer.dev}"
REMOTE_DIR="apps/layout-fixer-landing"

cd "$(dirname "$0")/.."
if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  NEXT_PUBLIC_SITE_URL="$SITE_URL" npm run build
fi
test -f out/index.html || { echo "out/ has no build; run npm run build first" >&2; exit 1; }

rsync -az --delete out/ "$HOST:$REMOTE_DIR/site/"
rsync -az deploy/Dockerfile deploy/nginx.conf deploy/compose.yaml "$HOST:$REMOTE_DIR/"
ssh "$HOST" "cd $REMOTE_DIR && docker compose up -d --build && docker image prune -f >/dev/null"
echo "Deployed $SITE_URL"
