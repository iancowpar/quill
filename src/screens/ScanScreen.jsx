import { useState } from 'react';
import { scanSignals } from '../api.js';

function FitPill({ fit }) {
  const cls = fit === 'high' ? 'fit-high' : fit === 'medium' ? 'fit-medium' : 'fit-low';
  return <span className={`fit-pill ${cls}`}>{fit} fit</span>;
}

function TopicCard({ topic, onDraft }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="topic-card">
      <div className="topic-head" onClick={() => setOpen((v) => !v)}>
        <div>
          <p className="topic-title">{topic.title}</p>
          <p className="topic-summary">{topic.summary}</p>
        </div>
        <FitPill fit={topic.fit || 'low'} />
      </div>

      {open && (
        <div className="angles">
          {(topic.angles || []).map((angle, i) => (
            <div className="angle" key={i}>
              <p className="angle-text">{angle}</p>
              <button className="btn-ghost" onClick={() => onDraft(topic.title, angle)}>
                Draft this
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScanScreen({ topics, setTopics, onDraft }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scanSignals();
      setTopics(data.topics || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="h1">What's worth saying this week</h1>
      <p className="subtle">
        Scan finds what's actually being discussed across PM, AI adoption, and
        product leadership, then proposes angles in your voice.
      </p>

      <button className="btn-primary" onClick={handleScan} disabled={loading}>
        {loading ? <><span className="spinner" />Scanning…</> : 'Scan for signals'}
      </button>

      {loading && (
        <p className="scan-status">
          Searching the web and matching trends to your frameworks. This takes 20–40 seconds.
        </p>
      )}

      {error && <div className="error">{error}</div>}

      {topics.length > 0 && (
        <div className="topics">
          {topics.map((t, i) => (
            <TopicCard key={i} topic={t} onDraft={onDraft} />
          ))}
        </div>
      )}

      {!loading && topics.length === 0 && !error && (
        <p className="empty">No scan yet. Hit the button when you're ready.</p>
      )}
    </div>
  );
}
