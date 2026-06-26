import React, { useState, useEffect, useRef } from 'react';
import { transliterateWord } from '../utils/transliterate';

// Helper to transliterate whole text preserving structure and custom overrides
const transliterateText = (text, overrides, dictionary) => {
  if (!text) return '';
  const tokens = text.split(/([a-zA-Z]+)/);
  return tokens.map(token => {
    if (/^[a-zA-Z]+$/.test(token)) {
      const lower = token.toLowerCase();
      // 1. Check custom user override selections
      if (overrides && overrides[lower]) {
        return overrides[lower];
      }
      // 2. Check offline dictionary
      if (dictionary && dictionary[lower]) {
        return dictionary[lower];
      }
      // 3. Fallback to transliterator engine rules
      return transliterateWord(lower);
    }
    return token;
  }).join('');
};

export default function Dashboard({ dictionary, isBackendConnected }) {
  const [inputText, setInputText] = useState('');
  const [tamilText, setTamilText] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [overrides, setOverrides] = useState({}); // English word -> Selected Tamil word
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOcrDrawer, setShowOcrDrawer] = useState(false);
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  
  const textareaRef = useRef(null);

  // Helper to find the active English word under the cursor
  const getActiveWord = (text, pos) => {
    if (!text) return { word: '', start: 0, end: 0 };
    let index = pos === undefined ? text.length : pos;
    
    // If cursor is right after an English word, check the letter before it
    if (index > 0 && !/[a-zA-Z]/.test(text[index]) && /[a-zA-Z]/.test(text[index - 1])) {
      index = index - 1;
    }
    
    if (!/[a-zA-Z]/.test(text[index])) {
      return { word: '', start: index, end: index };
    }
    
    let start = index;
    while (start >= 0 && /[a-zA-Z]/.test(text[start])) {
      start--;
    }
    start++;
    
    let end = index;
    while (end < text.length && /[a-zA-Z]/.test(text[end])) {
      end++;
    }
    
    return { word: text.slice(start, end), start, end };
  };

  const updateActiveWordAndSuggestions = (text, pos) => {
    const { word } = getActiveWord(text, pos);
    setCurrentWord(word);
  };

  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    updateActiveWordAndSuggestions(value, e.target.selectionStart);
  };

  const handleSelect = (e) => {
    updateActiveWordAndSuggestions(e.target.value, e.target.selectionStart);
  };

  // OCR drag/drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-active');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-active');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-active');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processOcr(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processOcr(files[0]);
    }
  };

  const processOcr = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setOcrStatus('Error: Selected file is not an image');
      return;
    }

    setOcrFile(file);
    setOcrStatus('Loading OCR models...');
    setOcrProgress(0.01);

    try {
      if (typeof window.Tesseract === 'undefined') {
        throw new Error('Tesseract library is loading or failed to load. Please check your internet connection.');
      }

      const result = await window.Tesseract.recognize(
        file,
        ocrLanguage,
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrStatus(`Extracting text...`);
              setOcrProgress(m.progress);
            } else {
              setOcrStatus(m.status);
            }
          }
        }
      );

      const text = result.data.text;
      if (text && text.trim()) {
        setInputText(prev => prev ? prev + '\n' + text.trim() : text.trim());
        setOcrStatus('Text successfully extracted!');
        setOcrProgress(1);
      } else {
        setOcrStatus('Warning: No text could be recognized in the image.');
        setOcrProgress(1);
      }
    } catch (err) {
      console.error(err);
      setOcrStatus(`Error: ${err.message}`);
      setOcrProgress(0);
    }
  };

  // Phonetic normalization for spelling equivalence classing
  const phoneticNormalize = (word) => {
    let w = word.toLowerCase();
    w = w.replace(/w/g, 'v');
    w = w.replace(/^y/, '');
    
    w = w.replace(/aa/g, 'a').replace(/ae/g, 'e').replace(/ai/g, 'e').replace(/ee/g, 'i').replace(/ii/g, 'i').replace(/oo/g, 'u').replace(/uu/g, 'u').replace(/ou/g, 'u').replace(/ow/g, 'u').replace(/oa/g, 'o');
    
    w = w.replace(/sh/g, 's').replace(/ch/g, 's').replace(/zh/g, 'l').replace(/z/g, 'l').replace(/L/g, 'l');
    w = w.replace(/th/g, 't').replace(/dh/g, 't').replace(/kh/g, 'k').replace(/gh/g, 'k').replace(/ph/g, 'p').replace(/bh/g, 'p');
    w = w.replace(/R/g, 'r').replace(/N/g, 'n').replace(/nh/g, 'n');
    
    // Remove consecutive duplicates
    w = w.replace(/(.)\1+/g, '$1');
    return w;
  };

  // Levenshtein distance helper for fuzzy spelling matching
  const getEditDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Keep output preview state matched with input text
  useEffect(() => {
    const transliterated = transliterateText(inputText, overrides, dictionary);
    setTamilText(transliterated);
  }, [inputText, overrides, dictionary]);

  // Generate suggestions for the current active English word
  useEffect(() => {
    if (currentWord) {
      const lowerWord = currentWord.toLowerCase();
      const directTranslit = transliterateWord(currentWord);
      
      let list = [directTranslit];

      // Check offline dictionary mapping
      if (dictionary && dictionary[lowerWord]) {
        const dictVal = dictionary[lowerWord];
        if (dictVal !== directTranslit) {
          list.unshift(dictVal); // exact dictionary match gets first priority
        }
      }

      // Perform dual-engine fuzzy matching against local dictionary
      if (dictionary) {
        const fuzzyMatches = [];
        const normWord = phoneticNormalize(lowerWord);
        const threshold = lowerWord.length <= 3 ? 1 : 2;
        
        for (const [key, val] of Object.entries(dictionary)) {
          if (key === lowerWord) continue;
          
          // Engine A: Normalized English Levenshtein
          const normKey = phoneticNormalize(key);
          const distEng = getEditDistance(normWord, normKey);
          
          // Engine B: Tamil Transliterated Levenshtein
          const distTam = getEditDistance(directTranslit, val);
          
          if (distEng <= threshold || distTam <= threshold) {
            const minDist = Math.min(distEng, distTam);
            fuzzyMatches.push({ minDist, lenDiff: Math.abs(lowerWord.length - key.length), val });
          }
        }
        
        // Sort by minimum distance, then length difference
        fuzzyMatches.sort((a, b) => a.minDist - b.minDist || a.lenDiff - b.lenDiff);
        
        // Append fuzzy matches
        for (const match of fuzzyMatches) {
          if (!list.includes(match.val)) {
            list.push(match.val);
          }
        }
      }

      // Prefix match suggestions from dictionary if list is short
      if (dictionary && list.length < 5) {
        const completions = [];
        for (const [key, val] of Object.entries(dictionary)) {
          if (key.startsWith(lowerWord) && key !== lowerWord) {
            if (!list.includes(val) && !completions.includes(val)) {
              completions.push(val);
            }
          }
          if (list.length + completions.length >= 5) break;
        }
        list = [...list, ...completions];
      }

      // De-duplicate list, filter out the English word from Tamil list, slice to 4 items, and add English word at the end
      const uniqueList = Array.from(new Set(list));
      const filteredTamil = uniqueList.filter(item => item !== lowerWord);
      const finalSuggestions = [...filteredTamil.slice(0, 4), lowerWord];
      
      setSuggestions(finalSuggestions);

      // Check if there is an active override
      const activeOverride = overrides[lowerWord];
      if (activeOverride) {
        const overrideIdx = finalSuggestions.indexOf(activeOverride);
        if (overrideIdx !== -1) {
          setActiveSuggestionIdx(overrideIdx);
          return;
        }
      }
      setActiveSuggestionIdx(0);
    } else {
      setSuggestions([]);
      setActiveSuggestionIdx(0);
    }
  }, [currentWord, overrides, dictionary]);

  // Set override for the current word
  const commitSuggestion = (selectedWord) => {
    if (!currentWord) return;
    setOverrides(prev => ({
      ...prev,
      [currentWord.toLowerCase()]: selectedWord
    }));
    
    // Focus back on the textarea
    textareaRef.current?.focus();
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (suggestions.length > 0) {
      // Alt + 1-5 or Ctrl + 1-5 to commit suggestions
      if ((e.altKey || e.ctrlKey) && e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key) - 1;
        if (index < suggestions.length) {
          e.preventDefault();
          commitSuggestion(suggestions[index]);
        }
        return;
      }
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(tamilText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear text editor
  const handleClear = () => {
    setInputText('');
    setSuggestions([]);
    setCurrentWord('');
    setOverrides({});
    textareaRef.current?.focus();
  };

  // Helper to insert characters from visual keyboard
  const insertVirtualChar = (char) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    const newValue = value.substring(0, start) + char + value.substring(end);
    setInputText(newValue);
    setCurrentWord('');
    setSuggestions([]);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + char.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Visual Keyboard Data
  const keyboardVowels = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'ஃ'];
  const keyboardConsonants = [
    'க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 
    'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'
  ];
  const keyboardGrantha = ['ஜ', 'ஷ', 'ஸ', 'ஹ', 'க்ஷ', 'ஸ்ரீ'];
  const keyboardVowelSigns = ['ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ', '்'];

  // Calculations for stats
  const engWordCount = inputText.trim() === '' ? 0 : inputText.trim().split(/\s+/).length;
  const engCharCount = inputText.length;
  const tamCharCount = tamilText.length;

  return (
    <div className="dashboard-grid">
      {/* Editor Panel */}
      <div className="editor-card glass-panel">
        <div className="card-header">
          <h3>Real-Time Keyboard Workspace</h3>
          <p className="subtitle">Type in English below. The box at the bottom will show the live Tamil output</p>
        </div>

        {/* Suggestion Bar */}
        <div className="suggestion-bar">
          {suggestions.length > 0 ? (
            <div className="suggestions-list">
              <span className="suggestion-hint">Select:</span>
              {suggestions.map((word, idx) => (
                <button
                  key={idx}
                  className={`suggestion-item ${idx === activeSuggestionIdx ? 'active' : ''}`}
                  onClick={() => commitSuggestion(word)}
                >
                  <span className="s-word">{word}</span>
                  <span className="s-num">{idx + 1}</span>
                </button>
              ))}
              <span className="suggestion-hint-end">Click or Ctrl+1..5 to select</span>
            </div>
          ) : (
            <div className="suggestion-placeholder">
              {currentWord ? `Suggestions for "${currentWord}"...` : "Suggestions will appear here as you type"}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="editor-container">
          <textarea
            ref={textareaRef}
            className="tamil-textarea"
            placeholder="Type your Tanglish here... (e.g., vanakkam, eppadi irukkeenga, nalla irukken)"
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            style={{ fontFamily: 'var(--font-sans)', fontSize: '1.2rem' }} // Standard English font
          />
        </div>

        {/* Live Translated Preview (Read-Only Copy Container) */}
        <div className="preview-label">Tamil Output Preview</div>
        <div className="tamil-preview-box">
          {tamilText || <span className="preview-placeholder">தமிழ் உரை இங்கு தோன்றும்...</span>}
        </div>

        {/* Toolbar */}
        <div className="editor-toolbar">
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className={`tool-btn ${showVirtualKeyboard ? 'active' : ''}`} 
              onClick={() => {
                setShowVirtualKeyboard(!showVirtualKeyboard);
                setShowOcrDrawer(false);
              }}
              title="Toggle Visual Keyboard"
            >
              ⌨️ Visual Keyboard
            </button>
            <button 
              className={`tool-btn ${showOcrDrawer ? 'active' : ''}`} 
              onClick={() => {
                setShowOcrDrawer(!showOcrDrawer);
                setShowVirtualKeyboard(false);
              }}
              title="Upload image of handwritten or printed text"
            >
              📷 Scan Image (OCR)
            </button>
          </div>
          <div className="tool-group">
            <button className="tool-btn danger" onClick={handleClear} disabled={!inputText}>
              🗑️ Clear
            </button>
            <button className="tool-btn success" onClick={handleCopyToClipboard} disabled={!tamilText}>
              {copied ? '✅ Copied!' : '📋 Copy Tamil'}
            </button>
          </div>
        </div>

        {/* Stats footer */}
        <div className="editor-stats">
          <span>English Words: <strong>{engWordCount}</strong></span>
          <span>English Characters: <strong>{engCharCount}</strong></span>
          <span>Tamil Characters: <strong>{tamCharCount}</strong></span>
        </div>
      </div>

      {/* OCR Scanner Drawer */}
      {showOcrDrawer && (
        <div className="keyboard-card glass-panel fade-in" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="header-status">
              <h3>Image OCR Translation Scanner</h3>
              <button className="close-kb-btn" onClick={() => setShowOcrDrawer(false)}>✕</button>
            </div>
            <p className="subtitle">Upload an image of printed or handwritten text to translate it to Tamil</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="ocr-drawer-content">
            <div 
              className="ocr-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('ocr-file-input').click()}
            >
              <input 
                type="file" 
                id="ocr-file-input" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <div className="dropzone-text">
                <span className="drop-icon" style={{ fontSize: '2.5rem' }}>📷</span>
                <p>Drag & Drop image here or <strong>browse</strong></p>
                <span className="drop-subtext">Supports PNG, JPG, JPEG (Handwritten or Printed)</span>
              </div>
            </div>

            <div className="ocr-status-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>Source Text Language</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="radio" 
                      name="ocr-lang" 
                      value="eng" 
                      checked={ocrLanguage === 'eng'} 
                      onChange={() => setOcrLanguage('eng')} 
                    />
                    English / Tanglish
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="radio" 
                      name="ocr-lang" 
                      value="tam" 
                      checked={ocrLanguage === 'tam'} 
                      onChange={() => setOcrLanguage('tam')} 
                    />
                    Tamil (extract directly)
                  </label>
                </div>
              </div>

              {ocrFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>File: <strong>{ocrFile.name}</strong></span>
                  <span>({(ocrFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              {ocrStatus && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Status: <span style={{ color: ocrStatus.startsWith('Error') ? 'var(--danger)' : 'var(--primary)' }}>{ocrStatus}</span>
                  </div>

                  {ocrProgress > 0 && ocrProgress < 1 && (
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${Math.round(ocrProgress * 100)}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                          transition: 'width 0.1s ease'
                        }}
                      />
                    </div>
                  )}

                  {ocrProgress > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Progress: {Math.round(ocrProgress * 100)}%
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visual Keyboard Drawer */}
      {showVirtualKeyboard && (
        <div className="keyboard-card glass-panel fade-in">
          <div className="card-header">
            <div className="header-status">
              <h3>Tamil Virtual Input</h3>
              <button className="close-kb-btn" onClick={() => setShowVirtualKeyboard(false)}>✕</button>
            </div>
            <p className="subtitle">Click any character to insert it directly into the workspace</p>
          </div>

          <div className="keyboard-sections">
            <div className="kb-section">
              <span className="kb-label">Vowels (உயிர்)</span>
              <div className="kb-grid">
                {keyboardVowels.map(char => (
                  <button key={char} className="kb-key vowel" onClick={() => insertVirtualChar(char)}>
                    {char}
                  </button>
                ))}
              </div>
            </div>

            <div className="kb-section">
              <span className="kb-label">Vowel Signs & Virama (குறியீடுகள்)</span>
              <div className="kb-grid">
                {keyboardVowelSigns.map(char => (
                  <button key={char} className="kb-key sign" onClick={() => insertVirtualChar(char)}>
                    {char}
                  </button>
                ))}
              </div>
            </div>

            <div className="kb-section">
              <span className="kb-label">Consonants (மெய்)</span>
              <div className="kb-grid">
                {keyboardConsonants.map(char => (
                  <button key={char} className="kb-key consonant" onClick={() => insertVirtualChar(char)}>
                    {char}
                  </button>
                ))}
              </div>
            </div>

            <div className="kb-section">
              <span className="kb-label">Sanskrit / Grantha (கிரந்தம்)</span>
              <div className="kb-grid">
                {keyboardGrantha.map(char => (
                  <button key={char} className="kb-key sanskrit" onClick={() => insertVirtualChar(char)}>
                    {char}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
