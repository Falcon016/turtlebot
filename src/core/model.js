const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function isThinkPrompt(text = '') {
  return /(reason|analy[sz]e|tradeoff|plan|architecture|debug)/i.test(text);
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

async function ollamaChat({ baseUrl, model, messages }) {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false })
  });

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

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const pickedModel = isThinkPrompt(lastUser) ? config.thinkModel : config.model;

  return ollamaChat({
    baseUrl: config.ollamaBaseUrl,
    model: pickedModel,
    messages
  });
}
