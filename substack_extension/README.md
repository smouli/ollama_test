# 🤖 Substack AI Writer - Chrome Extension

A sleek Chrome extension that integrates AI writing assistance directly into Substack's editor using your local Ollama installation.

## ✨ Features

### 🎯 **Smart Integration**
- **Auto-detects Substack editors** - Works on any Substack site
- **Floating AI button** - Appears when you're writing
- **Text selection support** - Improve selected text or entire posts
- **Non-intrusive** - Seamlessly blends with Substack's UI

### 🚀 **AI-Powered Actions**
- **✨ Improve Writing** - Enhance clarity, engagement, and flow
- **📝 Summarize** - Create concise summaries of your content
- **🔍 Expand Ideas** - Add details, examples, and explanations
- **🎭 Change Tone** - Adjust for newsletter-appropriate voice
- **🎯 Custom Instructions** - Apply your own prompts

### ⚙️ **Advanced Settings**
- **Model Selection** - Choose from your installed Ollama models
- **Creativity Control** - Adjust temperature for more/less creative output
- **Word Limits** - Control response length
- **Auto-Replace** - Automatically replace selected text
- **Custom Prompts** - Save your frequently used instructions

## 🔧 Installation

### Prerequisites
1. **Ollama installed and running**:
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Download a model (e.g., Gemma 3 1B)
   ollama pull gemma3:1b
   
   # Start Ollama server
   ollama serve
   ```

2. **Chrome browser** (version 88 or higher)

### Install Extension

1. **Download/Clone** this extension folder
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right)
4. **Click "Load unpacked"** and select the extension folder
5. **Pin the extension** to your toolbar for easy access

## 🎮 How to Use

### Quick Start
1. **Navigate to any Substack site** where you can write (compose, edit, comment)
2. **Look for the floating 🤖 button** that appears near text areas
3. **Click the AI button** or use the extension popup
4. **Select text** (optional) and choose an AI action
5. **Review and apply** the AI-generated improvements

### Detailed Workflow

#### 1. **Writing Mode**
- Open any Substack editor (post composer, comments, etc.)
- The extension automatically detects editable areas
- A subtle AI button appears for quick access

#### 2. **Text Selection**
- Select any text you want to improve
- Choose from quick actions: Improve, Summarize, Expand, Change Tone
- Or write custom instructions for specific needs

#### 3. **AI Processing**
- Your text is sent to your local Ollama installation
- AI generates improved version based on your chosen action
- Response appears in a clean, modern panel

#### 4. **Review & Apply**
- Review the AI-generated content
- **Apply** to replace your selected text
- **Copy** to use elsewhere
- Or **edit further** and re-run

### Extension Popup Features

Click the extension icon in your toolbar to access:

- **Quick Actions** - One-click improvements
- **Model Selection** - Switch between your installed models
- **Settings** - Customize behavior and output
- **Status Check** - Verify Ollama connection

## 🎨 Interface Overview

### Floating AI Button
- **Appears automatically** when writing on Substack
- **Positioned intelligently** near active editors
- **Smooth animations** and hover effects
- **Minimal interference** with your writing flow

### AI Panel
- **Modern, clean design** that matches Substack's aesthetic
- **Text preview** shows what you've selected
- **Action buttons** for common improvements
- **Custom prompt area** for specific instructions
- **Response viewer** with apply/copy options

### Extension Popup
- **Status indicator** - Shows Ollama connection
- **Model selector** - Choose your preferred AI model
- **Quick actions** - Execute common tasks
- **Advanced settings** - Fine-tune AI behavior

## ⚙️ Configuration

### Model Selection
Choose from your installed Ollama models:
- **Gemma 3 (1B)** - Fast, good for quick improvements
- **Llama 3.2 (3B)** - Balanced performance and quality
- **Mistral (7B)** - Advanced reasoning and creativity

### AI Settings
- **Creativity (Temperature)**: 0.1 (conservative) to 1.0 (creative)
- **Max Words**: Control response length (50-2000 words)
- **Auto-Replace**: Automatically replace selected text
- **Custom Prompts**: Save frequently used instructions

### Privacy Settings
- **100% Local**: All processing happens on your machine
- **No Data Sent**: Nothing leaves your computer
- **Offline Capable**: Works without internet (after model download)

## 🛠️ Technical Details

### Architecture
- **Manifest V3** - Latest Chrome extension standard
- **Content Script** - Detects and enhances Substack editors
- **Background Service** - Handles Ollama API communication
- **Popup Interface** - Settings and quick actions

### Supported Sites
- **Any Substack domain** (`*.substack.com`)
- **All editor types**: ProseMirror, contenteditable, textareas
- **Comment sections** and **post composers**

### API Integration
- **Ollama REST API** - Direct communication with local server
- **JSON requests** - Standard HTTP POST to `localhost:11434`
- **Error handling** - Graceful fallbacks and user feedback

## 🔍 Troubleshooting

### Common Issues

**❌ "Ollama not available"**
- Ensure Ollama is running: `ollama serve`
- Check if models are installed: `ollama list`
- Verify port 11434 is accessible

**❌ "No text selected"**
- Select text before clicking AI actions
- Or use the custom prompt for general improvements
- Make sure you're in an editable text area

**❌ "Extension not working on Substack"**
- Refresh the page
- Check if you're on a Substack domain
- Ensure extension permissions are granted

**❌ Slow responses**
- Try a smaller model (e.g., Gemma 1B instead of Llama 7B)
- Reduce max tokens in settings
- Check your system resources

### Debug Mode
1. Open Chrome DevTools (F12)
2. Check Console for error messages
3. Look for extension logs starting with 🤖 or 🚀

## 🎯 Best Practices

### Writing Tips
- **Select specific sections** rather than entire posts for focused improvements
- **Use custom prompts** for domain-specific improvements
- **Start with smaller models** for faster iteration
- **Review AI suggestions** before applying

### Performance Tips
- **Close other AI-heavy applications** for better model performance
- **Use appropriate models** for your hardware capabilities
- **Enable auto-replace** only when confident in AI quality

## 🔐 Privacy & Security

### Local Processing
- **All AI processing** happens locally on your machine
- **No external servers** - your content never leaves your computer
- **No tracking** - no analytics or data collection
- **Offline capable** - works without internet after setup

### Permissions
- **activeTab** - Access current Substack page content
- **storage** - Save your preferences locally
- **host_permissions** - Access Substack sites and local Ollama

## 🚀 Future Features

### Planned Enhancements
- **Multi-language support** - Writing assistance in various languages
- **Style presets** - Pre-configured prompts for different writing styles
- **Batch processing** - Improve multiple sections at once
- **Integration with other platforms** - Medium, Ghost, WordPress
- **Voice input** - Dictate custom prompts
- **Collaborative features** - Share prompts with team members

### Advanced AI Features
- **Context awareness** - Remember previous conversations
- **Writing analytics** - Track improvements over time
- **Custom model training** - Fine-tune for your writing style
- **Real-time suggestions** - Proactive writing assistance

## 📝 Contributing

This extension is open for improvements! Areas where you can help:

- **UI/UX enhancements** - Make it even more beautiful
- **Additional AI actions** - More writing assistance features
- **Platform support** - Extend to other writing platforms
- **Performance optimization** - Faster, more efficient processing
- **Accessibility** - Better support for screen readers and keyboard navigation

## 📄 License

MIT License - Feel free to modify and distribute.

## 🙏 Acknowledgments

- **Ollama team** - For making local AI accessible
- **Substack** - For creating an amazing writing platform
- **Chrome Extensions team** - For the robust extension platform

---

**Happy Writing! 🤖✍️**

*Transform your Substack writing with the power of local AI assistance.*
