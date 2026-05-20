// localStorage-backed history of generated drafts.
const KEY = 'signal.history.v1';

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDraft(entry) {
  const history = loadHistory();
  // Prepend; cap at 50 to keep storage bounded.
  const next = [entry, ...history].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function updateDraft(id, patch) {
  const history = loadHistory();
  const next = history.map((e) => (e.id === id ? { ...e, ...patch } : e));
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteDraft(id) {
  const next = loadHistory().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
