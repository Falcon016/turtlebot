#!/usr/bin/env bash
set -euo pipefail

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "[ERR] Missing command: $1"; return 1; }; }
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }
info() { echo "[INFO] $*"; }

if [[ "${EUID}" -ne 0 ]]; then
  if [[ "$(uname -s)" == "Linux" ]]; then
    warn "Not running as root. Install/update scripts require sudo."
  else
    info "Not running as root (expected for local macOS checks)."
  fi
fi

need_cmd bash
need_cmd git
need_cmd rsync
need_cmd node
need_cmd npm

if [[ "$(uname -s)" == "Linux" ]]; then
  need_cmd systemctl
else
  info "systemctl not required on $(uname -s) for local/dev checks"
fi

NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "[ERR] Node 20+ required. Found: $(node -v)"
  exit 1
fi
ok "Node version $(node -v)"

if [[ "$(uname -s)" == "Linux" ]]; then
  if systemctl list-unit-files | grep -q '^turtlebot.service'; then
    ok "Systemd unit detected: TurtleBot service (turtlebot.service)"
  else
    warn "TurtleBot service not installed yet (turtlebot.service)"
  fi
fi

ok "Preflight passed"
