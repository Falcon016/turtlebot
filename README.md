# TurtleBot

![Version](https://img.shields.io/badge/version-0.2.1-57c784)
![Runtime](https://img.shields.io/badge/runtime-Node%2020%2B-2f6b4f)
![License](https://img.shields.io/badge/license-MIT-9bc3aa)
![Mode](https://img.shields.io/badge/interface-TUI--first-57c784)

A lightweight, Raspberry Pi–friendly assistant runtime designed for terminal-first workflows.

<p align="center">
  <img src="assets/branding/turtlebot-mascot.svg" alt="TurtleBot mascot" width="176" />
  &nbsp;&nbsp;
  <img src="assets/branding/turtlebot-wordmark.svg" alt="TurtleBot wordmark" width="360" />
</p>

---

## Quick links

- [Quick start](#quick-start)
- [Terminal UI](#terminal-ui-recommended)
- [Bootstrap install](#bootstrap-curl)
- [Install path chooser](#install-path-chooser)
- [Model providers](#model-providers)
- [Commands](#telegramcli-commands)
- [Changelog](./CHANGELOG.md)

---

## Quick start

```bash
cd turtlebot
cp .env.example .env
npm install
npm run start
```

## Terminal UI (recommended)

```bash
npm run tui
```

Minimal mode (for small Pi terminals):

```bash
npm run tui:min
```

TUI keybinds:
- `Ctrl+C` quit
- `Ctrl+K` clear chat pane
- `/help` command list

---

## One-command quickstart (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Falcon016/turtlebot/main/scripts/quickstart.sh | bash
```

This will:
- clone/update TurtleBot
- install dependencies
- run interactive setup
- install/start service automation (macOS launchd or Linux systemd)

Optional (skip service install):

```bash
curl -fsSL https://raw.githubusercontent.com/Falcon016/turtlebot/main/scripts/quickstart.sh | QUICKSTART_NO_SERVICE=true bash
```

Optional (non-interactive, NOT default):

```bash
curl -fsSL https://raw.githubusercontent.com/Falcon016/turtlebot/main/scripts/quickstart.sh | \
  QUICKSTART_NONINTERACTIVE=true MODEL_PROVIDER=ollama QUICKSTART_NO_SERVICE=true bash
```

## Bootstrap (curl)

Quick path:

```bash
curl -fsSL https://raw.githubusercontent.com/Falcon016/turtlebot/main/scripts/bootstrap.sh | bash
```

Safer path (download + preview + confirm):

```bash
curl -fsSL https://raw.githubusercontent.com/Falcon016/turtlebot/main/scripts/bootstrap-safe.sh | bash
```

Optional env overrides:

```bash
curl -fsSL https://raw.githubusercontent.com/Falcon016/turtlebot/main/scripts/bootstrap.sh | \
  INSTALL_DIR=$HOME/my-turtlebot BRANCH=main bash
```

---

## Install path chooser

### macOS (launchd)

| Goal | Command |
|---|---|
| One-command quickstart | `curl -fsSL https://raw.githubusercontent.com/Falcon016/turtlebot/main/scripts/quickstart.sh \| bash` |
| Configure `.env` interactively | `bash scripts/setup-config.sh` |
| Install LaunchAgent service | `bash scripts/install-macos.sh` |
| Update + restart service | `bash scripts/update-macos.sh` |
| Service diagnostics | `bash scripts/doctor-macos.sh` |
| Uninstall LaunchAgent service | `bash scripts/uninstall-macos.sh` |

### Linux / Raspberry Pi (systemd)

| Goal | Command |
|---|---|
| Configure `.env` interactively | `bash scripts/setup-config.sh` |
| Preflight checks | `bash scripts/preflight.sh` |
| Install as system service | `sudo bash scripts/install.sh` |
| Update existing install (rollback on failure) | `sudo bash scripts/update.sh` (run from your latest repo checkout) |
| Full installer (deps + node + service) | `sudo bash scripts/install-full.sh` |
| Health check | `bash scripts/doctor.sh` |
| Self-test | `bash scripts/self-test.sh` |
| Uninstall | `sudo bash scripts/uninstall.sh` |

---

## Model providers

Default provider is local Ollama API (`http://127.0.0.1:11434`).

If you want local Ollama **without HTTP API**, use CLI mode:

```env
MODEL_PROVIDER=ollama-cli
MODEL=qwen3:4b
THINK_MODEL=qwen3:4b
```

### OpenAI

```env
MODEL_PROVIDER=openai
OPENAI_API_KEY=...
MODEL=gpt-4.1
THINK_MODEL=gpt-4.1
```

### Anthropic (Claude)

```env
MODEL_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
MODEL=claude-sonnet-4-5
THINK_MODEL=claude-opus-4-1
```

---

## Telegram mode

1. Create a bot token with BotFather
2. Put `TELEGRAM_BOT_TOKEN` in `.env`
3. Start app and message your bot

---

## Raspberry Pi notes

- Node 20+
- Lightweight dependency footprint
- TUI works in regular + minimal mode
- Systemd service unit: `scripts/turtlebot.service`
- Pi install helper:

```bash
sudo bash scripts/install-pi.sh
```

## macOS service notes

- Uses `launchd` via `~/Library/LaunchAgents/com.falcon016.turtlebot.plist`
- Logs are written to `workspace/logs/`
- Manage with:

```bash
bash scripts/install-macos.sh
bash scripts/update-macos.sh
bash scripts/doctor-macos.sh
bash scripts/uninstall-macos.sh
```

---

## Exec safety modes

Configure in `.env`:

- `EXEC_POLICY=allowlist` (recommended; command must exactly match an `EXEC_ALLOWLIST` entry)
- `EXEC_POLICY=confirm` (command must include `EXEC_CONFIRM_TOKEN`)
- `EXEC_POLICY=off` (disable exec)

---

## Branding assets

Included under `assets/branding/`:
- `turtlebot-mark.svg`
- `turtlebot-mascot.svg`
- `theme-tokens.json`

---

## Telegram/CLI commands

- `/help`
- `/status`
- `/model`
- `/providers`
- `/providers --verbose`
- `/mode ollama|ollama-cli|openai|anthropic`
- `/pin <note>`
- `/clear`
- `/quit` (or `/exit`)

---

## Roadmap

- `v0.2.x`: stability, provider ergonomics, richer TUI interactions
- `v0.3.x`: plugin permission profiles + advanced command palette
