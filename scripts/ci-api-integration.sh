#!/usr/bin/env bash
set -euo pipefail
backend="$(realpath "${1:?Pass the backend checkout directory}")"
evidence="node_modules/.cache/bulsca-api-integration"
mkdir -p "$evidence"
evidence="$(realpath "$evidence")"
export APP_ENV=testing
export APP_DEBUG=false
export APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
export DB_URL=''
export CACHE_DRIVER=file
export CACHE_STORE=file
export SESSION_DRIVER=array
export MAIL_MAILER=array
export PUBLIC_API_RATE_LIMIT=10000
export PUBLIC_INTEGRATION_DIRECTORY="$(mktemp -d "${RUNNER_TEMP:-/tmp}/bulsca-public-integration.XXXXXX")"
php_pid=''; vite_pid=''; chrome_pid=''
cleanup() {
  for child_pid in "$php_pid" "$vite_pid" "$chrome_pid"; do
    if [[ -n "$child_pid" ]]; then kill "$child_pid" 2>/dev/null || true; fi
  done
  if [[ -f "$PUBLIC_INTEGRATION_DIRECTORY/diagnostics.log" ]]; then cp "$PUBLIC_INTEGRATION_DIRECTORY/diagnostics.log" "$evidence/diagnostics.log"; fi
}
trap cleanup EXIT
php "$backend/tests/Support/seed-public-api.php" "$evidence/manifest.json" >"$evidence/seed.log" 2>&1
php -d display_errors=0 -S 127.0.0.1:8000 -t "$backend/public" "$backend/tests/Support/public-api-router.php" >"$evidence/api.log" 2>&1 &
php_pid=$!
VITE_PUBLIC_DATA_MODE=live node_modules/.bin/vite --host 127.0.0.1 --port 5175 --strictPort >"$evidence/vite.log" 2>&1 &
vite_pid=$!
"${CHROME_BIN:-google-chrome}" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --no-first-run --disable-background-networking \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9223 --user-data-dir="$PUBLIC_INTEGRATION_DIRECTORY/chrome" about:blank >"$evidence/chrome.log" 2>&1 &
chrome_pid=$!
ready() {
  for attempt in {1..60}; do
    if ! kill -0 "$2" 2>/dev/null; then echo "Process exited before $1 was ready" >&2; return 1; fi
    if curl --fail --silent --max-time 2 "$1" >/dev/null; then return; fi
    sleep 1
  done
  echo "Timed out waiting for $1" >&2; return 1
}
ready http://127.0.0.1:8000/api/v1/presentation "$php_pid"
ready http://127.0.0.1:5175/ "$vite_pid"
ready http://127.0.0.1:9223/json/version "$chrome_pid"
node scripts/verify-api-browser.mjs "$evidence/manifest.json" "$evidence"
