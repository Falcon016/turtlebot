# Contributing to TurtleBot

## Dev setup

```bash
cp .env.example .env
npm install
npm run start
```

## Ground rules

- Keep dependencies minimal.
- Prefer small modules over framework-heavy code.
- Keep Raspberry Pi compatibility in mind (CPU, RAM, disk).
- Add/adjust docs when behavior changes.

## Pull request checklist

- [ ] Code runs locally (`npm run start`)
- [ ] Basic syntax check passes (`npm run check`)
- [ ] README updated for user-facing changes
- [ ] No secrets committed
