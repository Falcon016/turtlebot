#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Falcon016/turtlebot.git}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/turtlebot}"
BRANCH="${BRANCH:-main}"

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1"; exit 1; }; }
need_cmd git
need_cmd bash

if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "Existing repo found at $INSTALL_DIR. Pulling latest..."
  git -C "$INSTALL_DIR" fetch origin
  git -C "$INSTALL_DIR" checkout "$BRANCH"
  git -C "$INSTALL_DIR" pull --ff-only origin "$BRANCH"
else
  echo "Cloning TurtleBot into $INSTALL_DIR ..."
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from template."
fi

echo "Run these next:"
echo "  cd $INSTALL_DIR"
echo "  bash scripts/setup-config.sh"
echo "  sudo bash scripts/install.sh"
echo "  bash scripts/doctor.sh"
