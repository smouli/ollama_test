# Ollama AI Writing Assistant

A collection of AI-powered writing tools using local Ollama LLM for text improvement and completion.

## 🚀 Quick Start

### Prerequisites
- **Ollama installed** on your system
- **Python 3.7+** (for desktop apps)
- **Chrome browser** (for Substack extension)

### 1. Start Ollama Server

```bash
# Start Ollama with CORS enabled (required for Chrome extension)
OLLAMA_ORIGINS="*" ollama serve
```

### 2. Install/Pull the Model

```bash
# Install the Gemma 3:1B model (recommended)
ollama pull gemma3:1b
```

## 📱 Applications

### Chrome Extension (Substack AI Writer)

**Location:** `substack_extension/`

**Features:**
- Automatically detects when you're writing on Substack (`/publish/post/` pages)
- Shows AI improvement overlay 0.5 seconds after text selection
- Completes incomplete sentences naturally
- Improves complete sentences for clarity and impact
- Smart dismissal system - won't re-show until new selection

**Installation:**
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `substack_extension/` folder
4. Make sure Ollama is running with CORS enabled

### Desktop Clipboard Apps

**Enhanced Clipboard App:**
```bash
export TK_SILENCE_DEPRECATION=1 && python3 enhanced_clipboard_app.py
```

**Improved Clipboard App:**
```bash
export TK_SILENCE_DEPRECATION=1 && python3 improved_clipboard_app.py
```

**Features:**
- Global hotkey: `Cmd+Shift+O` (enhanced version)
- Auto-monitors clipboard changes
- Domain filtering support
- Interaction history
- Enhanced logging and debugging

## 🔧 Configuration

### Ollama Setup

**Important:** Always start Ollama with CORS enabled for the Chrome extension:

```bash
# Required for Chrome extension to work
OLLAMA_ORIGINS="*" ollama serve

# Alternative: Set environment variable permanently
export OLLAMA_ORIGINS="*"
ollama serve
```

### Model Configuration

The apps use `gemma3:1b` by default, but you can change the model in:
- **Chrome extension:** Edit `model` property in `working_content.js`
- **Desktop apps:** Edit `default_model` property in the Python files

### Chrome Extension Settings

The extension only activates on Substack writing pages (`/publish/post/`). To modify:
- **Target pages:** Edit `matches` in `manifest.json`
- **System prompt:** Edit `systemPrompt` in `working_content.js` (lines 339-353)

## 🛠️ Troubleshooting

### Chrome Extension Issues

1. **CORS Errors:**
   ```bash
   # Kill any GUI Ollama instance
   sudo pkill -f "Ollama.app"
   
   # Start with CORS
   OLLAMA_ORIGINS="*" ollama serve
   ```

2. **Extension Not Loading:**
   - Reload extension in `chrome://extensions/`
   - Hard refresh Substack page (`Ctrl+Shift+R`)

3. **No AI Response:**
   - Check Ollama is running: `curl http://localhost:11434/api/tags`
   - Check console for errors (`F12` → Console)

### Desktop App Issues

1. **Python Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Ollama Connection:**
   ```bash
   # Test Ollama connection
   curl -X POST -H "Content-Type: application/json" \
     -d '{"model":"gemma3:1b","messages":[{"role":"user","content":"test"}],"stream":false}' \
     http://localhost:11434/api/chat
   ```

## 📝 Usage Examples

### Chrome Extension
1. Go to Substack writing page
2. Select text: `"the meeting was"`
3. Wait 0.5 seconds for overlay
4. Click "Apply" to use AI suggestion: `"the meeting was productive and well-organized"`

### Desktop App
1. Copy text to clipboard
2. Press `Cmd+Shift+O` (enhanced app)
3. AI processes and improves text
4. Paste improved version with `Cmd+V`

## 🎯 AI Behavior

### Text Completion Strategy
- **Incomplete sentences:** Preserves original text exactly, only adds completion
- **Complete sentences:** Minor improvements for clarity and flow
- **Natural tone:** Maintains professional, non-dramatic style
- **Length:** Maximum 1-2 sentences

### Example Transformations
```
Input:  "this man is eating"
Output: "this man is eating lunch at his desk"

Input:  "when I was thinking about"  
Output: "when I was thinking about this problem, I realized the solution"

Input:  "The meeting was good."
Output: "The meeting was productive and well-organized."
```

## 📂 Project Structure

```
ollama_test/
├── README.md                    # This file
├── enhanced_clipboard_app.py    # Advanced desktop app with hotkeys
├── improved_clipboard_app.py    # Enhanced desktop app with logging  
├── requirements.txt             # Python dependencies
├── logs/                       # Application logs
└── substack_extension/         # Chrome extension
    ├── manifest.json           # Extension configuration
    ├── working_content.js      # Main content script
    ├── popup.html/js/css      # Extension popup UI
    └── README.md              # Extension-specific docs
```

## 🤝 Contributing

1. Fork the repository
2. Make your changes
3. Test with local Ollama instance
4. Submit a pull request

## 📜 License

MIT License - feel free to modify and distribute.

---

**Need help?** Check the console logs (`F12` in Chrome) or terminal output for debugging information.
