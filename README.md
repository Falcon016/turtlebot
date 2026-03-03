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
- Keep model lightweight (e.g. mini models / local model proxy)
- Run with systemd (sample unit in `scripts/turtlebot.service`)

## Next steps

- Add local model routing (`ollama` first)
- Add command permissions/safeguards
- Add web UI from your turtle design (phase 2)
