#!/usr/bin/env bash
set -euo pipefail

evidence="node_modules/.cache/bulsca-browser"
mkdir -p "$evidence"
preview_pid=''
live_pid=''
chrome_pid=''
cleanup() {
  for child_pid in "$preview_pid" "$live_pid" "$chrome_pid"; do
    if [[ -n "$child_pid" ]]; then kill "$child_pid" 2>/dev/null || true; fi
  done
}
trap cleanup EXIT

chrome_binary="${CHROME_BIN:-google-chrome}"
command -v "$chrome_binary"
"$chrome_binary" --version
"$chrome_binary" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --no-first-run --disable-background-networking --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 --user-data-dir="${RUNNER_TEMP:-/tmp}/bulsca-ci-chrome-$$" \
  about:blank >"$evidence/chrome.log" 2>&1 &
chrome_pid=$!
VITE_PUBLIC_DATA_MODE=preview node_modules/.bin/vite --mode preview-data --host 127.0.0.1 --port 5173 --strictPort \
  >"$evidence/preview-server.log" 2>&1 &
preview_pid=$!
VITE_PUBLIC_DATA_MODE=live node_modules/.bin/vite --host 127.0.0.1 --port 5174 --strictPort \
  >"$evidence/live-server.log" 2>&1 &
live_pid=$!

wait_for() {
  local endpoint="$1"
  local server_pid="$2"
  for attempt in {1..60}; do
    if ! kill -0 "$server_pid" 2>/dev/null; then
      echo "Server process $server_pid exited before $endpoint was ready" >&2
      return 1
    fi
    if curl --fail --silent --max-time 2 "$endpoint" >/dev/null; then return; fi
    sleep 1
  done
  echo "Timed out waiting for $endpoint" >&2
  return 1
}
wait_for http://127.0.0.1:9222/json/version "$chrome_pid"
wait_for http://127.0.0.1:5173/ "$preview_pid"
wait_for http://127.0.0.1:5174/ "$live_pid"
npm run test:browser
npm run test:browser -- --live
node --input-type=module - <<'JS'
import { readFileSync } from 'node:fs'
for (const mode of ['preview', 'live']) {
  const report = JSON.parse(readFileSync(`node_modules/.cache/bulsca-browser/${mode}/report.json`))
  if (!report.visits.length || !report.checks.length || report.checks.some(check => !check.pass)) {
    throw new Error(`${mode} browser evidence is missing or contains failures`)
  }
}
JS
