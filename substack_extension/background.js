// Minimal background script for Substack AI Writer Extension

console.log('🔧 Simple background script loaded');

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🎉 Extension installed:', details.reason);
    
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.sync.set({
            model: 'gemma3:1b',
            temperature: 0.7,
            maxTokens: 500,
            autoReplace: false,
            customPrompt: ''
        });
        console.log('📝 Default settings saved');
    }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Message received:', message.action);
    
    switch (message.action) {
        case 'ping':
            sendResponse({ success: true, pong: true });
            break;
            
        case 'test':
            console.log('🧪 Test message received');
            sendResponse({ success: true, message: 'Background script working!' });
            break;
            
        default:
            console.log('❓ Unknown message action:', message.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

console.log('✅ Background script ready!');
