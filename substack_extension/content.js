// Content script for Substack AI Writer Extension
// Detects and integrates with Substack's editor

class SubstackAIIntegration {
    constructor() {
        this.textAreas = new Set();
        this.isSubstack = this.detectSubstack();
        this.aiPanel = null;
        this.selectedText = '';
        this.activeEditor = null;
        this.floatingButton = null;
        this.autoSendTimer = null;
        this.lastSelection = null;
        
        console.log('🔍 SubstackAI: Constructor called');
        console.log('🔍 Is Substack detected?', this.isSubstack);
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 Hostname:', window.location.hostname);
        
        if (this.isSubstack) {
            this.init();
        } else {
            console.warn('❌ Not a Substack site - extension will not activate');
        }
    }
    
    detectSubstack() {
        // Check if we're on a Substack site
        const isSubstackDomain = window.location.hostname.includes('substack.com');
        const hasComposer = document.querySelector('[data-testid="composer"]') !== null;
        const hasProseMirror = document.querySelector('.ProseMirror') !== null;
        const hasContentEditable = document.querySelector('[contenteditable="true"]') !== null;
        
        console.log('🔍 Detection checks:');
        console.log('  - Substack domain:', isSubstackDomain);
        console.log('  - Has composer:', hasComposer);
        console.log('  - Has ProseMirror:', hasProseMirror);
        console.log('  - Has contenteditable:', hasContentEditable);
        
        return isSubstackDomain || hasComposer || hasProseMirror || hasContentEditable;
    }
    
    init() {
        console.log('🚀 Substack AI Writer: Initializing...');
        
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.findEditors();
        this.createAIPanel();
        this.setupEventListeners();
        this.observeEditorChanges();
        
        console.log('✅ Substack AI Writer: Ready!');
    }
    
    findEditors() {
        // First, let's see ALL possible editable elements on the page
        console.log('🔍 DEBUG: Searching for ALL editable elements on page...');
        
        // Log page info
        console.log('📄 Page info:');
        console.log('  - URL:', window.location.href);
        console.log('  - Title:', document.title);
        console.log('  - Body classes:', document.body.className);
        
        // Check for ANY editable elements
        const allEditables = document.querySelectorAll('*');
        let editableCount = 0;
        const editableElements = [];
        
        allEditables.forEach(el => {
            const isEditable = el.contentEditable === 'true' || 
                             el.tagName === 'TEXTAREA' || 
                             el.tagName === 'INPUT' ||
                             el.getAttribute('contenteditable') === 'true' ||
                             el.hasAttribute('data-slate-editor') ||
                             el.classList.contains('ProseMirror') ||
                             el.getAttribute('role') === 'textbox';
            
            if (isEditable) {
                editableCount++;
                editableElements.push({
                    element: el,
                    tag: el.tagName,
                    classes: el.className,
                    contentEditable: el.contentEditable,
                    role: el.getAttribute('role'),
                    placeholder: el.placeholder || el.getAttribute('placeholder'),
                    rect: el.getBoundingClientRect()
                });
            }
        });
        
        console.log(`🎯 Found ${editableCount} potentially editable elements:`);
        editableElements.forEach((info, i) => {
            console.log(`  [${i}] ${info.tag}.${info.classes}`);
            console.log(`      - contentEditable: ${info.contentEditable}`);
            console.log(`      - role: ${info.role}`);
            console.log(`      - placeholder: ${info.placeholder}`);
            console.log(`      - dimensions: ${info.rect.width}x${info.rect.height}`);
            console.log(`      - visible: ${info.rect.width > 0 && info.rect.height > 0}`);
        });
        
        // Now try our selectors
        const selectors = [
            '[contenteditable="true"]',  // Main content editor
            '.ProseMirror',              // ProseMirror editor
            '[data-testid="composer"]',  // Composer area
            'textarea[placeholder*="write"]', // Fallback textareas
            '[role="textbox"]',          // ARIA textboxes
            '.notranslate[contenteditable]', // Specific Substack editor
            'textarea',                  // Any textarea
            'input[type="text"]',        // Text inputs
            '.DraftEditor-editorContainer', // Draft.js editors
            '[data-slate-editor="true"]', // Slate editors
            '.public-DraftEditor-content', // Draft.js content
            '[data-contents="true"]',    // Some editors
            '.ql-editor',                // Quill editor
            '[data-gramm_editor="true"]' // Grammarly enhanced
        ];
        
        console.log('🔍 Testing specific selectors...');
        let totalFound = 0;
        
        selectors.forEach(selector => {
            try {
                const editors = document.querySelectorAll(selector);
                console.log(`  - "${selector}": found ${editors.length} elements`);
                
                editors.forEach((editor, index) => {
                    const rect = editor.getBoundingClientRect();
                    const isValid = this.isValidEditor(editor);
                    
                    console.log(`    [${index}] Element:`, {
                        tag: editor.tagName,
                        classes: editor.className,
                        id: editor.id,
                        dimensions: `${rect.width}x${rect.height}`,
                        visible: rect.width > 0 && rect.height > 0,
                        valid: isValid,
                        hasParent: !!editor.offsetParent
                    });
                    
                    if (isValid) {
                        this.textAreas.add(editor);
                        this.enhanceEditor(editor);
                        totalFound++;
                    } else {
                        // Debug why it's invalid
                        console.log(`    [${index}] Why invalid:`, {
                            tooSmall: rect.width <= 100 || rect.height <= 50,
                            hidden: !editor.offsetParent,
                            alreadyEnhanced: editor.classList.contains('ai-enhanced')
                        });
                    }
                });
            } catch (error) {
                console.log(`  - "${selector}": ERROR -`, error.message);
            }
        });
        
        console.log(`📝 Total valid editors found: ${this.textAreas.size}`);
        console.log('📝 All editors:', Array.from(this.textAreas));
        
        // If no editors found, let's try a more aggressive approach
        if (this.textAreas.size === 0) {
            console.log('⚠️ No editors found with normal method, trying aggressive approach...');
            this.findEditorsAggressive();
        }
    }
    
