import React, { useState } from 'react';

export default function KeyGuide() {
  const [activeTab, setActiveTab] = useState('vowels');

  const vowels = [
    { key: 'a', tamil: 'அ', example: 'amma -> அம்மா' },
    { key: 'aa / A', tamil: 'ஆ', example: 'aadu -> ஆடு' },
    { key: 'i', tamil: 'இ', example: 'ilai -> இலை' },
    { key: 'ii / ee / I', tamil: 'ஈ', example: 'eeti -> ஈட்டி' },
    { key: 'u', tamil: 'உ', example: 'udaan -> உடான்' },
    { key: 'uu / oo / U', tamil: 'ஊ', example: 'oonjal -> ஊஞ்சல்' },
    { key: 'e', tamil: 'எ', example: 'eli -> எலி' },
    { key: 'ee / E / ae', tamil: 'ஏ', example: 'yeani -> ஏணி' },
    { key: 'ai', tamil: 'ஐ', example: 'aivar -> ஐவர்' },
    { key: 'o', tamil: 'ஒ', example: 'onru -> ஒன்று' },
    { key: 'oo / O / oa', tamil: 'ஓ', example: 'oadam -> ஓடம்' },
    { key: 'au / ow / ou', tamil: 'ஔ', example: 'auvaiyar -> ஔவையார்' },
    { key: 'q', tamil: 'ஃ (Ayutham)', example: 'aqdhu -> அஃது' }
  ];

  const consonants = [
    { key: 'k / g', tamil: 'க', example: 'kal -> கல்' },
    { key: 'ng', tamil: 'ங', example: 'thangam -> தங்கம்' },
    { key: 'ch / c / s', tamil: 'ச', example: 'sattam -> சட்டம்' },
    { key: 'nj / gn', tamil: 'ஞ', example: 'gnanam -> ஞானம்' },
    { key: 't / d', tamil: 'ட', example: 'pattu -> பட்டு' },
    { key: 'N', tamil: 'ண', example: 'vaNakkam -> வணக்கம்' },
    { key: 'th / dh', tamil: 'த', example: 'thambi -> தம்பி' },
    { key: 'n (start of word)', tamil: 'ந', example: 'nanri -> நன்றி' },
    { key: 'n (middle of word)', tamil: 'ன', example: 'anbu -> அன்பு' },
    { key: 'nh', tamil: 'ந (explicit)', example: 'nhaNban -> நண்பன்' },
    { key: 'p / b', tamil: 'ப', example: 'palli -> பள்ளி' },
    { key: 'm', tamil: 'ம', example: 'maram -> மரம்' },
    { key: 'y', tamil: 'ய', example: 'yaar -> யார்' },
    { key: 'r', tamil: 'ர', example: 'ratham -> ரதம்' },
    { key: 'l', tamil: 'ல', example: 'laddu -> லட்டு' },
    { key: 'v / w', tamil: 'வ', example: 'vandi -> வண்டி' },
    { key: 'zh / z', tamil: 'ழ', example: 'thamizh -> தமிழ்' },
    { key: 'L', tamil: 'ள', example: 'palli -> பள்ளி' },
    { key: 'R', tamil: 'ற', example: 'kaatru (kaaRru) -> காற்று' }
  ];

  const sanskrit = [
    { key: 'j', tamil: 'ஜ', example: 'jannal -> ஜன்னல்' },
    { key: 'sh', tamil: 'ஷ', example: 'santhosham -> சந்தோஷம்' },
    { key: 'Sh', tamil: 'ஶ', example: 'Shiva -> ஶிவன்' },
    { key: 's / S', tamil: 'ஸ', example: 'saraswathi -> ஸரஸ்வதி' },
    { key: 'h / H', tamil: 'ஹ', example: 'hari -> ஹரி' },
    { key: 'ksh / x', tamil: 'க்ஷ', example: 'drakshai -> திராட்சை' },
    { key: 'sri / sree', tamil: 'ஸ்ரீ', example: 'sridevi -> ஸ்ரீதேவி' }
  ];

  const getTableData = () => {
    switch (activeTab) {
      case 'vowels': return vowels;
      case 'consonants': return consonants;
      case 'sanskrit': return sanskrit;
      default: return [];
    }
  };

  return (
    <div className="key-guide-card glass-panel">
      <div className="card-header">
        <h3>Phonetic Typing Guide</h3>
        <p className="subtitle">Learn how English keys combine to form Tamil characters</p>
      </div>

      <div className="tab-buttons">
        <button 
          className={`tab-btn ${activeTab === 'vowels' ? 'active' : ''}`}
          onClick={() => setActiveTab('vowels')}
        >
          Vowels
        </button>
        <button 
          className={`tab-btn ${activeTab === 'consonants' ? 'active' : ''}`}
          onClick={() => setActiveTab('consonants')}
        >
          Consonants
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sanskrit' ? 'active' : ''}`}
          onClick={() => setActiveTab('sanskrit')}
        >
          Sanskrit / Grantha
        </button>
      </div>

      <div className="table-container">
        <table className="guide-table">
          <thead>
            <tr>
              <th>English Key(s)</th>
              <th>Tamil Character</th>
              <th>Example Conversion</th>
            </tr>
          </thead>
          <tbody>
            {getTableData().map((item, idx) => (
              <tr key={idx}>
                <td className="key-cell"><code>{item.key}</code></td>
                <td className="tamil-cell">{item.tamil}</td>
                <td className="example-cell">{item.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="guide-tip">
        <span className="info-icon">💡</span>
        <p><strong>Pro Tip:</strong> Vowels typed after consonants automatically convert into vowel signs (e.g., <code>k</code> + <code>aa</code> = <code>கா</code>). Typing a consonant followed by another consonant retains the dot / pulli (e.g., <code>k</code> + <code>k</code> = <code>க்‌க</code>).</p>
      </div>
    </div>
  );
}
