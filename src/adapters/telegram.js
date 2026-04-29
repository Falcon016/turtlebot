const BASE = 'https://api.telegram.org';
const DEFAULT_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Long-poll Telegram for new updates.
 * Throws on network/API errors so the caller can log and apply backoff.
 */
export async function getUpdates(token, offset) {
  const url = `${BASE}/bot${token}/getUpdates?timeout=20${offset ? `&offset=${offset}` : ''}`;
  try {
    const res = await fetchWithTimeout(url, {}, 30_000);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Telegram getUpdates ${res.status}: ${text}`);
    }
    const data = await res.json();
    return data.result || [];
  } catch (err) {
    // Re-throw so the caller's error handler can log and apply backoff.
    throw err;
  }
}

/**
 * Send a message to a Telegram chat.
 * Throws on network failure or non-2xx response so callers know the
 * message was not delivered.
 */
export async function sendMessage(token, chatId, text) {
  const url = `${BASE}/bot${token}/sendMessage`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    },
    15_000
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram sendMessage ${res.status}: ${body}`);
  }

  return res.json();
}
