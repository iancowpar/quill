import { useEffect, useState } from 'react';
import ScanScreen from './screens/ScanScreen.jsx';
import DraftScreen from './screens/DraftScreen.jsx';
import HistoryScreen from './screens/HistoryScreen.jsx';
import { loadHistory } from './storage.js';

export default function App() {
  const [view, setView] = useState('scan'); // 'scan' | 'draft' | 'history'
  const [topics, setTopics] = useState([]);
  const [session, setSession] = useState(null); // { topic, angle, draft?, id? }
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const refreshHistory = () => setHistory(loadHistory());

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const startDraft = (topic, angle) => {
    setSession({ topic, angle });
    setView('draft');
  };

  const openFromHistory = (entry) => {
    setSession({ ...entry });
    setView('draft');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <div className="brand">Signal</div>
          <div className="tagline">your LinkedIn writing partner</div>
        </div>
        <button
          className={`nav-item ${view === 'scan' ? 'active' : ''}`}
          onClick={() => setView('scan')}
        >
          Scan
        </button>
        <button
          className={`nav-item ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          History {history.length > 0 && `(${history.length})`}
        </button>
      </aside>

      <main className="main">
        {view === 'scan' && (
          <ScanScreen topics={topics} setTopics={setTopics} onDraft={startDraft} />
        )}
        {view === 'draft' && session && (
          <DraftScreen
            session={session}
            onBack={() => setView('scan')}
            onSaved={refreshHistory}
            onToast={showToast}
          />
        )}
        {view === 'history' && (
          <HistoryScreen history={history} onOpen={openFromHistory} />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
