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

export async function providersStatus(config, state) {
  const [ollamaOk, openAiOk, anthropicOk] = await Promise.all([
    pingOllama(config.ollamaBaseUrl, 5000),
    pingOpenAI(config.openAiApiKey, 5000),
    pingAnthropic(config.anthropicApiKey, 5000)
  ]);

  const mark = (ok) => (ok ? '✓' : '✗');
  const current = state.provider;

  return [
    `provider status:`,
    `${current === 'ollama' ? '→' : ' '} ollama    ${mark(ollamaOk)}  configured=${Boolean(config.ollamaBaseUrl)}`,
    `${current === 'openai' ? '→' : ' '} openai    ${mark(openAiOk)}  configured=${Boolean(config.openAiApiKey)}`,
    `${current === 'anthropic' ? '→' : ' '} anthropic ${mark(anthropicOk)}  configured=${Boolean(config.anthropicApiKey)}`
  ].join('\n');
}
