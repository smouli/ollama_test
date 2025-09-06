// Ultra-simple test content script
console.log('🚀 SIMPLE TEST SCRIPT LOADED');

// Test basic functionality
window.testFunction = function() {
    console.log('✅ Test function works!');
    return 'Success!';
};

// Test selection detection
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 0) {
        console.log('🎯 TEXT SELECTED:', text.substring(0, 50));
        
        // Show floating button
        const button = document.createElement('div');
        button.innerHTML = '🤖';
        button.style.cssText = `
            position: fixed;
            top: 100px;
            right: 100px;
            width: 40px;
            height: 40px;
            background: blue;
            color: white;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        // Remove existing button
        const existing = document.querySelector('.test-ai-button');
        if (existing) existing.remove();
        
        button.className = 'test-ai-button';
        document.body.appendChild(button);
        
        // Auto-remove after 3 seconds
        setTimeout(() => button.remove(), 3000);
        
        console.log('🎈 Floating button added!');
    }
});

console.log('✅ SIMPLE TEST SCRIPT READY - Try: testFunction()');
console.log('🎯 Highlight any text to see floating button');
