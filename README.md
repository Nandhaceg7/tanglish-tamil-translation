# Tanglish-to-Tamil Real-Time Workspace

An offline-first, split-panel transliteration keyboard and text editor. This workspace allows users to type in Romanized Tamil (Tanglish) and view/edit the phonetically translated Tamil text in real-time.

---

## 1. Project Workflow & Data Flow

The application processes text in a split-editor structure (English input on top, Tamil preview on bottom) to guarantee smooth typing without cursor jumps:

### Step 1: Input & Cursor Tracking

- As the user types in the English Input Textarea, standard typing is preserved.
- The editor tracks cursor position changes (`onChange` and `onSelect` events) to determine the "active word" being typed or edited.

### Step 2: Lexical Tokenization

- The raw English input string is split using a regular expression (`/([a-zA-Z]+)/`) into word tokens and non-word tokens (spaces, punctuation, symbols, and newlines).
- This tokenization preserves the exact formatting, indentation, and structure of the user's text.

### Step 3: Transliteration Engine Routing

Each word token is passed through the transliteration pipeline:

1. **Custom Overrides Check**: If the user has selected a custom spelling suggestion for this specific word, the saved override is used.
2. **Dictionary Check**: If no override exists, the engine checks the offline vocabulary dictionary (`dictionary.json`) for exact matching shortcuts.
3. **Rules-Based Compiler**: If not found in overrides or dictionary, the phonetic transliteration rules compiler runs to generate the default phonetic representation.

_Note: All non-word tokens (spaces, symbols, newlines, and characters clicked on the Tamil virtual keyboard) bypass translation and are returned completely untouched._

### Step 4: Suggestion Generation

- For the active word under the cursor, the suggestions engine generates a list of candidates.
- It calculates matches using a **Dual-Engine Fuzzy Matcher**:
  - **Engine A**: Phonetic normalization (collapsing double characters and matching equivalent vowel/consonant shapes) followed by Levenshtein edit distance.
  - **Engine B**: Levenshtein edit distance on computed Tamil script strings.
- The top 4 Tamil candidates are displayed, with the raw English word placed at the 5th spot (allowing the user to bypass translation for that word).

### Step 5: Render Output

- The mapped tokens are joined back together and displayed instantly in the **Tamil Output Preview** pane.

---

## 2. Technology Stack

### Frontend Layer

- **React 19 & Vite**: Component-based UI and blazing-fast local development server.
- **Vanilla CSS3**: Dark mode UI utilizing custom properties, glassmorphism, responsive grids, and micro-animations.
- **LocalStorage**: Serves as a local fallback database for custom word shortcuts if the backend server is offline.
- **Tesseract.js**: WASM-powered client-side OCR library enabling offline printed/handwritten character recognition.

### Backend Layer

- **Python 3.10 & Flask**: Lightweight API serving suggestions and managing the dictionary database.
- **Flask-CORS**: Handles Cross-Origin Resource Sharing for communication between port 1010 (React) and port 5000 (Flask).

### Network & Exposing Layer

- **Localtunnel / Pinggy**: Secure SSH reverse-proxy tunnels to expose local port 1010 to a public HTTPS URL, allowing global network access (e.g. testing the typing workspace on mobile devices).

---

## 3. How to Run the Project

### Prerequisites

- Python 3.x
- Node.js (with npm)

### Step A: Run Flask Backend

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask application:
   ```bash
   python app.py
   ```
   _The backend will start running locally at `http://127.0.0.1:5000`._

### Step B: Run React Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:1010`.

---

## 4. Key Features

- **Split Editor Layout**: Keeps English input and Tamil output clean and readable side-by-side.
- **Image OCR Translation**: Scan printed or handwritten English/Tamil text from images (PNG/JPG) directly in the browser and translate it instantly.
- **Fuzzy Autocomplete**: Dual-engine matching identifies common typos and phonetically normalized variations.
- **Visual Keyboard**: A click-to-type virtual drawer for entering special Tamil characters manually.
- **Offline Reliability**: Full application features function in standard standalone mode using local browser storage if the Python backend is shut down.

## 5. Runnable link 
- https://tanglish-to-tamil.netlify.app/

- click and see the runnable output , i not host the backend , so local cache , dictionary doesn't work
