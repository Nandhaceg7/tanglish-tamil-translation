import os
import re
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from transliterator import transliterate_text, transliterate_word

app = Flask(__name__)
CORS(app)

DICTIONARY_PATH = os.path.join(os.path.dirname(__file__), 'dictionary.json')

def load_dictionary():
    if not os.path.exists(DICTIONARY_PATH):
        return {}
    try:
        with open(DICTIONARY_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading dictionary: {e}")
        return {}

def save_dictionary(dct):
    try:
        with open(DICTIONARY_PATH, 'w', encoding='utf-8') as f:
            json.dump(dct, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving dictionary: {e}")
        return False

custom_dict = load_dictionary()

@app.route('/api/transliterate', methods=['POST'])
def api_transliterate():
    data = request.json or {}
    text = data.get('text', '')
    if not text:
        return jsonify({'transliterated': ''})
    
    transliterated = transliterate_text(text)
    return jsonify({
        'original': text,
        'transliterated': transliterated
    })

def phonetic_normalize(word):
    word = word.lower()
    word = word.replace('w', 'v')
    
    # Drop initial y (e.g. yeppadi -> eppadi)
    word = re.sub(r'^y', '', word)
    
    # Normalizing vowel combinations
    word = word.replace('aa', 'a').replace('ae', 'e').replace('ai', 'e').replace('ee', 'i').replace('ii', 'i').replace('oo', 'u').replace('uu', 'u').replace('ou', 'u').replace('ow', 'u').replace('oa', 'o')
    
    # Consonant merges
    word = word.replace('sh', 's').replace('ch', 's').replace('zh', 'l').replace('z', 'l').replace('L', 'l')
    word = word.replace('th', 't').replace('dh', 't').replace('kh', 'k').replace('gh', 'k').replace('ph', 'p').replace('bh', 'p')
    word = word.replace('R', 'r')
    word = word.replace('N', 'n').replace('nh', 'n')
    
    # Collapse double chars
    word = re.sub(r'(.)\1+', r'\1', word)
    return word

def levenshtein_distance(s1, s2):
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
        
    return previous_row[-1]

@app.route('/api/suggestions', methods=['GET'])
def api_suggestions():
    word = request.args.get('word', '').strip().lower()
    if not word:
        return jsonify({'suggestions': []})
    
    direct_translit = transliterate_word(word)
    suggestions = [direct_translit]
    
    dict_match = custom_dict.get(word)
    if dict_match and dict_match not in suggestions:
        suggestions.insert(0, dict_match)
        
    fuzzy_matches = []
    norm_word = phonetic_normalize(word)
    threshold = 1 if len(word) <= 3 else 2
    
    for key, val in custom_dict.items():
        if key == word:
            continue
        
        # Dual-engine scoring (normalized english vs generated tamil)
        norm_key = phonetic_normalize(key)
        dist_eng = levenshtein_distance(norm_word, norm_key)
        dist_tam = levenshtein_distance(direct_translit, val)
        
        if dist_eng <= threshold or dist_tam <= threshold:
            min_dist = min(dist_eng, dist_tam)
            fuzzy_matches.append((min_dist, abs(len(word) - len(key)), val))
            
    # Sort by distance and length diff
    fuzzy_matches.sort(key=lambda x: (x[0], x[1]))
    
    for match in fuzzy_matches:
        val = match[2]
        if val not in suggestions:
            suggestions.append(val)
            
    # Fallback to prefix completions
    if len(suggestions) < 5:
        completions = []
        for key, val in custom_dict.items():
            if key.startswith(word) and key != word:
                if val not in suggestions and val not in completions:
                    completions.append(val)
                    if len(suggestions) + len(completions) >= 5:
                        break
        suggestions.extend(completions)
        
    # Unique candidates
    seen = set()
    deduped = [x for x in suggestions if not (x in seen or seen.add(x))]
    
    # Tamil suggestions capped at 4 + raw english input as last item
    filtered_tamil = [x for x in deduped if x != word]
    final_suggestions = filtered_tamil[:4]
    final_suggestions.append(word)
    
    return jsonify({'suggestions': final_suggestions})

@app.route('/api/dictionary', methods=['GET', 'POST'])
def api_dictionary():
    global custom_dict
    if request.method == 'POST':
        data = request.json or {}
        key = data.get('key', '').strip().lower()
        val = data.get('value', '').strip()
        
        if not key or not val:
            return jsonify({'error': 'Key and value required'}), 400
            
        custom_dict[key] = val
        if save_dictionary(custom_dict):
            return jsonify({'message': 'Added successfully', 'dictionary': custom_dict})
        else:
            return jsonify({'error': 'Failed to save'}), 500
            
    return jsonify(custom_dict)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'running', 'offline': True})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
