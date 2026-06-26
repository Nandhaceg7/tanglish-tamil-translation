import re

VOWELS = {
    'aa': 'ஆ', 'ae': 'ஏ', 'ai': 'ஐ', 'aq': 'ஃ', 'au': 'ஔ',
    'ee': 'ஈ', 'ii': 'ஈ', 'oa': 'ஓ', 'oo': 'ஊ', 'ou': 'ஔ', 'ow': 'ஔ', 'uu': 'ஊ',
    'a': 'அ', 'e': 'எ', 'i': 'இ', 'o': 'ஒ', 'u': 'உ'
}

VOWEL_SIGNS = {
    'aa': 'ா', 'ae': 'ே', 'ai': 'ை', 'au': 'ௌ',
    'ee': 'ீ', 'ii': 'ீ', 'oa': 'ோ', 'oo': 'ூ', 'ou': 'ௌ', 'ow': 'ௌ', 'uu': 'ூ',
    'a': '', 'e': 'ெ', 'i': 'ி', 'o': 'ொ', 'u': 'ு'
}

CONSONANTS = {
    'ksh': 'க்ஷ்', 'shree': 'ஸ்ரீ', 'sree': 'ஸ்ரீ', 'sh': 'ஷ்',
    'sri': 'ஸ்ரீ', 'zh': 'ழ்', 'kh': 'க்', 'gh': 'க்',
    'ndh': 'ந்த்', 'nth': 'ந்த்', 'nd': 'ண்ட்', 'nj': 'ஞ்ச்', 'ng': 'ங்க்', 'nr': 'ன்ற்',
    'ch': 'ச்', 'gn': 'ஞ்', 'th': 'த்', 'dh': 'த்', 'nh': 'ந்', 'ph': 'ப்',
    'k': 'க்', 'g': 'க்', 'c': 'ச்', 'j': 'ஜ்', 't': 'ட்', 'd': 'ட்',
    'n': 'ந்', 'p': 'ப்', 'b': 'ப்', 'm': 'ம்', 'y': 'ய்', 'r': 'ர்',
    'l': 'ல்', 'v': 'வ்', 'w': 'வ்', 'z': 'ழ்', 's': 'ச்',
    'h': 'ஹ்', 'x': 'க்ஷ்'
}

CONSONANT_KEYS = sorted(CONSONANTS.keys(), key=len, reverse=True)
VOWEL_KEYS = sorted(VOWELS.keys(), key=len, reverse=True)

def transliterate_word(word):
    if not word:
        return ""
    word = word.lower()
    
    result = []
    i = 0
    n = len(word)
    prev_consonant_idx = -1
    
    while i < n:
        # Try to match consonant
        matched_consonant = None
        for key in CONSONANT_KEYS:
            if word.startswith(key, i):
                matched_consonant = key
                break
        
        # Try to match vowel
        matched_vowel = None
        for key in VOWEL_KEYS:
            if word.startswith(key, i):
                matched_vowel = key
                break
        
        # Handle word-initial vs word-middle 'n'
        if matched_consonant == 'n':
            is_start = (i == 0)
            tamil_val = 'ந்' if is_start else 'ன்'
            result.append(tamil_val)
            prev_consonant_idx = len(result) - 1
            i += 1
            continue

        # Choose the longer match to resolve ambiguities
        if matched_consonant and matched_vowel:
            if len(matched_consonant) >= len(matched_vowel):
                tamil_val = CONSONANTS[matched_consonant]
                result.append(tamil_val)
                prev_consonant_idx = len(result) - 1
                i += len(matched_consonant)
            else:
                v_key = matched_vowel
                if prev_consonant_idx != -1:
                    prev_char = result[prev_consonant_idx]
                    if prev_char.endswith('்'):
                        result[prev_consonant_idx] = prev_char[:-1]
                    v_sign = VOWEL_SIGNS.get(v_key, '')
                    result.append(v_sign)
                    prev_consonant_idx = -1
                else:
                    result.append(VOWELS[v_key])
                i += len(v_key)
        elif matched_consonant:
            tamil_val = CONSONANTS[matched_consonant]
            result.append(tamil_val)
            prev_consonant_idx = len(result) - 1
            i += len(matched_consonant)
        elif matched_vowel:
            v_key = matched_vowel
            if prev_consonant_idx != -1:
                prev_char = result[prev_consonant_idx]
                if prev_char.endswith('்'):
                    result[prev_consonant_idx] = prev_char[:-1]
                v_sign = VOWEL_SIGNS.get(v_key, '')
                result.append(v_sign)
                prev_consonant_idx = -1
            else:
                result.append(VOWELS[v_key])
            i += len(v_key)
        else:
            # Keep non-latin, punctuation, or existing Tamil characters
            char = word[i]
            result.append(char)
            if char == '்' or char.endswith('்'):
                prev_consonant_idx = len(result) - 1
            else:
                prev_consonant_idx = -1
            i += 1
            
    return "".join(result)

def transliterate_text(text):
    # Split by non-alphabetic boundaries to preserve formatting
    tokens = re.split(r'([a-zA-Z]+)', text)
    result = []
    for token in tokens:
        if token.isalpha():
            result.append(transliterate_word(token))
        else:
            result.append(token)
    return "".join(result)

# Simple CLI test
if __name__ == '__main__':
    test_words = [
        "vanakkam", "vaNakkam", "ammaa", "appa", "thamizh", "tamil", 
        "eppadi", "irukkeenga", "nanri", "neenga", "anbu"
    ]
    print("Transliteration Tests:")
    for tw in test_words:
        print(f"{tw:12} -> {transliterate_word(tw)}")