    findEditorsAggressive() {
        console.log('🔥 AGGRESSIVE EDITOR SEARCH...');
        
        // Add listeners to ALL potentially editable elements, even if they're small
        const elements = document.querySelectorAll(`
            [contenteditable],
            textarea,
            input[type="text"],
            [role="textbox"],
            .ProseMirror,
            [data-slate-editor],
            .ql-editor
        `);
        
        console.log(`🔥 Found ${elements.length} elements to enhance aggressively`);
        
        elements.forEach((element, i) => {
            console.log(`🔥 [${i}] Enhancing:`, element.tagName, element.className);
            this.textAreas.add(element);
            this.enhanceEditor(element);
        });
        
        console.log(`🔥 Aggressively enhanced ${elements.length} elements`);
    }
    
    isValidEditor(element) {
        // Filter out small or hidden editors
        const rect = element.getBoundingClientRect();
        return rect.width > 100 && rect.height > 50 && 
               element.offsetParent !== null &&
               !element.classList.contains('ai-enhanced');
    }
    
    enhanceEditor(editor) {
        // Mark as enhanced to avoid duplicate processing
        editor.classList.add('ai-enhanced');
        
        // Add AI button near the editor
        this.addAIButton(editor);
        
        // Setup text selection handling  
        console.log('🎯 Setting up event listeners for editor:', editor.tagName);
        
        editor.addEventListener('mouseup', () => {
            console.log('🖱️ Mouse up event on editor');
            setTimeout(() => this.handleTextSelection(editor), 10);
        });
        
        editor.addEventListener('keyup', () => {
            console.log('⌨️ Key up event on editor');
            setTimeout(() => this.handleTextSelection(editor), 10);
        });
        
        // Also listen for selection change globally
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                
                // Check if selection is within this editor
                if (editor.contains(container) || editor === container) {
                    console.log('🎯 Selection change detected in editor');
                    setTimeout(() => this.handleTextSelection(editor), 10);
                }
            }
        });
        
        // Cancel auto-send when user starts typing or clicks
        editor.addEventListener('keydown', () => this.cancelAutoSend());
        editor.addEventListener('click', () => {
            // Small delay to allow selection to complete
            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection.toString().trim()) {
                    this.cancelAutoSend();
                    this.removeFloatingButton();
                }
            }, 100);
        });
        
        console.log('🎨 Enhanced editor:', editor.tagName);
    }
    
    addAIButton(editor) {
        // Create floating AI button
        const aiButton = document.createElement('div');
        aiButton.className = 'substack-ai-button';
        aiButton.innerHTML = '🤖';
        aiButton.title = 'AI Writing Assistant';
        
        // Position relative to editor
        const rect = editor.getBoundingClientRect();
        aiButton.style.cssText = `
            position: fixed;
            top: ${rect.top - 40}px;
            right: ${window.innerWidth - rect.right}px;
            z-index: 10000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 20px;
            width: 36px;
            height: 36px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
            opacity: 0.7;
        `;
        
        // Hover effects
        aiButton.addEventListener('mouseenter', () => {
            aiButton.style.opacity = '1';
            aiButton.style.transform = 'scale(1.1)';
        });
        
        aiButton.addEventListener('mouseleave', () => {
            aiButton.style.opacity = '0.7';
            aiButton.style.transform = 'scale(1)';
        });
        
        // Click handler
        aiButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.activeEditor = editor;
            this.toggleAIPanel();
        });
        
        document.body.appendChild(aiButton);
        
        // Reposition on scroll/resize
        const updatePosition = () => {
            const newRect = editor.getBoundingClientRect();
            aiButton.style.top = `${newRect.top - 40}px`;
            aiButton.style.right = `${window.innerWidth - newRect.right}px`;
        };
        
        window.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);
    }
    
    createAIPanel() {
        this.aiPanel = document.createElement('div');
        this.aiPanel.className = 'substack-ai-panel';
        this.aiPanel.innerHTML = `
            <div class="ai-panel-header">
                <span>🤖 AI Writing Assistant</span>
                <button class="ai-panel-close">×</button>
            </div>
            <div class="ai-panel-content">
                <div class="selected-text-preview" id="selectedPreview"></div>
                <div class="ai-actions">
                    <button class="ai-action-btn" data-action="improve">✨ Improve Writing</button>
                    <button class="ai-action-btn" data-action="summarize">📝 Summarize</button>
                    <button class="ai-action-btn" data-action="expand">🔍 Expand Ideas</button>
                    <button class="ai-action-btn" data-action="tone">🎭 Change Tone</button>
                </div>
                <div class="custom-prompt-section">
                    <textarea placeholder="Custom instructions..." class="custom-prompt" rows="2"></textarea>
                    <button class="ai-action-btn custom-btn" data-action="custom">🎯 Apply</button>
                </div>
                <div class="ai-response" id="aiResponse"></div>
            </div>
        `;
        
        this.aiPanel.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            width: 320px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10001;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        document.body.appendChild(this.aiPanel);
        this.setupPanelEvents();
    }
    
    setupPanelEvents() {
        // Close button
        this.aiPanel.querySelector('.ai-panel-close').addEventListener('click', () => {
            this.hideAIPanel();
        });
        
        // Action buttons
        this.aiPanel.querySelectorAll('.ai-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.executeAIAction(action);
            });
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.aiPanel.contains(e.target) && 
                !e.target.classList.contains('substack-ai-button')) {
                this.hideAIPanel();
            }
        });
    }
    
    handleTextSelection(editor) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        console.log('📝 Text selection event triggered');
        console.log('  - Editor:', editor.tagName, editor.className);
        console.log('  - Selected text length:', selectedText.length);
        console.log('  - Selected text:', selectedText.substring(0, 50));
        console.log('  - Selection object:', selection);
        console.log('  - Range count:', selection.rangeCount);
        
        // Remove any existing floating button
        this.removeFloatingButton();
        
        if (selectedText && selectedText.length > 5) {
            console.log('✅ Text selection meets criteria - processing...');
            this.selectedText = selectedText;
            this.activeEditor = editor;
            
            // Show floating button next to selection
            this.showFloatingButton(selection);
            
            // Auto-send after 500ms if text is substantial
            if (selectedText.length > 10) {
                console.log('🕐 Scheduling auto-send (500ms)');
                this.scheduleAutoSend();
            } else {
                console.log('📏 Text too short for auto-send (need 10+ chars)');
            }
            
            // Update preview in panel if it exists
            if (this.aiPanel) {
                const preview = this.aiPanel.querySelector('#selectedPreview');
                if (preview) {
                    preview.textContent = selectedText.length > 100 ? 
                        selectedText.substring(0, 100) + '...' : selectedText;
                    preview.style.display = 'block';
                }
            }
        } else {
            console.log('❌ Text selection does not meet criteria');
            console.log('  - Text empty?', !selectedText);
            console.log('  - Text too short?', selectedText.length <= 5);
        }
    }
    
    toggleAIPanel() {
        if (this.aiPanel.style.display === 'none' || !this.aiPanel.style.display) {
            this.showAIPanel();
        } else {
            this.hideAIPanel();
        }
    }
    
    showAIPanel() {
        this.aiPanel.style.display = 'block';
        // Animate in
        setTimeout(() => {
            this.aiPanel.style.opacity = '1';
            this.aiPanel.style.transform = 'translateY(-50%) scale(1)';
        }, 10);
    }
    
    hideAIPanel() {
        this.aiPanel.style.opacity = '0';
        this.aiPanel.style.transform = 'translateY(-50%) scale(0.95)';
        setTimeout(() => {
            this.aiPanel.style.display = 'none';
        }, 200);
    }
    
    async executeAIAction(action) {
        if (!this.activeEditor) return;
        
        const textToProcess = this.selectedText || this.getEditorContent(this.activeEditor);
        if (!textToProcess) {
            this.showError('No text selected or found');
            return;
        }
        
        const prompt = this.generatePrompt(action, textToProcess);
        await this.callOllamaAPI(prompt, action);
    }
    
    generatePrompt(action, text) {
        const prompts = {
            improve: `Improve the following text to make it more engaging, clear, and well-written while maintaining the original meaning and tone:\n\n${text}`,
            summarize: `Provide a concise summary of the following text:\n\n${text}`,
            expand: `Expand on the following text with more details, examples, and explanations:\n\n${text}`,
            tone: `Rewrite the following text in a more engaging and conversational tone suitable for a newsletter:\n\n${text}`,
            custom: `${this.aiPanel.querySelector('.custom-prompt').value}\n\n${text}`
        };
        
        return prompts[action] || prompts.improve;
    }
    
    async callOllamaAPI(prompt, action) {
        try {
            console.log('🤖 Calling Ollama API for:', action);
            
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gemma3:1b',
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                }),
                signal: AbortSignal.timeout(30000) // 30 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const aiResponse = data.message.content;
            
            console.log('✅ Ollama response received:', aiResponse.substring(0, 100) + '...');
            
            return {
                success: true,
                response: aiResponse,
                model: data.model,
                created_at: data.created_at
            };
            
        } catch (error) {
            console.error('❌ AI request failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    displayResponse(response, action) {
        const responseDiv = this.aiPanel.querySelector('#aiResponse');
        responseDiv.innerHTML = `
            <div class="response-header">
                <span>🤖 AI Response</span>
                <div class="response-actions">
                    <button class="response-btn" onclick="this.closest('.substack-ai-panel').dispatchEvent(new CustomEvent('apply-response'))">Apply</button>
                    <button class="response-btn" onclick="this.closest('.substack-ai-panel').dispatchEvent(new CustomEvent('copy-response'))">Copy</button>
                </div>
            </div>
            <div class="response-text">${response}</div>
        `;
        
        // Store response for actions
        this.lastResponse = response;
        
        // Setup response actions
        this.aiPanel.addEventListener('apply-response', () => this.applyResponse());
        this.aiPanel.addEventListener('copy-response', () => this.copyResponse());
        
        this.hideLoading();
    }
    
    applyResponse() {
        if (!this.lastResponse || !this.activeEditor) return;
        
        if (this.selectedText) {
            // Replace selected text
            this.replaceSelectedText(this.lastResponse);
        } else {
            // Insert at cursor or append
            this.insertText(this.activeEditor, this.lastResponse);
        }
        
        this.hideAIPanel();
    }
    
    copyResponse() {
        if (!this.lastResponse) return;
        
        navigator.clipboard.writeText(this.lastResponse).then(() => {
            this.showSuccess('Copied to clipboard!');
        });
    }
    
    replaceSelectedText(newText) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(newText));
        }
    }
    
    insertText(editor, text) {
        if (editor.tagName === 'TEXTAREA') {
            const cursorPos = editor.selectionStart;
            const textBefore = editor.value.substring(0, cursorPos);
            const textAfter = editor.value.substring(editor.selectionEnd);
            editor.value = textBefore + text + textAfter;
            editor.selectionStart = editor.selectionEnd = cursorPos + text.length;
        } else {
            // For contenteditable elements
            editor.focus();
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            range.insertNode(document.createTextNode(text));
            range.collapse();
        }
    }
    
    getEditorContent(editor) {
        return editor.tagName === 'TEXTAREA' ? editor.value : editor.textContent;
    }
    
    showLoading() {
        const responseDiv = this.aiPanel.querySelector('#aiResponse');
        responseDiv.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <span>AI is thinking...</span>
            </div>
        `;
    }
    
    hideLoading() {
        // Loading is hidden when response is displayed
    }
    
    showError(message) {
        const responseDiv = this.aiPanel.querySelector('#aiResponse');
        responseDiv.innerHTML = `
            <div class="error-state">
                <span>❌ ${message}</span>
            </div>
        `;
    }
    
    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ed573;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            z-index: 10002;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    observeEditorChanges() {
        // Watch for dynamically added editors
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const newEditors = node.querySelectorAll('[contenteditable="true"], .ProseMirror, textarea');
                        newEditors.forEach(editor => {
                            if (this.isValidEditor(editor) && !this.textAreas.has(editor)) {
                                this.textAreas.add(editor);
                                this.enhanceEditor(editor);
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // ===== FLOATING BUTTON & AUTO-SEND METHODS =====
    
    showFloatingButton(selection) {
        console.log('🎈 Attempting to show floating button');
        console.log('  - Selection range count:', selection.rangeCount);
        
        if (selection.rangeCount === 0) {
            console.log('❌ No selection range - cannot show button');
            return;
        }
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Create floating button
        this.floatingButton = document.createElement('div');
        this.floatingButton.className = 'ai-floating-button';
        this.floatingButton.innerHTML = '🤖✨';
        this.floatingButton.title = 'AI improving this text...';
        
        // Position next to selection
        this.floatingButton.style.cssText = `
            position: fixed;
            top: ${rect.top - 35}px;
            left: ${rect.left + (rect.width / 2) - 18}px;
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            opacity: 0;
            transform: scale(0.8) translateY(10px);
            pointer-events: none;
        `;
        
        document.body.appendChild(this.floatingButton);
        
        // Animate in
        setTimeout(() => {
            this.floatingButton.style.opacity = '1';
            this.floatingButton.style.transform = 'scale(1) translateY(0)';
            this.floatingButton.style.pointerEvents = 'auto';
        }, 10);
        
        // Add click handler for manual trigger
        this.floatingButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.cancelAutoSend();
            this.executeQuickImprovement();
        });
        
        // Hover effects
        this.floatingButton.addEventListener('mouseenter', () => {
            this.floatingButton.style.transform = 'scale(1.1) translateY(-2px)';
            this.floatingButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
        });
        
        this.floatingButton.addEventListener('mouseleave', () => {
            this.floatingButton.style.transform = 'scale(1) translateY(0)';
            this.floatingButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
    }
    
    removeFloatingButton() {
        if (this.floatingButton) {
            this.floatingButton.style.opacity = '0';
            this.floatingButton.style.transform = 'scale(0.8) translateY(10px)';
            
            setTimeout(() => {
                if (this.floatingButton && this.floatingButton.parentNode) {
                    this.floatingButton.parentNode.removeChild(this.floatingButton);
                }
                this.floatingButton = null;
            }, 200);
        }
    }
    
    scheduleAutoSend() {
        // Clear any existing timer
        this.cancelAutoSend();
        
        // Update button to show countdown
        if (this.floatingButton) {
            this.floatingButton.innerHTML = '⏳';
            this.floatingButton.title = 'Auto-sending in 0.5s... (click to send now)';
            this.floatingButton.style.background = 'linear-gradient(135deg, #ffa502 0%, #ff6348 100%)';
        }
        
        // Set 500ms timer
        this.autoSendTimer = setTimeout(() => {
            this.executeAutoImprovement();
        }, 500);
        
        console.log('🕐 Auto-send scheduled for 500ms');
    }
    
    cancelAutoSend() {
        if (this.autoSendTimer) {
            clearTimeout(this.autoSendTimer);
            this.autoSendTimer = null;
            console.log('❌ Auto-send cancelled');
        }
    }
    
    async executeAutoImprovement() {
        if (!this.selectedText || !this.activeEditor) return;
        
        console.log('🚀 Auto-executing improvement for:', this.selectedText.substring(0, 50) + '...');
        
        // Update button to show processing
        if (this.floatingButton) {
            this.floatingButton.innerHTML = '⚡';
            this.floatingButton.title = 'AI is improving your text...';
            this.floatingButton.style.background = 'linear-gradient(135deg, #2ed573 0%, #17a2b8 100%)';
            this.floatingButton.style.pointerEvents = 'none';
        }
        
        try {
            // Copy text to clipboard (simulating Ctrl+C)
            await this.copyToClipboard(this.selectedText);
            
            // Generate improvement prompt
            const prompt = `Improve the following text to make it more engaging, clear, and well-written while maintaining the original meaning and tone. Return only the improved text without any additional commentary:\n\n${this.selectedText}`;
            
            // Call Ollama API
            const result = await this.callOllamaAPI(prompt, 'auto-improve');
            
            if (result.success) {
                // Show success and replace text
                this.showAutoSuccess(result.response);
                await this.replaceSelectedTextSmooth(result.response);
            } else {
                this.showAutoError('AI improvement failed');
            }
            
        } catch (error) {
            console.error('Auto-improvement failed:', error);
            this.showAutoError('Auto-improvement failed');
        }
    }
    
    async executeQuickImprovement() {
        // Same as auto but triggered manually
        console.log('👆 Manual quick improvement triggered');
        await this.executeAutoImprovement();
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('📋 Text copied to clipboard');
        } catch (error) {
            console.warn('Clipboard copy failed:', error);
            // Fallback: create temporary input and select
            const tempInput = document.createElement('textarea');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }
    }
    
    async replaceSelectedTextSmooth(newText) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // Animate text replacement
            const tempSpan = document.createElement('span');
            tempSpan.textContent = newText;
            tempSpan.style.opacity = '0';
            tempSpan.style.transition = 'opacity 0.3s ease';
            
            // Replace content
            range.deleteContents();
            range.insertNode(tempSpan);
            
            // Animate in
            setTimeout(() => {
                tempSpan.style.opacity = '1';
            }, 10);
            
            // Replace span with plain text after animation
            setTimeout(() => {
                const textNode = document.createTextNode(newText);
                tempSpan.parentNode.replaceChild(textNode, tempSpan);
                
                // Clear selection and hide button
                selection.removeAllRanges();
                this.removeFloatingButton();
            }, 300);
            
            console.log('✅ Text replaced smoothly');
        }
    }
    
    showAutoSuccess(improvedText) {
        if (this.floatingButton) {
            this.floatingButton.innerHTML = '✅';
            this.floatingButton.title = `Improved! "${improvedText.substring(0, 50)}..."`;
            this.floatingButton.style.background = 'linear-gradient(135deg, #2ed573 0%, #27ae60 100%)';
            
            // Auto-hide after 2 seconds
            setTimeout(() => {
                this.removeFloatingButton();
            }, 2000);
        }
        
        // Show brief success notification
        this.showSuccessNotification('Text improved by AI! ✨');
    }
    
    showAutoError(message) {
        if (this.floatingButton) {
            this.floatingButton.innerHTML = '❌';
            this.floatingButton.title = message;
            this.floatingButton.style.background = 'linear-gradient(135deg, #ff4757 0%, #c44569 100%)';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                this.removeFloatingButton();
            }, 3000);
        }
        
        this.showErrorNotification(message);
    }
    
    showSuccessNotification(message) {
        this.showNotification(message, '#2ed573');
    }
    
    showErrorNotification(message) {
        this.showNotification(message, '#ff4757');
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when content script loads
console.log('🚀 SUBSTACK AI EXTENSION: Content script loading...');
console.log('🚀 URL:', window.location.href);
console.log('🚀 Document ready state:', document.readyState);

const substackAI = new SubstackAIIntegration();

// Add global selection debugging
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    console.log('🌍 SELECTION CHANGE EVENT (even if empty)');
    console.log('  - Text length:', selectedText.length);
    
    if (selectedText.length > 0) {
        console.log('🌍 GLOBAL SELECTION DETECTED:');
        console.log('  - Text:', selectedText.substring(0, 50));
        console.log('  - Length:', selectedText.length);
        console.log('  - Range count:', selection.rangeCount);
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            console.log('  - Container:', container.nodeType === Node.TEXT_NODE ? container.parentElement : container);
            console.log('  - Container tag:', (container.nodeType === Node.TEXT_NODE ? container.parentElement : container).tagName);
        }
        
        // Try to trigger the floating button automatically
        console.log('🎯 Auto-triggering floating button from global selection...');
        substackAI.handleTextSelection(document.activeElement);
    }
}, true); // Use capture phase

// Add mouseup debugging to document
document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
        console.log('🖱️ GLOBAL MOUSEUP with selection:');
        console.log('  - Target:', e.target.tagName, e.target.className);
        console.log('  - Text:', selectedText.substring(0, 50));
        console.log('  - Is editor?', e.target.classList.contains('ai-enhanced'));
    }
});

// Add global test functions
window.testSubstackAI = function() {
    console.log('🧪 MANUAL TEST FUNCTION CALLED');
    console.log('  - Extension loaded:', !!substackAI);
    console.log('  - Is Substack:', substackAI.isSubstack);
    console.log('  - Text areas found:', substackAI.textAreas.size);
    console.log('  - Current selection:', window.getSelection().toString());
    
    // Force a test selection event
    const selection = window.getSelection();
    if (selection.toString().trim()) {
        console.log('🔧 Triggering manual text selection test...');
        substackAI.handleTextSelection(document.activeElement);
    } else {
        console.log('❌ No text selected for test');
    }
};

window.testSelection = function() {
    console.log('🧪 TESTING SELECTION MANUALLY');
    const selection = window.getSelection();
    console.log('  - Selection object:', selection);
    console.log('  - Selected text:', selection.toString());
    console.log('  - Range count:', selection.rangeCount);
    console.log('  - Active element:', document.activeElement);
    console.log('  - Focused element tag:', document.activeElement.tagName);
    
    if (selection.toString().trim()) {
        console.log('✅ Text is selected, forcing floating button...');
        substackAI.showFloatingButton(selection);
    } else {
        console.log('❌ No text selected');
    }
};

window.forceFloatingButton = function() {
    console.log('🔥 FORCING FLOATING BUTTON TEST');
    
    // Create a fake selection-like object for testing
    const fakeSelection = {
        rangeCount: 1,
        getRangeAt: () => ({
            getBoundingClientRect: () => ({
                top: 100,
                left: 200,
                width: 100,
                height: 20
            })
        })
    };
    
    substackAI.selectedText = "Test selected text for debugging";
    substackAI.showFloatingButton(fakeSelection);
};

window.findEditors = function() {
    console.log('🔍 MANUAL EDITOR SEARCH CALLED');
    substackAI.findEditors();
};

window.forceEnhanceAll = function() {
    console.log('🔥 FORCE ENHANCE ALL ELEMENTS');
    const allElements = document.querySelectorAll('*');
    let enhanced = 0;
    
    allElements.forEach(el => {
        if (el.contentEditable === 'true' || 
            el.tagName === 'TEXTAREA' || 
            el.tagName === 'INPUT' ||
            el.getAttribute('role') === 'textbox') {
            console.log('🔥 Force enhancing:', el.tagName, el.className);
            substackAI.enhanceEditor(el);
            enhanced++;
        }
    });
    
    console.log(`🔥 Force enhanced ${enhanced} elements`);
};

console.log('✅ SUBSTACK AI EXTENSION: Fully loaded! Type testSubstackAI() in console to test.');

// Test if this line executes
console.log('🧪 About to define test functions...');

// Simple test that should always work
window.simpleTest = function() {
    return 'Extension is working!';
};

console.log('🧪 Simple test function defined. Try: simpleTest()');
