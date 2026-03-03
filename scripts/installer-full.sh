#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Falcon016/turtlebot.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/turtlebot-src}"
BRANCH="${BRANCH:-main}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/installer-full.sh"
  exit 1
fi

need() { command -v "$1" >/dev/null 2>&1; }

echo "[1/6] Installing base dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl rsync ca-certificates

if ! need node || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 20 ]]; then
  echo "[2/6] Installing Node 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "[2/6] Node present: $(node -v)"
fi

if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "[3/6] Updating source at $INSTALL_DIR"
  git -C "$INSTALL_DIR" fetch origin
  git -C "$INSTALL_DIR" checkout "$BRANCH"
  git -C "$INSTALL_DIR" pull --ff-only origin "$BRANCH"
else
  echo "[3/6] Cloning source to $INSTALL_DIR"
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

echo "[4/6] Running TurtleBot configure/install"
cd "$INSTALL_DIR"
[[ -f .env ]] || cp .env.example .env
bash scripts/install.sh

echo "[5/6] Running doctor"
bash scripts/doctor.sh || true

echo "[6/6] Done"
echo "Edit /opt/turtlebot/.env as needed, then: systemctl restart turtlebot.service"
