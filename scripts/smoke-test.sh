#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

pass() { echo "[PASS] $*"; }
fail() { echo "[FAIL] $*"; exit 1; }
warn() { echo "[WARN] $*"; }

echo "== TurtleBot Smoke Test =="

command -v node >/dev/null 2>&1 && pass "node found: $(node -v)" || fail "node missing"
command -v npm >/dev/null 2>&1 && pass "npm found" || fail "npm missing"

if [[ -f .env ]]; then
  pass ".env exists"
else
  warn ".env missing (copying from .env.example for test)"
  cp .env.example .env
fi

npm run check >/dev/null 2>&1 && pass "syntax check passed" || fail "syntax check failed"

if curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  pass "Ollama reachable"
else
  warn "Ollama not reachable (okay if using OpenAI mode)"
fi

if systemctl list-unit-files 2>/dev/null | grep -q '^turtlebot.service'; then
  if systemctl is-active --quiet turtlebot.service; then
    pass "turtlebot.service active"
  else
    warn "turtlebot.service installed but not active"
  fi
else
  warn "turtlebot.service not installed"
fi

echo "Smoke test complete."