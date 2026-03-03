# turtlebot (minimal scaffold)

A tiny, Pi-friendly assistant runtime inspired by OpenClaw ideas.

## v0 Scope

- Single-agent loop
- Optional Telegram polling adapter
- Small tool runtime (`read_file`, `write_file`, `exec`)
- Flat-file memory in `workspace/memory/`
- Ollama-first model routing (`qwen3:4b` + `lfm2.5-thinking`)
- Exec safety gates (dangerous command block + optional allowlist)
- No UI in first build

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

TUI keybinds:
- `Ctrl+C` quit
- `Ctrl+K` clear chat pane
- `/help` command list

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

## Installer scripts

```bash
# interactive env setup
bash scripts/configure.sh

# install as service on Raspberry Pi / Linux
sudo bash scripts/install.sh

# full installer (installs prerequisites + node + turtlebot service)
sudo bash scripts/installer-full.sh

# health checks
bash scripts/doctor.sh

# smoke test
bash scripts/smoke-test.sh

# remove service + app files
sudo bash scripts/uninstall.sh
```

By default, TurtleBot uses local Ollama on `http://127.0.0.1:11434`.
If you prefer OpenAI, set:

```env
MODEL_PROVIDER=openai
OPENAI_API_KEY=...
MODEL=openai/gpt-4.1-mini
```

## Telegram mode

1. Create a bot token with BotFather
2. Put `TELEGRAM_BOT_TOKEN` in `.env`
3. Start app and message your bot

## Raspberry Pi notes

- Works with Node 20+
- Keep model lightweight (e.g. `qwen3:4b` default)
- Deploy with:

```bash
sudo bash scripts/deploy-pi.sh
```

- Service file: `scripts/turtlebot.service`

## Exec safety modes

Configure in `.env`:

- `EXEC_POLICY=allowlist` (recommended)
- `EXEC_POLICY=confirm` (command must include `EXEC_CONFIRM_TOKEN`)
- `EXEC_POLICY=off` (disable exec)

## Branding assets

Included under `assets/branding/` for TUI and future docs:
- `turtlebot-mark.svg`
- `turtlebot-mascot.svg`
- `theme-tokens.json`

## Telegram/CLI commands

- `/help`
- `/status`
- `/model`
- `/mode ollama|openai`
- `/pin <note>`
- `/clear`

## Next steps

- Add your turtle UI as optional web dashboard
- Add role-based tool permissions
- Add end-to-end tests + release workflow
