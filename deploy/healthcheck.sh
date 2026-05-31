#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${SITE_URL:-http://127.0.0.1:3002}"
STUDIO_PASSWORD="${STUDIO_PASSWORD:-}"

printf 'Health checking %s\n' "$SITE_URL"

curl -fsS -I "${SITE_URL}/" >/dev/null
printf '[PASS] home responds\n'

curl -fsS "${SITE_URL}/api/health" >/dev/null
printf '[PASS] api health responds\n'

curl -fsS "${SITE_URL}/api/room/messages" >/dev/null
printf '[PASS] room messages responds\n'

curl -fsS "${SITE_URL}/api/room/presence" >/dev/null
printf '[PASS] room presence responds\n'

events_output="$(mktemp)"
set +e
curl -fsS --max-time 3 "${SITE_URL}/api/room/events?roomId=main" >"$events_output" 2>/dev/null
events_status=$?
set -e

if [ "$events_status" -ne 0 ] && [ "$events_status" -ne 28 ]; then
  rm -f "$events_output"
  printf '[FAIL] room events stream failed\n' >&2
  exit 1
fi

if grep -q 'event: snapshot' "$events_output"; then
  printf '[PASS] room events stream responds\n'
else
  rm -f "$events_output"
  printf '[FAIL] room events stream did not emit a snapshot\n' >&2
  exit 1
fi

rm -f "$events_output"

curl -fsS "${SITE_URL}/api/comments?postType=journal&postSlug=personal-digital-room" >/dev/null
printf '[PASS] comments responds\n'

if [ -n "$STUDIO_PASSWORD" ]; then
  SITE_URL="$SITE_URL" STUDIO_PASSWORD="$STUDIO_PASSWORD" npm run site:smoke
else
  printf '[WARN] STUDIO_PASSWORD not provided; skipped full smoke test\n'
fi

printf 'Health check complete.\n'
