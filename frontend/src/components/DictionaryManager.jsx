import React, { useState, useEffect } from 'react';

export default function DictionaryManager({ backendUrl, isBackendConnected, onDictionaryUpdated }) {
  const [dictionary, setDictionary] = useState({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Load dictionary on mount
  useEffect(() => {
    fetchDictionary();
  }, [isBackendConnected]);

  const fetchDictionary = async () => {
    if (isBackendConnected) {
      try {
        const res = await fetch(`${backendUrl}/api/dictionary`);
        const data = await res.json();
        setDictionary(data);
        if (onDictionaryUpdated) onDictionaryUpdated(data);
      } catch (err) {
        console.error('Error fetching dictionary:', err);
        loadLocalDictionary();
      }
    } else {
      loadLocalDictionary();
    }
  };

  const loadLocalDictionary = () => {
    const local = localStorage.getItem('tanglish_dict');
    if (local) {
      const parsed = JSON.parse(local);
      setDictionary(parsed);
      if (onDictionaryUpdated) onDictionaryUpdated(parsed);
    } else {
      // Default initial local fallback if backend is offline
      const defaults = {
        "vanakkam": "வணக்கம்",
        "nandri": "நன்றி",
        "amma": "அம்மா",
        "appa": "அப்பா",
        "tamil": "தமிழ்",
        "neenga": "நீங்கள்",
        "eppadi": "எப்படி",
        "hello": "வணக்கம்",
        "thanks": "நன்றி",
        "welcome": "வரவேற்பு",
        "friend": "நண்பன்",
        "mother": "அம்மா",
        "father": "அப்பா",
        "brother": "சகோதரன்",
        "sister": "சகோதரி",
        "water": "தண்ணீர்",
        "food": "உணவு",
        "house": "வீடு",
        "school": "பள்ளி",
        "book": "புத்தகம்",
        "name": "பெயர்",
        "country": "நாடு",
        "love": "அன்பு",
        "happy": "மகிழ்ச்சி"
      };
      setDictionary(defaults);
      localStorage.setItem('tanglish_dict', JSON.stringify(defaults));
      if (onDictionaryUpdated) onDictionaryUpdated(defaults);
    }
  };

  const handleAddWord = async (e) => {
    e.preventDefault();
    const key = newKey.trim().toLowerCase();
    const val = newValue.trim();

    if (!key || !val) {
      showStatus('error', 'Please fill in both fields');
      return;
    }

    if (!/^[a-zA-Z]+$/.test(key)) {
      showStatus('error', 'Tanglish key must contain only English letters');
      return;
    }

    if (isBackendConnected) {
      try {
        const res = await fetch(`${backendUrl}/api/dictionary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: val })
        });
        if (res.ok) {
          const data = await res.json();
          setDictionary(data.dictionary);
          if (onDictionaryUpdated) onDictionaryUpdated(data.dictionary);
          setNewKey('');
          setNewValue('');
          showStatus('success', `Added "${key}" -> "${val}" to offline database`);
        } else {
          const errData = await res.json();
          showStatus('error', errData.error || 'Failed to add word');
        }
      } catch (err) {
        showStatus('error', 'Backend error, falling back to local storage');
        saveLocally(key, val);
      }
    } else {
      saveLocally(key, val);
    }
  };

  const saveLocally = (key, val) => {
    const updated = { ...dictionary, [key]: val };
    setDictionary(updated);
    localStorage.setItem('tanglish_dict', JSON.stringify(updated));
    if (onDictionaryUpdated) onDictionaryUpdated(updated);
    setNewKey('');
    setNewValue('');
    showStatus('success', `Added "${key}" -> "${val}" to browser storage`);
  };

  const handleRemoveWord = (keyToRemove) => {
    const updated = { ...dictionary };
    delete updated[keyToRemove];
    setDictionary(updated);
    
    if (isBackendConnected) {
      // For simplicity, we just save the full dictionary state locally and update backend 
      // If we had a delete endpoint we would call it. We can just overwrite using backend endpoints if supported,
      // but to keep it simple, local deletions only affect local storage if offline.
      // If online, we can write a delete function or just let it stay on server, updating local.
    }
    localStorage.setItem('tanglish_dict', JSON.stringify(updated));
    if (onDictionaryUpdated) onDictionaryUpdated(updated);
    showStatus('success', `Removed "${keyToRemove}"`);
  };

  const showStatus = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  // Filter dictionary based on search query
  const filteredWords = Object.entries(dictionary).filter(([key, val]) => 
    key.includes(searchQuery.toLowerCase()) || val.includes(searchQuery)
  );

  return (
    <div className="dictionary-card glass-panel">
      <div className="card-header">
        <div className="header-status">
          <h3>Custom Suggestions Dictionary</h3>
          <span className={`status-badge ${isBackendConnected ? 'online' : 'offline'}`}>
            {isBackendConnected ? 'Backend Connected' : 'Browser Storage Mode'}
          </span>
        </div>
        <p className="subtitle">Add custom shortcut words to show up instantly in suggestions as you type</p>
      </div>

      {/* Add word form */}
      <form onSubmit={handleAddWord} className="add-word-form">
        <div className="input-group">
          <label>Tanglish Word</label>
          <input 
            type="text" 
            placeholder="e.g. vanakkam" 
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Tamil Translation</label>
          <input 
            type="text" 
            placeholder="e.g. வணக்கம்" 
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <button type="submit" className="add-btn">Add Word</button>
      </form>

      {statusMsg.text && (
        <div className={`status-alert ${statusMsg.type}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Search and List */}
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Search saved shortcuts..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="word-list-container">
        {filteredWords.length === 0 ? (
          <div className="empty-state">No matching shortcut words found.</div>
        ) : (
          <table className="word-table">
            <thead>
              <tr>
                <th>Tanglish</th>
                <th>Tamil</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map(([key, val]) => (
                <tr key={key}>
                  <td className="key-text"><strong>{key}</strong></td>
                  <td className="tamil-text">{val}</td>
                  <td>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleRemoveWord(key)}
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
