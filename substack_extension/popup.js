// Popup script for Substack AI Writer Extension

class PopupController {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434';
        this.defaultModel = 'gemma3:1b';
        this.activeTab = null;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Popup initializing...');
        
        // Get active tab
        await this.getActiveTab();
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Check Ollama status
        await this.checkOllamaStatus();
        
        // Load models
        await this.loadModels();
        
        // Load settings
        this.loadSettings();
        
        console.log('✅ Popup ready!');
    }
    
    async getActiveTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        this.activeTab = tab;
        
        // Check if we're on Substack
        const isSubstack = tab.url.includes('substack.com');
        if (!isSubstack) {
            this.showMessage('This extension works on Substack sites', 'warning');
        }
    }
    
    setupEventListeners() {
        // Quick action buttons
        document.getElementById('improveBtn').addEventListener('click', () => {
            this.executeAction('improve');
        });
        
        document.getElementById('summarizeBtn').addEventListener('click', () => {
            this.executeAction('summarize');
        });
        
        document.getElementById('expandBtn').addEventListener('click', () => {
            this.executeAction('expand');
        });
        
        document.getElementById('customBtn').addEventListener('click', () => {
            this.executeAction('custom');
        });
        
        // Model selection
        document.getElementById('modelSelect').addEventListener('change', (e) => {
            this.saveSettings({ model: e.target.value });
        });
        
        // Settings toggle
        document.getElementById('settingsToggle').addEventListener('click', () => {
            this.toggleSettings();
        });
        
        // Temperature slider
        const tempSlider = document.getElementById('temperature');
        const tempValue = document.getElementById('tempValue');
        
        tempSlider.addEventListener('input', (e) => {
            tempValue.textContent = e.target.value;
            this.saveSettings({ temperature: parseFloat(e.target.value) });
        });
        
        // Max tokens
        document.getElementById('maxTokens').addEventListener('change', (e) => {
            this.saveSettings({ maxTokens: parseInt(e.target.value) });
        });
        
        // Auto replace checkbox
        document.getElementById('autoReplace').addEventListener('change', (e) => {
            this.saveSettings({ autoReplace: e.target.checked });
        });
        
        // Custom prompt textarea
        document.getElementById('customPrompt').addEventListener('input', (e) => {
            this.saveSettings({ customPrompt: e.target.value });
        });
    }
    
    async checkOllamaStatus() {
        const statusElement = document.getElementById('status');
        const dot = statusElement.querySelector('.dot');
        const text = statusElement.querySelector('span');
        
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                dot.className = 'dot online';
                text.textContent = 'Connected';
                return true;
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.error('Ollama connection failed:', error);
            dot.className = 'dot offline';
            text.textContent = 'Offline';
            this.showMessage('Ollama not available. Make sure it\'s running.', 'error');
            return false;
        }
    }
    
    async loadModels() {
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                const models = data.models || [];
                
                const modelSelect = document.getElementById('modelSelect');
                modelSelect.innerHTML = '';
                
                if (models.length === 0) {
                    modelSelect.innerHTML = '<option value="">No models available</option>';
                    this.showMessage('No models found. Run: ollama pull gemma3:1b', 'warning');
                    return;
                }
                
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = this.formatModelName(model.name);
                    modelSelect.appendChild(option);
                });
                
                // Set default or saved model
                const savedSettings = await this.getSettings();
                const selectedModel = savedSettings.model || this.defaultModel;
                
                if (models.find(m => m.name === selectedModel)) {
                    modelSelect.value = selectedModel;
                } else if (models.length > 0) {
                    modelSelect.value = models[0].name;
                }
            }
        } catch (error) {
            console.error('Failed to load models:', error);
        }
    }
    
    formatModelName(modelName) {
        // Make model names more readable
        const formats = {
            'gemma3:1b': 'Gemma 3 (1B) - Fast',
            'gemma2:2b': 'Gemma 2 (2B) - Fast',
            'llama3.2:3b': 'Llama 3.2 (3B) - Balanced',
            'mistral:7b': 'Mistral (7B) - Advanced',
            'codellama:7b': 'Code Llama (7B) - Code',
            'llama3.1:8b': 'Llama 3.1 (8B) - Advanced'
        };
        
        return formats[modelName] || modelName;
    }
    
    async executeAction(action) {
        if (!this.activeTab || !this.activeTab.url.includes('substack.com')) {
            this.showMessage('Please navigate to a Substack page', 'warning');
            return;
        }
        
        // Show loading
        this.showLoading(true);
        
        try {
            // Send message to content script
            const response = await chrome.tabs.sendMessage(this.activeTab.id, {
                action: 'executeAI',
                type: action,
                settings: await this.getSettings()
            });
            
            if (response && response.success) {
                this.showMessage('AI action completed!', 'success');
            } else {
                this.showMessage(response?.error || 'Action failed', 'error');
            }
        } catch (error) {
            console.error('Action failed:', error);
            this.showMessage('Failed to communicate with page', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    toggleSettings() {
        const settingsContent = document.getElementById('settingsContent');
        const chevron = document.querySelector('.chevron');
        
        const isOpen = settingsContent.classList.contains('open');
        
        if (isOpen) {
            settingsContent.classList.remove('open');
            chevron.classList.remove('open');
        } else {
            settingsContent.classList.add('open');
            chevron.classList.add('open');
        }
    }
    
    async getSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'model', 'temperature', 'maxTokens', 'autoReplace', 'customPrompt'
            ]);
            
            return {
                model: result.model || this.defaultModel,
                temperature: result.temperature || 0.7,
                maxTokens: result.maxTokens || 500,
                autoReplace: result.autoReplace || false,
                customPrompt: result.customPrompt || ''
            };
        } catch (error) {
            console.error('Failed to load settings:', error);
            return {
                model: this.defaultModel,
                temperature: 0.7,
                maxTokens: 500,
                autoReplace: false,
                customPrompt: ''
            };
        }
    }
    
    async saveSettings(newSettings) {
        try {
            await chrome.storage.sync.set(newSettings);
            console.log('Settings saved:', newSettings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    async loadSettings() {
        const settings = await this.getSettings();
        
        // Apply settings to UI
        document.getElementById('modelSelect').value = settings.model;
        document.getElementById('temperature').value = settings.temperature;
        document.getElementById('tempValue').textContent = settings.temperature;
        document.getElementById('maxTokens').value = settings.maxTokens;
        document.getElementById('autoReplace').checked = settings.autoReplace;
        document.getElementById('customPrompt').value = settings.customPrompt;
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    
    showMessage(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#ff4757' : type === 'warning' ? '#ffa502' : type === 'success' ? '#2ed573' : '#5352ed'};
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 200);
        }, 3000);
        
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
