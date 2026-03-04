const BASE = 'https://api.telegram.org';

export async function getUpdates(token, offset) {
  const url = `${BASE}/bot${token}/getUpdates?timeout=20${offset ? `&offset=${offset}` : ''}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result || [];
}

export async function sendMessage(token, chatId, text) {
  const url = `${BASE}/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
