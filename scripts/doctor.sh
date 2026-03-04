#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="$APP_DIR/.env"
SERVICE_NAME="turtlebot.service"

ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }
err() { echo "[ERR] $*"; }

check_cmd() {
  if command -v "$1" >/dev/null 2>&1; then ok "$1 found"; else err "$1 missing"; fi
}

echo "== TurtleBot Doctor =="
check_cmd node
check_cmd npm
check_cmd systemctl
check_cmd curl

if [[ -f "$ENV_FILE" ]]; then
  ok ".env found"
else
  warn ".env missing at $ENV_FILE"
fi

if systemctl list-units --type=service | grep -q "$SERVICE_NAME"; then
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    ok "$SERVICE_NAME is active"
  else
    warn "$SERVICE_NAME exists but is not active"
  fi
else
  warn "$SERVICE_NAME not installed/enabled"
fi

if curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  ok "Ollama reachable on 127.0.0.1:11434"
else
  warn "Ollama not reachable (expected if using OpenAI mode)"
fi

echo "Doctor check complete."
