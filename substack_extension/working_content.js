// Substack AI Extension - UI Overlay Version
console.log('🚀 SUBSTACK AI EXTENSION: Starting UI Overlay Version...');

class SubstackAIOverlay {
    constructor() {
        this.selectedText = '';
        this.currentSelection = null;
        this.overlayTimeout = null;
        this.overlay = null;
        this.ollamaUrl = 'http://localhost:11434';
        this.model = 'gemma3:1b';
        this.isActive = false;
        this.overlayDismissed = false; // Flag to prevent re-showing until new selection
        
        this.init();
    }
    
    init() {
        console.log('✅ SubstackAIOverlay initialized');
        
        // Only activate on publish/post pages (writing/editing)
        if (!this.isWritingPage()) {
            console.log('❌ Not a writing page - AI assistant disabled');
            console.log('📝 AI assistant only works on /publish/post/ pages');
            return;
        }
        
        console.log('✅ Writing page detected - AI assistant enabled');
        this.setupSelectionListener();
        this.createOverlayStyles();
        this.setupNavigationWatcher();
    }
    
    isWritingPage() {
        const url = window.location.href;
        const pathname = window.location.pathname;
        
        // Check if we're on a publish/post page (writing/editing)
        const isPublishPost = pathname.includes('/publish/post/');
        
        console.log('🔍 Page check:');
        console.log('  - URL:', url);
        console.log('  - Pathname:', pathname);
        console.log('  - Is publish/post page:', isPublishPost);
        
        return isPublishPost;
    }
    
