async function pingOllama(baseUrl, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(id);
  }
}

async function pingOpenAI(apiKey, timeoutMs = 5000) {
  if (!apiKey) return false;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(id);
  }
}

async function pingAnthropic(apiKey, timeoutMs = 5000) {
  if (!apiKey) return false;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      signal: controller.signal
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(id);
  }
}

async function timed(label, fn) {
  const started = Date.now();
  const ok = await fn();
  return { label, ok, latencyMs: Date.now() - started };
}

export async function providersStatus(config, state, { verbose = false } = {}) {
  const [ollama, openai, anthropic] = await Promise.all([
    timed('ollama', () => pingOllama(config.ollamaBaseUrl, 5000)),
    timed('openai', () => pingOpenAI(config.openAiApiKey, 5000)),
    timed('anthropic', () => pingAnthropic(config.anthropicApiKey, 5000))
  ]);

  const mark = (ok) => (ok ? '✓' : '✗');
  const current = state.provider;

  const line = (p, configured) => {
    const active = current === p.label ? '→' : ' ';
    const base = `${active} ${p.label.padEnd(9)} ${mark(p.ok)}  configured=${configured}`;
    if (!verbose) return base;
    return `${base}  latency=${p.latencyMs}ms`;
  };

  return [
    `provider status${verbose ? ' (verbose)' : ''}:`,
    line(ollama, Boolean(config.ollamaBaseUrl)),
    line(openai, Boolean(config.openAiApiKey)),
    line(anthropic, Boolean(config.anthropicApiKey))
  ].join('\n');
}
