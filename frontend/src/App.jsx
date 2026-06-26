import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import KeyGuide from './components/KeyGuide';
import DictionaryManager from './components/DictionaryManager';

const BACKEND_URL = 'http://127.0.0.1:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('workspace');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [dictionary, setDictionary] = useState({});

  // Poll backend health status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'running') {
            setIsBackendConnected(true);
            return;
          }
        }
        setIsBackendConnected(false);
      } catch (err) {
        setIsBackendConnected(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000); // check status every 10s
    return () => clearInterval(interval);
  }, []);

  const handleDictionaryUpdated = (updatedDict) => {
    setDictionary(updatedDict);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="title-gradient">Tanglish to Tamil</h1>
        <p className="subtitle">Real-time phonetic transliterator keyboard (runs offline)</p>
      </header>

      {/* Navigation Bar */}
      <nav className="app-nav">
        <button 
          className={`nav-btn ${activeTab === 'workspace' ? 'active' : ''}`}
          onClick={() => setActiveTab('workspace')}
        >
          ✍️ Type Workspace
        </button>
        <button 
          className={`nav-btn ${activeTab === 'dictionary' ? 'active' : ''}`}
          onClick={() => setActiveTab('dictionary')}
        >
          📖 Shortcut Dictionary
        </button>
        <button 
          className={`nav-btn ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          ℹ️ Typing Guide
        </button>
      </nav>

      {/* Main Content Areas */}
      <main className="app-main fade-in">
        {activeTab === 'workspace' && (
          <Dashboard 
            dictionary={dictionary} 
            isBackendConnected={isBackendConnected} 
          />
        )}
        
        {activeTab === 'dictionary' && (
          <DictionaryManager 
            backendUrl={BACKEND_URL}
            isBackendConnected={isBackendConnected}
            onDictionaryUpdated={handleDictionaryUpdated}
          />
        )}

        {activeTab === 'guide' && (
          <KeyGuide />
        )}
      </main>
    </div>
  );
}
