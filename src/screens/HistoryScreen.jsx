function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function firstLine(text) {
  if (!text) return '';
  const line = text.split('\n').find((l) => l.trim());
  return line ? line.trim() : '';
}

export default function HistoryScreen({ history, onOpen }) {
  return (
    <div>
      <h1 className="h1">History</h1>
      <p className="subtle">Drafts you've generated, most recent first.</p>

      {history.length === 0 ? (
        <p className="empty">No drafts yet. Generate one from the Scan screen.</p>
      ) : (
        <div className="history-list">
          {history.map((entry) => (
            <button key={entry.id} className="history-item" onClick={() => onOpen(entry)}>
              <p className="history-topic">{entry.topic}</p>
              <p className="history-preview">{firstLine(entry.draft)}</p>
              <p className="history-date">{formatDate(entry.updatedAt || entry.createdAt)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
