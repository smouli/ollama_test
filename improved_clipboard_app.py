#!/usr/bin/env python3
"""
Improved UI version of clipboard to Ollama app
Better styling, layout, and user experience
"""

import tkinter as tk
from tkinter import messagebox, font
import subprocess
import requests
import threading
import time
import logging
import os
from datetime import datetime

class ImprovedClipboardApp:
    def __init__(self):
        print("🚀 Starting Improved Clipboard App...")
        
        # Create main window
        self.root = tk.Tk()
        self.root.title("📋 Clipboard to Ollama")
        self.root.geometry("800x700")
        self.root.configure(bg='#2b2b2b')  # Dark theme
        
        # Configure fonts
        self.title_font = font.Font(family="SF Pro Display", size=20, weight="bold")
        self.header_font = font.Font(family="SF Pro Display", size=12, weight="bold")
        self.body_font = font.Font(family="SF Pro Text", size=11)
        self.mono_font = font.Font(family="SF Mono", size=10)
        
        # Color scheme
        self.colors = {
            'bg': '#2b2b2b',           # Dark background
            'card': '#3c3c3c',         # Card background
            'accent': '#007AFF',       # Blue accent
            'success': '#34C759',      # Green
            'warning': '#FF9500',      # Orange
            'error': '#FF3B30',        # Red
            'text': '#ffffff',         # White text
            'text_secondary': '#8E8E93', # Gray text
            'input_bg': '#1c1c1e',     # Input background
            'button': '#48484a'        # Button background
        }
        
        # Configuration
        self.ollama_url = "http://localhost:11434"
        self.default_model = "gemma3:1b"
        self.last_clipboard_content = ""
        self.available_models = []
        self.auto_monitor = True
        
        # Setup logging
        self.setup_logging()
        
        # Create UI
        self.create_modern_ui()
        
        # Initial setup
        self.check_ollama_status()
        self.load_models()
        self.refresh_clipboard()
        
        # Start monitoring
        if self.auto_monitor:
            self.start_monitoring()
        
        print("✅ App ready!")
        
    def setup_logging(self):
        """Setup comprehensive logging for responses and interactions"""
        # Create logs directory if it doesn't exist
        logs_dir = "logs"
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir)
        
        # Setup main logger
        self.logger = logging.getLogger('ClipboardOllama')
        self.logger.setLevel(logging.INFO)
        
        # Clear any existing handlers
        self.logger.handlers.clear()
        
        # Create file handler for all logs
        log_file = os.path.join(logs_dir, f"clipboard_ollama_{datetime.now().strftime('%Y%m%d')}.log")
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        
        # Create response-specific handler
        response_file = os.path.join(logs_dir, f"ollama_responses_{datetime.now().strftime('%Y%m%d')}.log")
        self.response_handler = logging.FileHandler(response_file)
        self.response_handler.setLevel(logging.INFO)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        response_formatter = logging.Formatter(
            '%(asctime)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Set formatters
        file_handler.setFormatter(detailed_formatter)
        self.response_handler.setFormatter(response_formatter)
        
        # Add handlers
        self.logger.addHandler(file_handler)
        
        # Create separate logger for responses
        self.response_logger = logging.getLogger('OllamaResponses')
        self.response_logger.setLevel(logging.INFO)
        self.response_logger.handlers.clear()
        self.response_logger.addHandler(self.response_handler)
        
        self.logger.info("=== Clipboard to Ollama App Started ===")
        self.logger.info(f"Ollama URL: {self.ollama_url}")
        self.logger.info(f"Default Model: {self.default_model}")
        print(f"📝 Logging enabled - logs saved to {logs_dir}/")
        
    def create_modern_ui(self):
        """Create modern, clean UI"""
        # Main container with padding
        main_container = tk.Frame(self.root, bg=self.colors['bg'])
        main_container.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Header section
        self.create_header(main_container)
        
        # Status bar
        self.create_status_bar(main_container)
        
        # Clipboard section
        self.create_clipboard_section(main_container)
        
        # Control buttons
        self.create_control_buttons(main_container)
        
        # Response section
        self.create_response_section(main_container)
        
        print("✅ Modern UI created successfully")
        
    def create_header(self, parent):
        """Create header with title and model selection"""
        header_frame = tk.Frame(parent, bg=self.colors['bg'])
        header_frame.pack(fill=tk.X, pady=(0, 20))
        
        # Title
        title = tk.Label(header_frame, text="📋 Clipboard to Ollama", 
                        font=self.title_font, fg=self.colors['text'], 
                        bg=self.colors['bg'])
        title.pack(side=tk.LEFT)
        
        # Model selection on the right
        model_frame = tk.Frame(header_frame, bg=self.colors['bg'])
        model_frame.pack(side=tk.RIGHT)
        
        tk.Label(model_frame, text="Model:", font=self.header_font, 
                fg=self.colors['text'], bg=self.colors['bg']).pack(side=tk.LEFT, padx=(0, 8))
        
        self.model_var = tk.StringVar(value=self.default_model)
        self.model_menu = tk.OptionMenu(model_frame, self.model_var, self.default_model)
        self.model_menu.config(
            bg=self.colors['button'], fg=self.colors['text'], 
            activebackground=self.colors['accent'], activeforeground='white',
            highlightthickness=0, relief=tk.FLAT, font=self.body_font
        )
        self.model_menu.pack(side=tk.LEFT)
        
    def create_status_bar(self, parent):
        """Create status bar"""
        status_frame = tk.Frame(parent, bg=self.colors['card'], relief=tk.FLAT, bd=1)
        status_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Status indicator
        status_container = tk.Frame(status_frame, bg=self.colors['card'])
        status_container.pack(fill=tk.X, padx=15, pady=10)
        
        tk.Label(status_container, text="●", font=("Arial", 12), 
                fg=self.colors['success'], bg=self.colors['card']).pack(side=tk.LEFT)
        
        self.status_label = tk.Label(status_container, text="Starting...", 
                                   font=self.body_font, fg=self.colors['text'], 
                                   bg=self.colors['card'])
        self.status_label.pack(side=tk.LEFT, padx=(5, 0))
        
        # Auto-monitor toggle on the right
        self.auto_var = tk.BooleanVar(value=self.auto_monitor)
        self.auto_check = tk.Checkbutton(status_container, text="Auto-monitor clipboard", 
                                       variable=self.auto_var, font=self.body_font,
                                       fg=self.colors['text'], bg=self.colors['card'],
                                       selectcolor=self.colors['button'],
                                       activebackground=self.colors['card'],
                                       activeforeground=self.colors['text'],
                                       command=self.toggle_monitoring)
        self.auto_check.pack(side=tk.RIGHT)
        
    def create_clipboard_section(self, parent):
        """Create clipboard content section"""
        clipboard_frame = tk.Frame(parent, bg=self.colors['bg'])
        clipboard_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        # Section header
        header = tk.Frame(clipboard_frame, bg=self.colors['bg'])
        header.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(header, text="📋 Clipboard Content", font=self.header_font, 
                fg=self.colors['text'], bg=self.colors['bg']).pack(side=tk.LEFT)
        
        # Character count
        self.char_count_label = tk.Label(header, text="0 characters", 
                                       font=self.body_font, fg=self.colors['text_secondary'], 
                                       bg=self.colors['bg'])
        self.char_count_label.pack(side=tk.RIGHT)
        
        # Text area with modern styling
        text_container = tk.Frame(clipboard_frame, bg=self.colors['input_bg'], relief=tk.FLAT, bd=1)
        text_container.pack(fill=tk.BOTH, expand=True)
        
        # Create text widget with scrollbar
        text_frame = tk.Frame(text_container, bg=self.colors['input_bg'])
        text_frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)
        
        self.clipboard_text = tk.Text(text_frame, font=self.mono_font, wrap=tk.WORD,
                                     bg=self.colors['input_bg'], fg=self.colors['text'],
                                     insertbackground=self.colors['accent'],
                                     selectbackground=self.colors['accent'],
                                     relief=tk.FLAT, bd=0, padx=15, pady=15)
        
        scrollbar = tk.Scrollbar(text_frame, orient=tk.VERTICAL, 
                               command=self.clipboard_text.yview,
                               bg=self.colors['button'], troughcolor=self.colors['input_bg'])
        self.clipboard_text.configure(yscrollcommand=scrollbar.set)
        
        self.clipboard_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Bind text change event for character count
        self.clipboard_text.bind('<KeyRelease>', self.update_char_count)
        self.clipboard_text.bind('<Button-1>', self.update_char_count)
        
    def create_control_buttons(self, parent):
        """Create control buttons"""
        button_frame = tk.Frame(parent, bg=self.colors['bg'])
        button_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Primary action button
        self.send_btn = self.create_button(button_frame, "🚀 Send to Ollama", 
                                         self.send_to_ollama, 
                                         bg=self.colors['accent'], fg='white', 
                                         primary=True)
        self.send_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # Secondary buttons
        self.refresh_btn = self.create_button(button_frame, "🔄 Refresh", 
                                            self.refresh_clipboard,
                                            bg=self.colors['button'])
        self.refresh_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.clear_btn = self.create_button(button_frame, "🗑️ Clear Response", 
                                          self.clear_response,
                                          bg=self.colors['button'])
        self.clear_btn.pack(side=tk.LEFT)
        
    def create_button(self, parent, text, command, bg=None, fg=None, primary=False):
        """Create styled button"""
        bg = bg or self.colors['button']
        fg = fg or self.colors['text']
        
        btn = tk.Button(parent, text=text, command=command,
                       font=self.header_font if primary else self.body_font,
                       bg=bg, fg=fg, relief=tk.FLAT, bd=0,
                       padx=20, pady=12 if primary else 8,
                       cursor='hand2')
        
        # Hover effects
        def on_enter(e):
            if primary:
                btn.config(bg='#0056CC')  # Darker blue
            else:
                btn.config(bg='#5a5a5a')  # Lighter gray
                
        def on_leave(e):
            btn.config(bg=bg)
            
        btn.bind("<Enter>", on_enter)
        btn.bind("<Leave>", on_leave)
        
        return btn
        
    def create_response_section(self, parent):
        """Create response section"""
        response_frame = tk.Frame(parent, bg=self.colors['bg'])
        response_frame.pack(fill=tk.BOTH, expand=True)
        
        # Section header
        header = tk.Frame(response_frame, bg=self.colors['bg'])
        header.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(header, text="🤖 Ollama Response", font=self.header_font, 
                fg=self.colors['text'], bg=self.colors['bg']).pack(side=tk.LEFT)
        
        # Response timestamp
        self.response_time_label = tk.Label(header, text="", font=self.body_font, 
                                          fg=self.colors['text_secondary'], 
                                          bg=self.colors['bg'])
        self.response_time_label.pack(side=tk.RIGHT)
        
        # Text area
        text_container = tk.Frame(response_frame, bg=self.colors['input_bg'], relief=tk.FLAT, bd=1)
        text_container.pack(fill=tk.BOTH, expand=True)
        
        text_frame = tk.Frame(text_container, bg=self.colors['input_bg'])
        text_frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)
        
        self.response_text = tk.Text(text_frame, font=self.body_font, wrap=tk.WORD,
                                   bg=self.colors['input_bg'], fg=self.colors['text'],
                                   relief=tk.FLAT, bd=0, padx=15, pady=15,
                                   state=tk.DISABLED)
        
        response_scrollbar = tk.Scrollbar(text_frame, orient=tk.VERTICAL, 
                                        command=self.response_text.yview,
                                        bg=self.colors['button'], 
                                        troughcolor=self.colors['input_bg'])
        self.response_text.configure(yscrollcommand=response_scrollbar.set)
        
        self.response_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        response_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
    def update_char_count(self, event=None):
        """Update character count"""
        content = self.clipboard_text.get(1.0, tk.END + '-1c')  # -1c to exclude final newline
        char_count = len(content)
        self.char_count_label.config(text=f"{char_count:,} characters")
        
    def check_ollama_status(self):
        """Check Ollama connection"""
        def check():
            try:
                response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
                if response.status_code == 200:
                    self.root.after(0, lambda: self.update_status("Connected to Ollama", "success"))
                else:
                    self.root.after(0, lambda: self.update_status("Ollama Error", "error"))
            except:
                self.root.after(0, lambda: self.update_status("Ollama Disconnected", "error"))
        
        threading.Thread(target=check, daemon=True).start()
        
    def load_models(self):
        """Load available models"""
        def load():
            try:
                response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    models = [model["name"] for model in data.get("models", [])]
                    self.root.after(0, lambda: self.update_models(models))
            except:
                pass
        
        threading.Thread(target=load, daemon=True).start()
        
    def update_models(self, models):
        """Update model dropdown"""
        self.available_models = models
        if models:
            menu = self.model_menu['menu']
            menu.delete(0, 'end')
            
            # Style the dropdown menu
            menu.config(bg=self.colors['button'], fg=self.colors['text'], 
                       activebackground=self.colors['accent'], 
                       activeforeground='white', relief=tk.FLAT, bd=0)
            
            for model in models:
                menu.add_command(label=model, command=tk._setit(self.model_var, model))
            
            if self.default_model in models:
                self.model_var.set(self.default_model)
            else:
                self.model_var.set(models[0])
        print(f"✅ Models loaded: {models}")
        
    def update_status(self, text, status_type="info"):
        """Update status with color coding"""
        color_map = {
            "success": self.colors['success'],
            "error": self.colors['error'],
            "warning": self.colors['warning'],
            "info": self.colors['text']
        }
        
        self.status_label.config(text=text, fg=color_map.get(status_type, self.colors['text']))
        print(f"📊 Status: {text}")
        
    def get_clipboard(self):
        """Get clipboard content using pbpaste"""
        try:
            result = subprocess.run(['pbpaste'], capture_output=True, text=True)
            return result.stdout
        except Exception as e:
            print(f"❌ Clipboard error: {e}")
            return ""
            
    def refresh_clipboard(self):
        """Manually refresh clipboard"""
        content = self.get_clipboard()
        self.update_clipboard_display(content)
        self.logger.info(f"Clipboard manually refreshed - {len(content)} characters")
        print(f"🔄 Clipboard refreshed: '{content[:50]}...'")
        
    def update_clipboard_display(self, content):
        """Update clipboard text area"""
        self.clipboard_text.delete(1.0, tk.END)
        self.clipboard_text.insert(1.0, content)
        self.last_clipboard_content = content
        self.update_char_count()
        
        # Log significant clipboard changes
        if len(content) > 10:  # Only log meaningful content
            self.logger.info(f"Clipboard updated - {len(content)} characters: '{content[:100]}{'...' if len(content) > 100 else ''}'")
        
    def start_monitoring(self):
        """Start clipboard monitoring"""
        def monitor():
            while True:
                if self.auto_var.get():
                    content = self.get_clipboard()
                    if content != self.last_clipboard_content and content.strip():
                        self.root.after(0, lambda c=content: self.update_clipboard_display(c))
                        print(f"📋 Clipboard changed: '{content[:30]}...'")
                time.sleep(1)
        
        threading.Thread(target=monitor, daemon=True).start()
        print("👁️ Clipboard monitoring started")
        
    def toggle_monitoring(self):
        """Toggle clipboard monitoring"""
        if self.auto_var.get():
            print("👁️ Monitoring enabled")
            self.refresh_clipboard()
        else:
            print("👁️ Monitoring disabled")
            
    def send_to_ollama(self):
        """Send clipboard content to Ollama"""
        content = self.clipboard_text.get(1.0, tk.END).strip()
        if not content:
            messagebox.showwarning("Warning", "No content to send!")
            return
            
        model = self.model_var.get()
        print(f"🚀 Sending to Ollama: {len(content)} chars with {model}")
        
        # Log the request
        self.logger.info(f"=== NEW OLLAMA REQUEST ===")
        self.logger.info(f"Model: {model}")
        self.logger.info(f"Content length: {len(content)} characters")
        self.logger.info(f"Content preview: '{content[:200]}{'...' if len(content) > 200 else ''}'")
        
        self.send_btn.config(state=tk.DISABLED, text="⏳ Processing...")
        self.update_status("Sending to Ollama...", "info")
        
        def send():
            try:
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": content}],
                    "stream": False
                }
                
                start_time = time.time()
                self.logger.info(f"Sending request to {self.ollama_url}/api/chat")
                
                response = requests.post(
                    f"{self.ollama_url}/api/chat",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=60
                )
                
                elapsed = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    ai_response = data["message"]["content"]
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    
                    # Log successful response
                    self.logger.info(f"✅ Response received in {elapsed:.1f}s")
                    self.logger.info(f"Response length: {len(ai_response)} characters")
                    
                    # Log full response in separate file
                    self.response_logger.info(f"=== REQUEST ===")
                    self.response_logger.info(f"Model: {model}")
                    self.response_logger.info(f"User Input ({len(content)} chars): {content}")
                    self.response_logger.info(f"=== RESPONSE ({elapsed:.1f}s) ===")
                    self.response_logger.info(f"Assistant ({len(ai_response)} chars): {ai_response}")
                    self.response_logger.info(f"{'='*50}")
                    
                    self.root.after(0, lambda: self.display_response(ai_response))
                    self.root.after(0, lambda: self.response_time_label.config(
                        text=f"Response at {timestamp} ({elapsed:.1f}s)"))
                    self.root.after(0, lambda: self.update_status("Response received", "success"))
                    print(f"✅ Got response: {len(ai_response)} chars in {elapsed:.1f}s")
                    print(f"🤖 Ollama Response Content:")
                    print(f"{'='*60}")
                    print(ai_response)
                    print(f"{'='*60}")
                else:
                    error = f"HTTP {response.status_code}"
                    self.logger.error(f"❌ Ollama request failed: {error}")
                    self.logger.error(f"Response content: {response.text}")
                    
                    self.root.after(0, lambda: self.display_response(f"Error: {error}"))
                    self.root.after(0, lambda: self.update_status(error, "error"))
                    
            except Exception as e:
                error = f"Error: {str(e)}"
                self.logger.error(f"❌ Request exception: {str(e)}")
                self.logger.error(f"Elapsed time: {time.time() - start_time:.1f}s")
                
                self.root.after(0, lambda: self.display_response(error))
                self.root.after(0, lambda: self.update_status(str(e), "error"))
                print(f"❌ Send failed: {e}")
            finally:
                self.root.after(0, lambda: self.send_btn.config(
                    state=tk.NORMAL, text="🚀 Send to Ollama"))
        
        threading.Thread(target=send, daemon=True).start()
        
    def display_response(self, text):
        """Display response in response area"""
        self.response_text.config(state=tk.NORMAL)
        self.response_text.delete(1.0, tk.END)
        self.response_text.insert(1.0, text)
        self.response_text.see(tk.END)
        self.response_text.config(state=tk.DISABLED)
        
    def clear_response(self):
        """Clear response area"""
        self.response_text.config(state=tk.NORMAL)
        self.response_text.delete(1.0, tk.END)
        self.response_text.config(state=tk.DISABLED)
        self.response_time_label.config(text="")
        print("🗑️ Response cleared")
        
    def run(self):
        """Start the app"""
        # Center window
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
        
        print("🎯 App window centered and ready")
        self.root.mainloop()

def main():
    print("🎬 Starting Improved Clipboard to Ollama App...")
    try:
        app = ImprovedClipboardApp()
        app.run()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
