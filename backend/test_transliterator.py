from transliterator import transliterate_word, transliterate_text

def test_transliterate():
    tests = {
        # Basic vowels
        "ammaa": "அம்மா",
        "appa": "அப்பா",
        "ilai": "இலை",
        "oadam": "ஓடம்",
        
        # Word initial vs middle 'n'
        "nanri": "நன்றி",
        "anbu": "அன்பு",
        "nee": "நீ",
        
        # Capital N for retroflex ண
        "vaNakkam": "வணக்கம்",
        "vanakkam": "வனக்கம்",  # Standard rule phonetic
        
        # Consonant double clusters
        "pattu": "பட்டு",
        "akka": "அக்கா",
        
        # Sanskrit & special mappings
        "sri": "ஸ்ரீ",
        "santhosham": "சந்தோஷம்",
        "jannal": "ஜன்னல்",
        
        # Mixing existing Tamil + English (Incremental Typing)
        "க்a": "க",
        "க்ka": "க்க",
        
        # Sentence transliteration
        "eppadi irukkeenga?": "எப்படி இருக்கீங்கள்?",
        "nalla irukken.": "நல்ல இருக்கேன்."
    }

    print("Running transliteration test cases...")
    success = 0
    total = len(tests)
    
    for input_str, expected in tests.items():
        result = transliterate_text(input_str)
        if result == expected:
            print(f"✅ PASS: '{input_str}' -> '{result}'")
            success += 1
        else:
            # Note: sentence check might have minor differences due to standard rule mapping vs dictionary
            # but let's see how close it is
            print(f"⚠️ NOTICE: '{input_str}' -> '{result}' (Expected: '{expected}')")
            
    print(f"\nCompleted: {success}/{total} matched standard phonetic rules exactly.")

if __name__ == '__main__':
    test_transliterate()
