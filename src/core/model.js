const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function isThinkPrompt(text = '') {
  return /(reason|analy[sz]e|tradeoff|plan|architecture|debug)/i.test(text);
}

async function fetchWithTimeout(url, options, timeoutMs = 45000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function openAiChat({ apiKey, model, messages, tools = [] }) {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, tools, temperature: 0.2 })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function ollamaHealth(baseUrl, timeoutMs) {
  const res = await fetchWithTimeout(`${baseUrl}/api/tags`, { method: 'GET' }, Math.min(timeoutMs, 8000));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama health failed ${res.status}: ${text}`);
  }
}

async function ollamaChat({ baseUrl, model, messages, timeoutMs, retries = 1 }) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetchWithTimeout(
        `${baseUrl}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages, stream: false })
        },
        timeoutMs
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama API error ${res.status}: ${text}`);
      }
      const data = await res.json();

      return {
        choices: [
          {
            message: {
              role: 'assistant',
              content: data.message?.content || ''
            }
          }
        ]
      };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  throw new Error(`Ollama request failed after retries: ${lastErr?.message || 'unknown error'}`);
}

export async function chatCompletion({ config, messages, tools = [] }) {
  if (config.modelProvider === 'openai') {
    return openAiChat({
      apiKey: config.openAiApiKey,
      model: config.model,
      messages,
      tools
    });
  }

  await ollamaHealth(config.ollamaBaseUrl, config.ollamaTimeoutMs);

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const pickedModel = isThinkPrompt(lastUser) ? config.thinkModel : config.model;

  return ollamaChat({
    baseUrl: config.ollamaBaseUrl,
    model: pickedModel,
    messages,
    timeoutMs: config.ollamaTimeoutMs,
    retries: config.ollamaRetries
  });
}
