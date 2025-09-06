// Working Substack AI Extension - Simplified but functional
console.log('🚀 SUBSTACK AI EXTENSION: Starting...');
console.log('🚀 Script loading at:', new Date().toISOString());
console.log('🚀 Document ready state:', document.readyState);

class SimpleSubstackAI {
    constructor() {
        this.selectedText = '';
        this.autoSendTimer = null;
        this.floatingButton = null;
        this.ollamaUrl = 'http://localhost:11434';
        this.model = 'gemma3:1b';
        this.textBuffer = '';
        this.bufferTimer = null;
        
        this.init();
    }
    
    init() {
        console.log('✅ SimpleSubstackAI initialized');
        console.log('🔧 About to setup listeners...');
        this.setupGlobalSelectionListener();
        console.log('🔧 Listeners setup completed');
    }
    
    setupGlobalSelectionListener() {
        // Multiple ways to detect selection
        document.addEventListener('selectionchange', () => {
            console.log('📝 Selection change event fired');
            setTimeout(() => this.handleSelection(), 50);
        });
        
        // Mouse events
        document.addEventListener('mouseup', () => {
            console.log('🖱️ Mouse up event');
            setTimeout(() => this.handleSelection(), 100);
        });
        
        // Keyboard events (including Ctrl+C)
        document.addEventListener('keydown', (e) => {
            console.log('⌨️ Key pressed:', e.key, e.code);
            
            // Detect Ctrl+C
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                console.log('📋 Ctrl+C detected!');
                setTimeout(() => {
                    this.handleClipboardCopy();
                }, 100);
            }
            
            // Also check for any key that might affect selection
            setTimeout(() => this.handleSelection(), 50);
        });
        
        // Focus events
        document.addEventListener('focusin', () => {
            console.log('👁️ Focus in event');
            setTimeout(() => this.handleSelection(), 50);
        });
        
