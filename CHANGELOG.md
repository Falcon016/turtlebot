# Release Notes

## v0.2.0

- Polished terminal-first TUI with regular + minimal modes
- Added provider routing for Ollama, OpenAI, and Anthropic (Claude)
- Added `/providers` command for backend health visibility
- Added installer suite:
  - `bootstrap.sh` + `bootstrap-safe.sh`
  - `install.sh`, `update.sh` (rollback support), `uninstall.sh`
  - `setup-config.sh`, `preflight.sh`, `doctor.sh`, `self-test.sh`
- Added Pi-focused deployment flow and hardened preflight behavior
- Added branding assets for turtle-themed identity

## v0.1.0

- Initial minimal scaffold
- CLI runtime + optional Telegram mode
- Flat-file memory and lightweight tools
- Ollama-first model routing
- Exec safety gates (allowlist + dangerous command blocking)
