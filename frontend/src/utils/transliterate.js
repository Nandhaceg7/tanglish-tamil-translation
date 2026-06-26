const VOWELS = {
  'aa': 'ஆ', 'ae': 'ஏ', 'ai': 'ஐ', 'aq': 'ஃ', 'au': 'ஔ',
  'ee': 'ஈ', 'ii': 'ஈ', 'oa': 'ஓ', 'oo': 'ஊ', 'ou': 'ஔ', 'ow': 'ஔ', 'uu': 'ஊ',
  'a': 'அ', 'e': 'எ', 'i': 'இ', 'o': 'ஒ', 'u': 'உ'
};

const VOWEL_SIGNS = {
  'aa': 'ா', 'ae': 'ே', 'ai': 'ை', 'au': 'ௌ',
  'ee': 'ீ', 'ii': 'ீ', 'oa': 'ோ', 'oo': 'ூ', 'ou': 'ௌ', 'ow': 'ௌ', 'uu': 'ூ',
  'a': '', 'e': 'ெ', 'i': 'ி', 'o': 'ொ', 'u': 'ு'
};

const CONSONANTS = {
  'ksh': 'க்ஷ்', 'shree': 'ஸ்ரீ', 'sree': 'ஸ்ரீ', 'sh': 'ஷ்',
  'sri': 'ஸ்ரீ', 'zh': 'ழ்', 'kh': 'க்', 'gh': 'க்',
  'ndh': 'ந்த்', 'nth': 'ந்த்', 'nd': 'ண்ட்', 'nj': 'ஞ்ச்', 'ng': 'ங்க்', 'nr': 'ன்ற்',
  'ch': 'ச்', 'gn': 'ஞ்', 'th': 'த்', 'dh': 'த்', 'nh': 'ந்', 'ph': 'ப்',
  'k': 'க்', 'g': 'க்', 'c': 'ச்', 'j': 'ஜ்', 't': 'ட்', 'd': 'ட்',
  'n': 'ந்', 'p': 'ப்', 'b': 'ப்', 'm': 'ம்', 'y': 'ய்', 'r': 'ர்',
  'l': 'ல்', 'v': 'வ்', 'w': 'வ்', 'z': 'ழ்', 's': 'ச்',
  'h': 'ஹ்', 'x': 'க்ஷ்'
};

const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);
const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length);

/**
 * Transliterates a single Tanglish word into Tamil.
 * @param {string} word - The English/Tanglish word
 * @returns {string} Tamil transliterated word
 */
export function transliterateWord(word) {
  if (!word) return '';
  word = word.toLowerCase();

  const result = [];
  let i = 0;
  const n = word.length;
  let prevConsonantIdx = -1;

  while (i < n) {
    let matchedConsonant = null;
    for (const key of CONSONANT_KEYS) {
      if (word.startsWith(key, i)) {
        matchedConsonant = key;
        break;
      }
    }

    let matchedVowel = null;
    for (const key of VOWEL_KEYS) {
      if (word.startsWith(key, i)) {
        matchedVowel = key;
        break;
      }
    }

    // Special case for 'n' mapping depending on word position
    if (matchedConsonant === 'n') {
      const isStart = (i === 0);
      const tamilVal = isStart ? 'ந்' : 'ன்';
      result.push(tamilVal);
      prevConsonantIdx = result.length - 1;
      i += 1;
      continue;
    }

    // Resolve longer match preference
    if (matchedConsonant && matchedVowel) {
      if (matchedConsonant.length >= matchedVowel.length) {
        result.push(CONSONANTS[matchedConsonant]);
        prevConsonantIdx = result.length - 1;
        i += matchedConsonant.length;
      } else {
        const vKey = matchedVowel;
        if (prevConsonantIdx !== -1) {
          const prevChar = result[prevConsonantIdx];
          if (prevChar.endsWith('்')) {
            result[prevConsonantIdx] = prevChar.slice(0, -1);
          }
          result.push(VOWEL_SIGNS[vKey] !== undefined ? VOWEL_SIGNS[vKey] : '');
          prevConsonantIdx = -1;
        } else {
          result.push(VOWELS[vKey]);
        }
        i += vKey.length;
      }
    } else if (matchedConsonant) {
      result.push(CONSONANTS[matchedConsonant]);
      prevConsonantIdx = result.length - 1;
      i += matchedConsonant.length;
    } else if (matchedVowel) {
      const vKey = matchedVowel;
      if (prevConsonantIdx !== -1) {
        const prevChar = result[prevConsonantIdx];
        if (prevChar.endsWith('்')) {
          result[prevConsonantIdx] = prevChar.slice(0, -1);
        }
        result.push(VOWEL_SIGNS[vKey] !== undefined ? VOWEL_SIGNS[vKey] : '');
        prevConsonantIdx = -1;
      } else {
        result.push(VOWELS[vKey]);
      }
      i += vKey.length;
    } else {
      // Keep punctuation, numbers, or existing Tamil characters
      const char = word[i];
      result.push(char);
      if (char === '்' || char.endsWith('்')) {
        prevConsonantIdx = result.length - 1;
      } else {
        prevConsonantIdx = -1;
      }
      i += 1;
    }
  }

  return result.join('');
}

/**
 * Transliterates a full sentence of Tanglish into Tamil, preserving structure.
 * @param {string} text - The input text
 * @returns {string} Tamil transliterated text
 */
export function transliterateText(text) {
  if (!text) return '';
  
  // Split by non-alphabetic characters to identify words
  const tokens = text.split(/([a-zA-Z]+)/);
  return tokens
    .map(token => {
      if (/^[a-zA-Z]+$/.test(token)) {
        return transliterateWord(token);
      }
      return token;
    })
    .join('');
}
