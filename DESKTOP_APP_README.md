# Desktop Clipboard to Ollama Application

A powerful desktop application that integrates your macOS clipboard with Ollama AI models. Features both a basic and enhanced version with global hotkeys and browser extension support.

## 🚀 Features

### Basic App (`clipboard_ollama_app.py`)
- 📋 **Clipboard Integration**: Reads from macOS clipboard using `pbpaste`
- 🤖 **Ollama API**: Direct integration with your local Ollama server [[memory:8304284]]
- 📱 **User Interface**: Clean tkinter GUI with real-time updates
- 🔄 **Auto-monitoring**: Automatically detects clipboard changes
- 📊 **Model Selection**: Choose from available Ollama models
- 💬 **Chat Interface**: Send clipboard content as chat messages

### Enhanced App (`enhanced_clipboard_app.py`)
- ⌨️ **Global Hotkey**: Press `Cmd+Shift+O` to instantly process clipboard
- 🌐 **Domain Filtering**: Only process content from specified domains
- 📜 **History Tracking**: Keep track of all interactions
- 🎯 **Quick Process**: Popup modal for instant processing
- ⚙️ **Settings Management**: Comprehensive settings with tabs
- 🔗 **Browser Extension Ready**: API endpoints for browser integration

## 📋 Prerequisites

1. **Ollama installed and running**:
   ```bash
   # Install Ollama (if not already installed)
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Download a model (e.g., Gemma 3:1B)
   ollama pull gemma3:1b
   ```

2. **Python 3.7+** with required packages

## 🛠 Installation

1. **Install Python dependencies**:
   ```bash
   pip install -r app_requirements.txt
   ```

2. **Verify Ollama is running**:
   ```bash
   ollama serve
   ```
   (Your FastAPI server handles this automatically [[memory:8304284]])

## 🎯 Usage

### Basic Application
```bash
python clipboard_ollama_app.py
```

### Enhanced Application (Recommended)
```bash
python enhanced_clipboard_app.py
```

### Improved Application with Enhanced Logging
```bash
export TK_SILENCE_DEPRECATION=1 && python3 improved_clipboard_app.py
```

## 🎛 Application Interface

### Main Tab
- **Status Indicator**: Shows Ollama connection status
- **Model Selection**: Choose from available Ollama models
- **Clipboard Content**: View and edit clipboard content
- **Auto-monitor**: Toggle automatic clipboard monitoring
- **Quick Process**: Instant processing with popup
- **Response Area**: View Ollama responses

### Settings Tab (Enhanced App)
- **Global Hotkey**: Enable/disable `Cmd+Shift+O` hotkey
- **Domain Filtering**: Configure allowed domains
- **Auto-processing**: Control automatic text processing

### History Tab (Enhanced App)
- **Interaction Log**: Complete history of all conversations
- **Timestamps**: Track when interactions occurred
- **Search/Filter**: Find previous conversations

## ⌨️ Keyboard Shortcuts

### Global Hotkeys (Enhanced App)
- `Cmd+Shift+O`: Instantly process current clipboard content
- Works system-wide, even when app is in background

### In-App Shortcuts
- `Cmd+R`: Refresh clipboard content
- `Cmd+Enter`: Send to Ollama
- `Cmd+K`: Clear response area

## 🌐 Domain Filtering

Configure the app to only process clipboard content from specific domains:

1. Go to **Settings** tab
2. Add domains in the **Domain Filtering** section
3. Save domains to file for persistence
4. Leave empty to allow all domains

Example domains:
- `stackoverflow.com`
- `github.com`
- `docs.python.org`

## 🔧 Configuration

### Default Settings
```python
OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "gemma3:1b"
HOTKEY = "Cmd+Shift+O"
```

### Customization
- Edit the configuration variables at the top of the Python files
- Models are auto-detected from your Ollama installation
- Hotkey can be modified in the enhanced app settings

## 🐛 Troubleshooting

### Common Issues

1. **"Ollama server not available"**:
   - Ensure Ollama is running: `ollama serve`
   - Check if the correct URL is configured
   - Verify firewall settings

2. **"No models available"**:
   - Download a model: `ollama pull gemma3:1b`
   - Check `ollama list` to see installed models

3. **Hotkey not working**:
   - Check macOS accessibility permissions
   - Restart the application
   - Try a different hotkey combination

4. **Clipboard not updating**:
   - Ensure auto-monitor is enabled
   - Check macOS clipboard permissions
   - Try manual refresh

### macOS Permissions

The application may require permissions for:
- **Accessibility**: For global hotkeys
- **Input Monitoring**: For clipboard access
- **Automation**: For system integration

Grant these in **System Preferences > Security & Privacy > Privacy**

## 🔄 Integration with Browser Extension

The enhanced app includes API endpoints for browser extension integration:

1. **Install the browser extension** (see browser_extension folder)
2. **Start the enhanced desktop app**
3. **Configure allowed domains** in both app and extension
4. **Select text in browser** and use extension hotkeys

### Browser Extension Features
- Context menu integration
- Automatic text selection monitoring
- Domain-specific filtering
- Direct communication with desktop app

## 📊 Performance Tips

1. **Model Selection**: Use smaller models (like `gemma3:1b`) for faster responses
2. **Clipboard Monitoring**: Disable auto-monitor for better performance
3. **History Management**: Clear history periodically
4. **Domain Filtering**: Use specific domains to reduce processing overhead

## 🔐 Privacy & Security

- **Local Processing**: All AI processing happens locally via Ollama
- **No Data Transmission**: Clipboard content stays on your machine
- **Domain Filtering**: Control which websites can trigger processing
- **History Management**: All conversation history stored locally

## 📈 Future Enhancements

- [ ] Multiple AI model support simultaneously
- [ ] Custom prompt templates
- [ ] Export/import conversations
- [ ] Plugin system for custom processing
- [ ] Voice input integration
- [ ] OCR for image clipboard content
- [ ] Integration with other AI services

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

## 📄 License

This project is open source and available under the MIT License.