        console.log('🎯 All selection listeners setup complete');
    }
    
    async handleClipboardCopy() {
        console.log('📋 Handling Ctrl+C clipboard copy...');
        
        try {
            // Get current clipboard content
            const clipboardText = await navigator.clipboard.readText();
            console.log('📋 Clipboard content:', clipboardText.substring(0, 50));
            
            if (clipboardText && clipboardText.trim().length > 5) {
                console.log('✅ Found clipboard text, triggering AI improvement...');
                this.selectedText = clipboardText.trim();
                
                // Show button at cursor position or fixed location
                this.showButtonAtCursor();
                
                // Auto-send after 500ms
                if (this.selectedText.length > 10) {
                    this.scheduleAutoSend();
                }
            }
        } catch (error) {
            console.warn('📋 Could not read clipboard:', error);
            // Fallback to selection
            this.handleSelection();
        }
    }
    
    showButtonAtCursor() {
        // Get cursor position or use selection if available
        const selection = window.getSelection();
        let rect = { top: 100, left: 200, width: 100, height: 20 };
        
        if (selection.rangeCount > 0) {
            rect = selection.getRangeAt(0).getBoundingClientRect();
        } else {
            // Use mouse position or fixed position
            rect = {
                top: window.innerHeight / 2,
                left: window.innerWidth / 2,
                width: 100,
                height: 20
            };
        }
        
        this.showButtonAtPosition(rect);
    }
    
    showButtonAtPosition(rect) {
        console.log('🎈 Creating button at position:', rect);
        
        // Remove existing button
        this.removeButton();
        
        // Create button
        this.floatingButton = document.createElement('div');
        this.floatingButton.innerHTML = '🤖✨';
        this.floatingButton.className = 'substack-ai-button';
        this.floatingButton.title = 'AI will improve this text in 0.5s (click to send now)';
        
        // Position and style
        this.floatingButton.style.cssText = `
            position: fixed;
            top: ${Math.max(10, rect.top - 45)}px;
            left: ${Math.max(10, Math.min(window.innerWidth - 50, rect.left + (rect.width / 2) - 18))}px;
            z-index: 10000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 18px;
            width: 36px;
            height: 36px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
            opacity: 0;
            transform: scale(0.8);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        document.body.appendChild(this.floatingButton);
        
        // Animate in
        setTimeout(() => {
            if (this.floatingButton && this.floatingButton.style) {
                this.floatingButton.style.opacity = '1';
                this.floatingButton.style.transform = 'scale(1)';
            }
        }, 10);
        
        // Click handler
        this.floatingButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.cancelAutoSend();
            this.sendToOllama();
        });
        
        console.log('🎈 Floating button created at position');
    }
    
    handleSelection() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Remove existing button
        this.removeButton();
        
        if (selectedText.length > 5) {
            console.log('🎯 Text selected:', selectedText.substring(0, 50));
            
            // Add to buffer with 500ms delay
            this.addToBuffer(selectedText, selection);
        }
    }
    
    addToBuffer(text, selection) {
        // Clear existing buffer timer
        if (this.bufferTimer) {
            clearTimeout(this.bufferTimer);
        }
        
        // Update buffer
        this.textBuffer = text;
        console.log('📥 Text added to buffer, waiting 500ms...');
        
        // Show button immediately
        this.selectedText = text;
        this.showButton(selection);
        
        // Schedule processing after 500ms
        this.bufferTimer = setTimeout(() => {
            console.log('⏰ 500ms elapsed, processing buffered text...');
            this.processBuffer();
        }, 500);
    }
    
    processBuffer() {
        if (this.textBuffer && this.textBuffer.length > 10) {
            console.log('🔄 Processing buffer:', this.textBuffer.substring(0, 50));
            this.selectedText = this.textBuffer;
            this.scheduleAutoSend();
        }
    }
    
    showButton(selection) {
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        this.showButtonAtPosition(rect);
    }
    
    removeButton() {
        if (this.floatingButton && this.floatingButton.style) {
            this.floatingButton.style.opacity = '0';
            this.floatingButton.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                if (this.floatingButton && this.floatingButton.parentNode) {
                    this.floatingButton.parentNode.removeChild(this.floatingButton);
                }
                this.floatingButton = null;
            }, 200);
        }
    }
    
    scheduleAutoSend() {
        this.cancelAutoSend();
        
        // Update button appearance
        if (this.floatingButton && this.floatingButton.style) {
            this.floatingButton.innerHTML = '⏳';
            this.floatingButton.title = 'Auto-sending in 0.5s... (click to send now)';
            this.floatingButton.style.background = 'linear-gradient(135deg, #ffa502 0%, #ff6348 100%)';
        }
        
        // Set timer
        this.autoSendTimer = setTimeout(() => {
            this.sendToOllama();
        }, 500);
        
        console.log('⏰ Auto-send scheduled for 500ms');
    }
    
    cancelAutoSend() {
        if (this.autoSendTimer) {
            clearTimeout(this.autoSendTimer);
            this.autoSendTimer = null;
        }
    }
    
    async sendToOllama() {
        if (!this.selectedText) return;
        
        console.log('🚀 Sending to Ollama:', this.selectedText.substring(0, 50));
        
        // Update button to show processing
        if (this.floatingButton && this.floatingButton.style) {
            this.floatingButton.innerHTML = '⚡';
            this.floatingButton.title = 'AI is improving your text...';
            this.floatingButton.style.background = 'linear-gradient(135deg, #2ed573 0%, #17a2b8 100%)';
            this.floatingButton.style.pointerEvents = 'none';
        }
        
        try {
            // Copy to clipboard
            await navigator.clipboard.writeText(this.selectedText);
            console.log('📋 Text copied to clipboard');
            
            // Prepare prompt
            const prompt = `Improve the following text to make it more engaging, clear, and well-written while maintaining the original meaning and tone. Return only the improved text without any additional commentary:\n\n${this.selectedText}`;
            
            // Call Ollama with CORS handling and cache busting
            console.log('🌐 Making request to Ollama...');
            const requestUrl = `${this.ollamaUrl}/api/chat?t=${Date.now()}`;
            console.log('🔗 Request URL:', requestUrl);
            
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                }),
                mode: 'cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout(30000)
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', [...response.headers.entries()]);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const improvedText = data.message.content;
            
            console.log('✅ Ollama response received:', improvedText.substring(0, 100));
            
            // Replace text
            await this.replaceSelectedText(improvedText);
            this.showSuccess();
            
        } catch (error) {
            console.error('❌ Ollama request failed:', error);
            
            // Check if it's a CORS error
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                console.error('🌐 CORS Error detected');
                this.showError('CORS Error: Restart Ollama with: OLLAMA_ORIGINS="*" ollama serve');
                
                // Show helpful notification
                this.showNotification(`
                    ⚠️ CORS Error! In terminal run:
                    pkill -f ollama
                    OLLAMA_ORIGINS="*" ollama serve
                `, '#ff6348');
            } else {
                this.showError(error.message);
            }
        }
    }
    
    async replaceSelectedText(newText) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(newText));
            
            // Clear selection
            selection.removeAllRanges();
            
            console.log('✅ Text replaced successfully');
        }
    }
    
    showSuccess() {
        if (this.floatingButton && this.floatingButton.style) {
            this.floatingButton.innerHTML = '✅';
            this.floatingButton.title = 'Text improved successfully!';
            this.floatingButton.style.background = 'linear-gradient(135deg, #2ed573 0%, #27ae60 100%)';
            
            setTimeout(() => this.removeButton(), 2000);
        }
        
        this.showNotification('Text improved by AI! ✨', '#2ed573');
    }
    
    showError(message) {
        if (this.floatingButton && this.floatingButton.style) {
            this.floatingButton.innerHTML = '❌';
            this.floatingButton.title = `Error: ${message}`;
            this.floatingButton.style.background = 'linear-gradient(135deg, #ff4757 0%, #c44569 100%)';
            
            setTimeout(() => this.removeButton(), 3000);
        }
        
        this.showNotification(`AI Error: ${message}`, '#ff4757');
    }
    
    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10002;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize
console.log('🔧 About to create SimpleSubstackAI instance...');
const substackAI = new SimpleSubstackAI();
console.log('🔧 SimpleSubstackAI instance created:', !!substackAI);

// Global test functions
window.testAI = function() {
    console.log('🧪 AI Extension Test');
    console.log('  - Extension loaded:', !!substackAI);
    console.log('  - Current selection:', window.getSelection().toString());
    return 'AI Extension is working!';
};

window.forceButton = function() {
    const fakeSelection = {
        rangeCount: 1,
        getRangeAt: () => ({
            getBoundingClientRect: () => ({ top: 100, left: 200, width: 100, height: 20 })
        })
    };
    substackAI.selectedText = 'Test text for button';
    substackAI.showButton(fakeSelection);
};

console.log('✅ SUBSTACK AI READY! Try: testAI() or forceButton()');
console.log('🎯 Highlight text to see auto-improvement in action!');

// Add a simple click test to verify events work
document.addEventListener('click', () => {
    console.log('👆 CLICK EVENT DETECTED - Events are working!');
});

// Test that runs every 5 seconds to show script is alive
let heartbeat = 0;
setInterval(() => {
    heartbeat++;
    console.log(`💓 Heartbeat ${heartbeat} - Script is alive and running`);
}, 5000);
