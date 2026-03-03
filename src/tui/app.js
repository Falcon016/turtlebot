import blessed from 'blessed';
import { turtleTheme } from './theme.js';

export function createTui({ onSubmit, onCommand, getStatus }) {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'TurtleBot'
  });

  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let spinnerIndex = 0;
  let pending = false;
  let lastLatencyMs = null;
  let spinnerTimer = null;

  const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    style: { fg: turtleTheme.text, bg: turtleTheme.panel },
    content:
      ' 🐢 {bold}TurtleBot{/bold}  {#9bc3aa-fg}v0.2 beta{/}   {#57c784-fg}[TUI-FIRST]{/}\n {gray-fg}Ctrl+C quit • Ctrl+K clear • /help commands{/gray-fg}'
  });

  const status = blessed.box({
    top: 3,
    left: 0,
    width: '100%',
    height: 4,
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: turtleTheme.border }, bg: turtleTheme.bg, fg: turtleTheme.muted }
  });

  const log = blessed.log({
    top: 7,
    left: 0,
    width: '100%',
    bottom: 3,
    tags: true,
    border: { type: 'line' },
    label: ' chat ',
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true,
    style: {
      border: { fg: turtleTheme.border },
      bg: turtleTheme.bg,
      fg: turtleTheme.text
    }
  });

  const input = blessed.textbox({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    inputOnFocus: true,
    border: { type: 'line' },
    label: ' input ',
    style: {
      border: { fg: turtleTheme.border },
      bg: turtleTheme.panel,
      fg: turtleTheme.text
    }
  });

  screen.append(header);
  screen.append(status);
  screen.append(log);
  screen.append(input);

  function busyToken() {
    if (!pending) return '{#57c784-fg}● idle{/}';
    return `{#f4c95d-fg}${spinnerFrames[spinnerIndex]} thinking{/}`;
  }

  function latencyToken() {
    if (lastLatencyMs == null) return '{#9bc3aa-fg}latency=n/a{/}';
    return `{#9bc3aa-fg}latency=${lastLatencyMs}ms{/}`;
  }

  function refreshStatus() {
    const text = getStatus();
    const top = `${busyToken()}   ${latencyToken()}`;
    status.setContent(` ${top}\n ${text.replace(/\n/g, '\n ')}`);
  }

  function render() {
    refreshStatus();
    screen.render();
  }

  function say(role, text) {
    const color = role === 'you' ? turtleTheme.accent : turtleTheme.text;
    log.add(`{${color}-fg}${role}>{/${color}-fg} ${text}`);
    render();
  }

  function startSpinner() {
    pending = true;
    spinnerTimer = setInterval(() => {
      spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
      render();
    }, 90);
  }

  function stopSpinner(latencyMs) {
    pending = false;
    if (spinnerTimer) clearInterval(spinnerTimer);
    spinnerTimer = null;
    if (Number.isFinite(latencyMs)) lastLatencyMs = latencyMs;
    render();
  }

  input.on('submit', async (value) => {
    const text = (value || '').trim();
    input.clearValue();
    screen.render();
    if (!text) return;

    say('you', text);

    const started = Date.now();
    startSpinner();
    try {
      if (text.startsWith('/')) {
        const cmd = await onCommand(text);
        stopSpinner(Date.now() - started);
        say('bot', cmd);
      } else {
        const reply = await onSubmit(text);
        stopSpinner(Date.now() - started);
        say('bot', reply);
      }
    } catch (e) {
      stopSpinner(Date.now() - started);
      say('bot', `{red-fg}error:{/red-fg} ${e.message}`);
    }

    input.focus();
  });

  screen.key(['C-c'], () => process.exit(0));
  screen.key(['C-k'], () => {
    log.setContent('');
    render();
  });

  input.focus();
  render();
  say('bot', 'TUI ready. Type /help for commands.');
}
