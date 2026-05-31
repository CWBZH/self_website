#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/apps/personal-room}"
SERVICE_NAME="${SERVICE_NAME:-personal-room}"
PUBLIC_PORT="${PUBLIC_PORT:-3001}"
APP_PORT="${APP_PORT:-3002}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env.production}"

failures=0

pass() {
  printf '[PASS] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1"
  failures=$((failures + 1))
}

has_command() {
  command -v "$1" >/dev/null 2>&1
}

printf 'Personal Room preflight\n'
printf 'APP_DIR=%s\n' "$APP_DIR"
printf 'SERVICE_NAME=%s\n' "$SERVICE_NAME"
printf 'PUBLIC_PORT=%s\n' "$PUBLIC_PORT"
printf 'APP_PORT=%s\n' "$APP_PORT"
printf '\n'

if [ -d "$APP_DIR" ]; then
  pass "app directory exists"
else
  fail "app directory does not exist: ${APP_DIR}"
fi

if [ -f "${APP_DIR}/package.json" ]; then
  pass "package.json exists"
else
  fail "package.json missing"
fi

if has_command node; then
  node_major="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
  if [ "$node_major" -ge 18 ]; then
    pass "node version is >= 18 ($(node -v))"
  else
    fail "node version must be >= 18, found $(node -v)"
  fi
else
  fail "node is not installed"
fi

if has_command npm; then
  pass "npm is installed ($(npm -v))"
else
  fail "npm is not installed"
fi

if has_command nginx; then
  pass "nginx is installed"
else
  warn "nginx is not installed; direct port deployment is still possible"
fi

if has_command systemctl; then
  pass "systemd is available"
else
  fail "systemd is not available"
fi

if [ -f "$ENV_FILE" ]; then
  pass ".env.production exists"
else
  fail "environment file missing: ${ENV_FILE}"
fi

if [ -f "$ENV_FILE" ]; then
  if grep -q 'change-me\|replace-with' "$ENV_FILE"; then
    fail "environment file still contains placeholder values"
  else
    pass "environment file has no placeholder values"
  fi

  if grep -q '^NEXT_PUBLIC_SITE_URL=' "$ENV_FILE"; then
    pass "NEXT_PUBLIC_SITE_URL is configured"
  else
    fail "NEXT_PUBLIC_SITE_URL is missing"
  fi

  if grep -q '^STUDIO_PASSWORD_HASH=' "$ENV_FILE"; then
    pass "STUDIO_PASSWORD_HASH is configured"
  elif grep -q '^STUDIO_PASSWORD=' "$ENV_FILE"; then
    warn "STUDIO_PASSWORD is configured; STUDIO_PASSWORD_HASH is preferred"
  else
    fail "Studio password is not configured"
  fi

  if grep -q '^STUDIO_SESSION_SECRET=' "$ENV_FILE"; then
    pass "STUDIO_SESSION_SECRET is configured"
  else
    fail "STUDIO_SESSION_SECRET is missing"
  fi
fi

if ss -ltn 2>/dev/null | grep -q ":${PUBLIC_PORT} "; then
  warn "public port ${PUBLIC_PORT} is already listening"
else
  pass "public port ${PUBLIC_PORT} is free or managed by nginx later"
fi

if ss -ltn 2>/dev/null | grep -q ":${APP_PORT} "; then
  warn "app port ${APP_PORT} is already listening"
else
  pass "app port ${APP_PORT} is free"
fi

if systemctl list-unit-files 2>/dev/null | grep -q "^${SERVICE_NAME}.service"; then
  warn "systemd service already exists: ${SERVICE_NAME}.service"
else
  pass "systemd service name is available"
fi

printf '\n'
if [ "$failures" -gt 0 ]; then
  printf 'Preflight failed with %s issue(s).\n' "$failures"
  exit 1
fi

printf 'Preflight passed.\n'

