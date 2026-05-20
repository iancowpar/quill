import { useState } from 'react';
import { scanSignals, anglesFromInputs } from '../api.js';

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

function ScanMode({ onResults, setLoading, setError, loading }) {
  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scanSignals();
      onResults(data.topics || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mode-panel">
      <p className="mode-desc">
        Search the web for what's actually being discussed across PM, AI adoption,
        and product leadership in the past seven days. Each topic comes back with
        a fit rating and angles in your voice.
      </p>
      <button className="btn-primary" onClick={run} disabled={loading}>
        {loading ? <><span className="spinner" />Scanning…</> : 'Scan for signals'}
      </button>
      {loading && (
        <p className="hint">
          Searching the web and matching trends to your frameworks. 20–40 seconds.
        </p>
      )}
    </div>
  );
}

function PasteMode({ onResults, setLoading, setError, loading }) {
  const [text, setText] = useState('');

  const run = async () => {
    const inputs = text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (inputs.length === 0) {
      setError('Add at least one topic, title, or URL.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await anglesFromInputs(inputs);
      onResults(data.topics || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mode-panel">
      <p className="mode-desc">
        Paste what you're already seeing in your feed — post titles, topics,
        or URLs. One per line. No web search; angles are generated from what
        you give it.
      </p>
      <textarea
        className="paste-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`The PM role is dying / changing\nhttps://www.linkedin.com/posts/...\nAI agents replacing junior engineers\nRTO mandates spiking again`}
        rows={8}
        disabled={loading}
      />
      <button className="btn-primary" onClick={run} disabled={loading}>
        {loading ? <><span className="spinner" />Generating…</> : 'Generate angles'}
      </button>
      {loading && (
        <p className="hint">
          Reading your inputs and proposing angles. About 10–20 seconds.
        </p>
      )}
    </div>
  );
}

export default function ScanScreen({ topics, setTopics, onDraft }) {
  const [mode, setMode] = useState('scan'); // 'scan' | 'paste'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div>
      <h1 className="h1">What's worth saying this week</h1>
      <p className="subtle">
        Two ways in. Auto-scan the web, or paste from what you're already seeing.
      </p>

      <div className="tabs">
        <button
          className={`tab ${mode === 'scan' ? 'active' : ''}`}
          onClick={() => { setMode('scan'); setError(null); }}
          disabled={loading}
        >
          Scan for signals
        </button>
        <button
          className={`tab ${mode === 'paste' ? 'active' : ''}`}
          onClick={() => { setMode('paste'); setError(null); }}
          disabled={loading}
        >
          Paste from my feed
        </button>
      </div>

      {mode === 'scan' ? (
        <ScanMode
          onResults={setTopics}
          setLoading={setLoading}
          setError={setError}
          loading={loading}
        />
      ) : (
        <PasteMode
          onResults={setTopics}
          setLoading={setLoading}
          setError={setError}
          loading={loading}
        />
      )}

      {error && <div className="error">{error}</div>}

      {topics.length > 0 && (
        <div className="topics">
          <div className="topics-label">Topics</div>
          {topics.map((t, i) => (
            <TopicCard key={i} topic={t} onDraft={onDraft} />
          ))}
        </div>
      )}

      {!loading && topics.length === 0 && !error && (
        <p className="empty">No results yet. Pick a mode above and go.</p>
      )}
    </div>
  );
}
