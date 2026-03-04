import blessed from 'blessed';
import { turtleTheme } from './theme.js';

export function createTui({ onSubmit, onCommand, getStatus, minimal = false }) {
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
      ' 🐢 {bold}TurtleBot{/bold}  {#9bc3aa-fg}v0.2 beta{/}   {#57c784-fg}[TUI-FIRST]{/}   🐢\n {gray-fg}Ctrl+C quit • Ctrl+K clear • /help commands{/gray-fg}'
  });

  const sidebarWidth = minimal ? 0 : 30;

  const sidebar = blessed.box({
    top: 3,
    left: 0,
    width: sidebarWidth,
    bottom: 3,
    tags: true,
    border: { type: 'line' },
    label: ' overview ',
    hidden: minimal,
    style: {
      border: { fg: turtleTheme.border },
      bg: turtleTheme.panel,
      fg: turtleTheme.text
    }
  });

  const statusCard = blessed.box({
    parent: sidebar,
    top: 0,
    left: 0,
    width: '100%-2',
    height: 9,
    tags: true,
    content: ''
  });

  const quickHelp = blessed.box({
    parent: sidebar,
    top: 9,
    left: 0,
    width: '100%-2',
    height: '100%-11',
    tags: true,
    content:
      '{#57c784-fg}{bold}tiny turtles{/bold}{/}\n' +
      '  𓆉  shell mode\n' +
      '  🐢  chat mode\n\n' +
      '{#57c784-fg}{bold}shortcuts{/bold}{/}\n' +
      ' • /help\n • /status\n • /model\n • /providers\n • /mode ollama|openai|anthropic\n • /pin <note>\n • /clear'
  });

  const chat = blessed.log({
    top: 3,
    left: sidebarWidth,
    width: `100%-${sidebarWidth}`, 
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
  screen.append(sidebar);
  screen.append(chat);
  screen.append(input);

  function busyToken() {
    if (!pending) return '{#57c784-fg}● idle{/}';
    return `{#f4c95d-fg}${spinnerFrames[spinnerIndex]} thinking{/}`;
  }

  function latencyToken() {
    if (lastLatencyMs == null) return '{#9bc3aa-fg}latency=n/a{/}';
    return `{#9bc3aa-fg}latency=${lastLatencyMs}ms{/}`;
  }

  function renderOverview() {
    const statusText = getStatus().split('\n').join('\n ');
    if (!minimal) {
      statusCard.setContent(
        '{#57c784-fg}{bold}runtime{/bold}{/}\n' +
          ` ${busyToken()}\n` +
          ` ${latencyToken()}\n\n` +
          ` ${statusText}\n\n` +
          '{#57c784-fg}{bold}release{/bold}{/}\n' +
          ' v0.2.0-beta\n' +
          ' tui-only\n' +
          ' pi-friendly'
      );
      chat.setLabel(' chat ');
    } else {
      chat.setLabel(` chat  ${busyToken()}  ${latencyToken()} `);
    }
  }

  function render() {
    renderOverview();
    screen.render();
  }

  function say(role, text) {
    const color = role === 'you' ? turtleTheme.accent : turtleTheme.text;
    chat.add(`{${color}-fg}${role}>{/${color}-fg} ${text}`);
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

        if (text.trim() === '/clear') {
          chat.setContent('');
          render();
          say('bot', 'Chat cleared.');
        } else {
          say('bot', cmd);
        }
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

  const quit = () => {
    try {
      screen.destroy();
    } catch {}
    process.exit(0);
  };

  screen.key(['C-c'], quit);
  process.on('SIGINT', quit);
  screen.key(['C-k'], () => {
    chat.setContent('');
    render();
  });

  input.focus();
  render();
  say('bot', minimal ? 'Minimal TUI ready. Type /help for commands.' : 'TUI ready. Type /help for commands.');
}
