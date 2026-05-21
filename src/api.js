// Thin wrappers around the Express backend. Vite proxies /api to localhost:3001.

async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const scanSignals = () => postJson('/api/scan', {});
export const anglesFromInputs = (inputs) => postJson('/api/angles', { inputs });
export const draftPost = (topic, angle, anchor) =>
  postJson('/api/draft', { topic, angle, anchor: anchor || '' });
