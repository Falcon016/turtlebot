#!/usr/bin/env bash
set -euo pipefail

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "[ERR] Missing command: $1"; return 1; }; }
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }

if [[ "${EUID}" -ne 0 ]]; then
  warn "Not running as root. Install/update scripts require sudo."
fi

need_cmd bash
need_cmd git
need_cmd rsync
need_cmd node
need_cmd npm
need_cmd systemctl

NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "[ERR] Node 20+ required. Found: $(node -v)"
  exit 1
fi
ok "Node version $(node -v)"

if systemctl list-unit-files | grep -q '^turtlebot.service'; then
  ok "systemd unit turtlebot.service detected"
else
  warn "turtlebot.service not installed yet"
fi

ok "Preflight passed"
