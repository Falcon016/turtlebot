const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

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

/**
 * Convert OpenAI-format history messages to Anthropic format before sending.
 * Handles tool results (role:'tool') and assistant tool_calls arrays.
 */
export function toAnthropicMessages(messages) {
  const result = [];
  for (const msg of messages) {
    if (msg.role === 'tool') {
      // Convert OpenAI tool result → Anthropic tool_result block
      // Must be attached to a user message
      const last = result[result.length - 1];
      const toolResultBlock = {
        type: 'tool_result',
        tool_use_id: msg.tool_call_id,
        content: msg.content ?? '',
        ...(msg.is_error ? { is_error: true } : {}),
      };
      if (last && last.role === 'user' && Array.isArray(last.content)) {
        last.content.push(toolResultBlock);
      } else {
        result.push({ role: 'user', content: [toolResultBlock] });
      }
    } else if (msg.role === 'assistant' && msg.tool_calls?.length) {
      // Convert OpenAI tool_calls → Anthropic tool_use blocks
      const content = [];
      if (msg.content) content.push({ type: 'text', text: msg.content });
      for (const tc of msg.tool_calls) {
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: (() => { try { return JSON.parse(tc.function.arguments); } catch { return {}; } })(),
        });
      }
      result.push({ role: 'assistant', content });
    } else {
      result.push({ role: msg.role, content: msg.content });
    }
  }
  return result;
}

/**
 * Convert the shared OpenAI-style tool definitions to Anthropic's tool format.
 * Anthropic uses { name, description, input_schema } instead of
 * { type, function: { name, description, parameters } }.
 */
function toAnthropicTools(tools = []) {
  return tools
    .filter((t) => t.type === 'function' && t.function)
    .map((t) => ({
      name: t.function.name,
      description: t.function.description || '',
      input_schema: t.function.parameters || { type: 'object', properties: {} }
    }));
}

/**
 * Normalise an Anthropic response into the OpenAI-style shape the rest of the
 * codebase expects: { choices: [{ message: { role, content, tool_calls? } }] }
 */
function normaliseAnthropicResponse(data) {
  const textBlocks = (data.content || []).filter((b) => b.type === 'text');
  const toolBlocks = (data.content || []).filter((b) => b.type === 'tool_use');

  const textContent = textBlocks.map((b) => b.text).join('\n').trim();
  // content is null only when BOTH text and tool blocks are absent
  const content = textContent !== '' ? textContent : null;

  const tool_calls = toolBlocks.length
    ? toolBlocks.map((b) => ({
        id: b.id,
        type: 'function',
        function: {
          name: b.name,
          // Anthropic returns a parsed object; serialise back to string to
          // match what agent.js expects (it calls JSON.parse on this field).
          arguments: JSON.stringify(b.input ?? {})
        }
      }))
    : undefined;

  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content,
          ...(tool_calls ? { tool_calls } : {})
        }
      }
    ]
  };
}

async function openAiChat({ apiKey, model, messages, tools = [], timeoutMs = 45000 }) {
  const body = { model, messages, temperature: 0.2 };
  if (tools.length) body.tools = tools;

  const res = await fetchWithTimeout(
    OPENAI_API_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    },
    timeoutMs
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function anthropicChat({ apiKey, model, messages, tools = [], timeoutMs }) {
  const system = messages.find((m) => m.role === 'system')?.content || 'You are TurtleBot: concise, safe, practical.';
  const anthropicMessages = toAnthropicMessages(messages.filter((m) => m.role !== 'system'));

  const anthropicTools = toAnthropicTools(tools);

  const body = {
    model,
    max_tokens: 900,
    temperature: 0.2,
    system,
    messages: anthropicMessages
  };
  if (anthropicTools.length) body.tools = anthropicTools;

  const res = await fetchWithTimeout(
    ANTHROPIC_API_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    },
    timeoutMs
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return normaliseAnthropicResponse(data);
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
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const pickedModel = isThinkPrompt(lastUser) ? config.thinkModel : config.model;

  if (config.modelProvider === 'openai') {
    return openAiChat({
      apiKey: config.openAiApiKey,
      model: pickedModel,
      messages,
      tools,
      timeoutMs: config.ollamaTimeoutMs
    });
  }

  if (config.modelProvider === 'anthropic') {
    return anthropicChat({
      apiKey: config.anthropicApiKey,
      model: pickedModel,
      messages,
      tools,
      timeoutMs: config.ollamaTimeoutMs
    });
  }

  await ollamaHealth(config.ollamaBaseUrl, config.ollamaTimeoutMs);
  return ollamaChat({
    baseUrl: config.ollamaBaseUrl,
    model: pickedModel,
    messages,
    timeoutMs: config.ollamaTimeoutMs,
    retries: config.ollamaRetries
  });
}