    setupNavigationWatcher() {
        // Watch for navigation changes in SPA
        let lastUrl = window.location.href;
        
        const checkNavigation = () => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                console.log('🔄 Navigation detected:', currentUrl);
                lastUrl = currentUrl;
                
                // If we navigated away from a writing page, hide overlay and disable
                if (!this.isWritingPage()) {
                    console.log('❌ Navigated away from writing page - disabling AI assistant');
                    this.hideOverlay();
                    this.isActive = false;
                } else if (!this.isActive) {
                    console.log('✅ Navigated to writing page - enabling AI assistant');
                    this.isActive = true;
                }
            }
        };
        
        // Check navigation every 500ms
        setInterval(checkNavigation, 500);
        
        // Also listen for browser navigation events
        window.addEventListener('popstate', checkNavigation);
        
        this.isActive = true;
        console.log('👁️ Navigation watcher setup');
    }
    
    setupSelectionListener() {
        // Listen for text selection
        document.addEventListener('mouseup', () => {
            setTimeout(() => this.handleSelection(), 100);
        });
        
        document.addEventListener('selectionchange', () => {
            setTimeout(() => this.handleSelection(), 50);
        });
        
        console.log('👂 Selection listeners setup');
    }
    
    handleSelection() {
        // Only work if we're on an active writing page
        if (!this.isActive) {
            return;
        }
        
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Clear existing overlay timeout
        if (this.overlayTimeout) {
            clearTimeout(this.overlayTimeout);
        }
        
        // Hide existing overlay
        this.hideOverlay();
        
        if (selectedText.length > 5) {
            console.log('🎯 Text selected:', selectedText.substring(0, 50));
            
            // Check if this is a new selection (different text or reset flag)
            const isNewSelection = this.selectedText !== selectedText;
            
            this.selectedText = selectedText;
            this.currentSelection = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            
            // Reset dismissal flag for new selections
            if (isNewSelection) {
                this.overlayDismissed = false;
                console.log('🔄 New selection detected, resetting dismissal flag');
            }
            
            // Only show overlay if not previously dismissed for this selection
            if (!this.overlayDismissed) {
                console.log('⏰ Scheduling overlay to show in 500ms');
                this.overlayTimeout = setTimeout(() => {
                    this.showOverlay();
                }, 500);
            } else {
                console.log('🚫 Overlay dismissed for this selection, not showing');
            }
        }
    }
    
    createOverlayStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-overlay {
                position: fixed;
                background: white;
                border: 2px solid #4f46e5;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                width: 400px;
                height: 350px;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: scale(0.9) translateY(-10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            
            .ai-overlay-header {
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                padding: 12px 16px;
                font-weight: 600;
                font-size: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .ai-overlay-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            
            .ai-overlay-close:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .ai-overlay-content {
                padding: 16px;
                padding-bottom: 70px;
                height: calc(100% - 60px);
                overflow: hidden;
                box-sizing: border-box;
            }
            
            .ai-original {
                background: #f3f4f6;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 12px;
                font-size: 13px;
                color: #374151;
                border-left: 3px solid #9ca3af;
            }
            
            .ai-suggestion {
                background: #f0f9ff;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 16px;
                font-size: 14px;
                color: #1f2937;
                border-left: 3px solid #3b82f6;
                height: 120px;
                white-space: pre-wrap;
                overflow-y: auto;
            }
            
            .ai-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 60px;
                color: #6b7280;
                font-style: italic;
                font-size: 14px;
            }
            
            .ai-overlay-buttons {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                display: flex;
                gap: 8px;
                justify-content: flex-end;
                padding: 16px;
                background: white;
                border-top: 1px solid #e5e7eb;
                border-radius: 0 0 10px 10px;
            }
            
            .ai-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .ai-btn-apply {
                background: #10b981;
                color: white;
            }
            
            .ai-btn-apply:hover {
                background: #059669;
            }
            
            .ai-btn-copy {
                background: #3b82f6;
                color: white;
            }
            
            .ai-btn-copy:hover {
                background: #2563eb;
            }
            
            .ai-btn-cancel {
                background: #e5e7eb;
                color: #374151;
            }
            
            .ai-btn-cancel:hover {
                background: #d1d5db;
            }
        `;
        document.head.appendChild(style);
    }
    
    showOverlay() {
        if (!this.selectedText) return;
        
        // Calculate position
        const selection = window.getSelection();
        let rect = { top: 100, left: 200, width: 200, height: 20 };
        
        if (selection.rangeCount > 0) {
            rect = selection.getRangeAt(0).getBoundingClientRect();
        }
        
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'ai-overlay';
        this.overlay.style.top = Math.min(window.innerHeight - 450, Math.max(10, rect.bottom + 10)) + 'px';
        this.overlay.style.left = Math.min(window.innerWidth - 420, Math.max(10, rect.left)) + 'px';
        
        this.overlay.innerHTML = `
            <div class="ai-overlay-header">
                <span>🤖 AI Text Improvement</span>
                <button class="ai-overlay-close">×</button>
            </div>
            <div class="ai-overlay-content">
                <div class="ai-original">
                    <strong>Original:</strong><br>
                    ${this.escapeHtml(this.selectedText)}
                </div>
                <div class="ai-suggestion">
                    <div class="ai-loading">
                        🔄 AI is improving your text...
                    </div>
                </div>
                <div class="ai-overlay-buttons">
                    <button class="ai-btn ai-btn-cancel">Cancel</button>
                    <button class="ai-btn ai-btn-copy" disabled>Copy</button>
                    <button class="ai-btn ai-btn-apply" disabled>Apply</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        
        // Event listeners
        this.overlay.querySelector('.ai-overlay-close').addEventListener('click', () => this.hideOverlay());
        this.overlay.querySelector('.ai-btn-cancel').addEventListener('click', () => this.hideOverlay());
        
        console.log('📱 Overlay shown, calling AI...');
        
        // Start AI processing
        this.processWithAI();
    }
    
    async processWithAI() {
        try {
            // System prompt - defines the AI's role and behavior
            const systemPrompt = `ROLE: You are a subtle writing assistant who enhances text naturally.
TASK: Improve the selected text while preserving its original structure and tone.
INSTRUCTIONS:
- If the sentence is SHORT or INCOMPLETE: Add natural, logical details to complete it without changing the core meaning.
- If the sentence is already COMPLETE: Make minor improvements for clarity and flow.
- Keep the original sentence structure and style as much as possible.
- Add only necessary details - don't be overly dramatic or flowery.
- Maintain a natural, professional tone.
- Keep output to 1-2 sentences maximum.
- Focus on clarity and completeness, not dramatic transformation.
EXAMPLES:
- "this man is eating" → "This man is eating lunch at his desk."
- "the car is fast" → "The car is fast enough to handle highway speeds comfortably."
- "she was walking" → "She was walking to the nearby coffee shop."
OUTPUT_FORMAT: Return only the enhanced text, no explanations.`;

            // User prompt with the selected text
            const userPrompt = `[Input text: ${this.selectedText}]`;
            
            const response = await fetch(`${this.ollamaUrl}/api/chat?t=${Date.now()}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    stream: false
                }),
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const improvedText = data.message.content;
            
            console.log('✅ AI response received:', improvedText.substring(0, 100));
            
            // Update overlay with suggestion
            this.showSuggestion(improvedText);
            
        } catch (error) {
            console.error('❌ AI Error:', error);
            this.showError(error.message);
        }
    }
    
    showSuggestion(improvedText) {
        if (!this.overlay) return;
        
        const suggestionDiv = this.overlay.querySelector('.ai-suggestion');
        const copyBtn = this.overlay.querySelector('.ai-btn-copy');
        const applyBtn = this.overlay.querySelector('.ai-btn-apply');
        
        suggestionDiv.innerHTML = `<strong>AI Suggestion:</strong><br>${this.escapeHtml(improvedText)}`;
        
        // Enable buttons
        copyBtn.disabled = false;
        applyBtn.disabled = false;
        
        // Add event listeners
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(improvedText);
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = 'Copy', 1000);
            
            // Optional: Auto-dismiss after copy (uncomment if desired)
            // setTimeout(() => this.hideOverlay(), 1500);
        });
        
        applyBtn.addEventListener('click', () => {
            // Since we now return only improved text, use it directly
            this.applyImprovement(improvedText);
        });
    }
    
    showError(message) {
        if (!this.overlay) return;
        
        const suggestionDiv = this.overlay.querySelector('.ai-suggestion');
        suggestionDiv.innerHTML = `<div style="color: #dc2626;">❌ Error: ${this.escapeHtml(message)}</div>`;
        
        if (message.includes('Failed to fetch') || message.includes('CORS')) {
            suggestionDiv.innerHTML += `<div style="margin-top: 8px; font-size: 12px; color: #6b7280;">Try: OLLAMA_ORIGINS="*" ollama serve</div>`;
        }
    }
    
    applyImprovement(improvedText) {
        if (!this.currentSelection) {
            console.log('❌ No selection to replace');
            return;
        }
        
        try {
            // Clean up the improved text (remove extra whitespace)
            const cleanText = improvedText.trim();
            
            if (!cleanText) {
                console.error('❌ No improved text to apply');
                return;
            }
            
            // Replace the selected text in the HTML
            this.currentSelection.deleteContents();
            this.currentSelection.insertNode(document.createTextNode(cleanText));
            
            console.log('✅ Improved text applied to HTML:', cleanText.substring(0, 50) + '...');
            
            // Reset dismissal flag when text is applied - user might want to improve it further
            this.overlayDismissed = false;
            this.selectedText = ''; // Clear to ensure next selection is treated as new
            console.log('🔄 Applied text - overlay can appear again for new selections');
            
            this.hideOverlay();
            
        } catch (error) {
            console.error('❌ Failed to replace text:', error);
        }
    }
    
    // extractImprovedText method removed - AI now returns only improved text
    
    hideOverlay() {
        if (this.overlay) {
            // Set dismissal flag when overlay is manually closed
            this.overlayDismissed = true;
            console.log('❌ Overlay dismissed - won\'t show again until new selection');
            
            this.overlay.style.animation = 'slideIn 0.2s ease-in reverse';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
            }, 200);
        }
        
        if (this.overlayTimeout) {
            clearTimeout(this.overlayTimeout);
            this.overlayTimeout = null;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
console.log('🔧 Creating SubstackAIOverlay instance...');
const substackAI = new SubstackAIOverlay();
console.log('✅ SubstackAIOverlay ready!');
console.log('📝 Instructions:');
console.log('  ⚠️  AI assistant only works on /publish/post/ pages (writing/editing)');
console.log('  1. Navigate to a Substack post you\'re writing or editing');
console.log('  2. Select some text in the editor');
console.log('  3. Wait 0.5 seconds for AI overlay to appear');
console.log('  4. Choose to Apply, Copy, or Cancel the suggestion');

// Test function
window.testAI = function() {
    console.log('🧪 AI Extension Test - Overlay Version');
    console.log('  - Extension loaded:', !!substackAI);
    console.log('  - Current selection:', window.getSelection().toString());
    return 'AI Extension with overlay is working!';
};