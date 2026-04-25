# Release Notes

## [Unreleased]

### Fixed
- **exec**: Replace shell-based `child_process.exec` with `spawn({ shell:false })` to eliminate injection risk (PR fix/exec-spawn-hardening)
- **tui**: Escape blessed markup tags in log messages to prevent TUI corruption (PR fix/tui-logger-corruption)
- **telegram**: Fix stale comment; throws on network/API errors (PR fix/telegram-network-resilience)
- **config**: Add `ollama-cli` provider; allow `OLLAMA_RETRIES=0`; handle empty-string env vars (PR fix/config-validation)
- **model**: Full bidirectional Anthropic tool message conversion with `is_error` support (PR feat/anthropic-tool-support)
- **lint**: ESLint v9 flat config; fix `eqeqeq` violations (PR fix/ci-lint-setup)

## v0.2.1

- Added `/providers --verbose` with provider latency visibility
- Improved install-path quick chooser in README
- Refined README header branding and wordmark presentation

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
