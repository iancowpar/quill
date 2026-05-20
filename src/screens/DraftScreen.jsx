import { useEffect, useState } from 'react';
import { draftPost } from '../api.js';
import { saveDraft, updateDraft } from '../storage.js';

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function DraftScreen({ session, onBack, onSaved, onToast }) {
  const [draft, setDraft] = useState(session?.draft || '');
  const [loading, setLoading] = useState(!session?.draft);
  const [error, setError] = useState(null);
  const [entryId, setEntryId] = useState(session?.id || null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await draftPost(session.topic, session.angle);
      setDraft(data.draft);
      if (entryId) {
        updateDraft(entryId, { draft: data.draft, updatedAt: Date.now() });
        onSaved();
      } else {
        const id = `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        saveDraft({
          id,
          topic: session.topic,
          angle: session.angle,
          draft: data.draft,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setEntryId(id);
        onSaved();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate on mount when opened from a fresh angle (no draft yet).
  useEffect(() => {
    if (!session?.draft && session?.topic && session?.angle) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist user edits to localStorage on blur — quiet save, no toast.
  const handleBlur = () => {
    if (!entryId || !draft) return;
    updateDraft(entryId, { draft, updatedAt: Date.now() });
    onSaved();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      onToast('Copied to clipboard');
    } catch {
      onToast('Copy failed — select and copy manually');
    }
  };

  return (
    <div className="draft-screen">
      <button className="btn-link" onClick={onBack}>← Back to signals</button>
      <h1 className="h1" style={{ marginTop: 8 }}>{session.topic}</h1>
      <p className="draft-meta">Draft in your voice</p>

      <div className="draft-angle">{session.angle}</div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      <textarea
        className="draft-textarea"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        placeholder={loading ? 'Writing…' : 'Your draft will appear here.'}
        disabled={loading}
      />

      <div className="draft-actions">
        <button className="btn-primary" onClick={handleCopy} disabled={loading || !draft}>
          Copy to clipboard
        </button>
        <button className="btn-ghost" onClick={generate} disabled={loading}>
          {loading ? <><span className="spinner" />Working…</> : 'Regenerate'}
        </button>
        <span className="word-count">{wordCount(draft)} words</span>
      </div>
    </div>
  );
}
