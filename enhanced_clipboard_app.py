#!/usr/bin/env python3
"""
Enhanced Desktop application with global hotkey and browser integration
Features:
- Global hotkey (Cmd+Shift+O) to instantly process clipboard
- Browser extension communication
- Domain-specific filtering
- Popup modal for quick interactions
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, simpledialog
import subprocess
import requests
import json
import threading
import time
from datetime import datetime
from typing import Optional, Dict, Any, Set
import re
import pynput
from pynput import keyboard
import tempfile
import os

class EnhancedClipboardOllamaApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Enhanced Clipboard to Ollama")
        self.root.geometry("900x700")
        self.root.minsize(700, 500)
        
        # Configuration
        self.ollama_url = "http://localhost:11434"
        self.default_model = "gemma3:1b"
        self.available_models = []
        
        # State variables
        self.last_clipboard_content = ""
        self.monitoring_clipboard = False
        self.hotkey_enabled = True
        self.allowed_domains: Set[str] = set()
        
        # Global hotkey listener
        self.hotkey_listener = None
        
        # Initialize UI
        self.create_ui()
        self.check_ollama_status()
        self.load_available_models()
        self.setup_global_hotkey()
        
        # Start clipboard monitoring
        self.start_clipboard_monitoring()
        
    def create_ui(self):
        """Create the enhanced user interface"""
        # Create notebook for tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Main tab
        self.main_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.main_frame, text="📋 Main")
        self.create_main_tab()
        
        # Settings tab
        self.settings_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.settings_frame, text="⚙️ Settings")
        self.create_settings_tab()
        
        # History tab
        self.history_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.history_frame, text="📜 History")
        self.create_history_tab()
        
    def create_main_tab(self):
        """Create the main application tab"""
        main_frame = ttk.Frame(self.main_frame, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Configure grid weights
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(2, weight=1)
        main_frame.rowconfigure(4, weight=1)
        
        # Title and hotkey info
        title_frame = ttk.Frame(main_frame)
        title_frame.grid(row=0, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        title_label = ttk.Label(title_frame, text="📋 Enhanced Clipboard to Ollama", 
                               font=("Arial", 16, "bold"))
        title_label.pack(side=tk.LEFT)
        
        hotkey_label = ttk.Label(title_frame, text="⌨️ Hotkey: Cmd+Shift+O", 
                                font=("Arial", 10), foreground="gray")
        hotkey_label.pack(side=tk.RIGHT)
        
        # Status frame
        status_frame = ttk.Frame(main_frame)
        status_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        status_frame.columnconfigure(1, weight=1)
        
        # Ollama status
        ttk.Label(status_frame, text="Ollama Status:").grid(row=0, column=0, sticky=tk.W)
        self.status_label = ttk.Label(status_frame, text="⏳ Checking...", 
                                     foreground="orange")
        self.status_label.grid(row=0, column=1, sticky=tk.W, padx=(10, 0))
        
        # Model selection
        ttk.Label(status_frame, text="Model:").grid(row=0, column=2, sticky=tk.W, padx=(20, 0))
        self.model_var = tk.StringVar(value=self.default_model)
        self.model_combo = ttk.Combobox(status_frame, textvariable=self.model_var, 
                                       state="readonly", width=15)
        self.model_combo.grid(row=0, column=3, sticky=tk.W, padx=(10, 0))
        
        # Clipboard content section
        content_frame = ttk.LabelFrame(main_frame, text="📋 Clipboard Content", padding="5")
        content_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        content_frame.columnconfigure(0, weight=1)
        content_frame.rowconfigure(0, weight=1)
        
        # Clipboard text area
        self.clipboard_text = scrolledtext.ScrolledText(content_frame, height=8, 
                                                       wrap=tk.WORD, state=tk.DISABLED)
        self.clipboard_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 5))
        
        # Clipboard control buttons
        clipboard_buttons = ttk.Frame(content_frame)
        clipboard_buttons.grid(row=1, column=0, sticky=tk.W)
        
        self.refresh_btn = ttk.Button(clipboard_buttons, text="🔄 Refresh", 
                                     command=self.refresh_clipboard)
        self.refresh_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        self.auto_monitor_var = tk.BooleanVar(value=True)
        self.auto_monitor_check = ttk.Checkbutton(clipboard_buttons, 
                                                 text="Auto-monitor",
                                                 variable=self.auto_monitor_var,
                                                 command=self.toggle_clipboard_monitoring)
        self.auto_monitor_check.pack(side=tk.LEFT, padx=(5, 0))
        
        self.quick_process_btn = ttk.Button(clipboard_buttons, text="⚡ Quick Process", 
                                           command=self.quick_process_clipboard)
        self.quick_process_btn.pack(side=tk.LEFT, padx=(10, 0))
        
        # Action buttons
        action_frame = ttk.Frame(main_frame)
        action_frame.grid(row=3, column=0, columnspan=3, pady=(0, 10))
        
        self.send_btn = ttk.Button(action_frame, text="🚀 Send to Ollama", 
                                  command=self.send_to_ollama, style="Accent.TButton")
        self.send_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.clear_btn = ttk.Button(action_frame, text="🗑️ Clear Response", 
                                   command=self.clear_response)
        self.clear_btn.pack(side=tk.LEFT)
        
        # Response section
        response_frame = ttk.LabelFrame(main_frame, text="🤖 Ollama Response", padding="5")
        response_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S))
        response_frame.columnconfigure(0, weight=1)
        response_frame.rowconfigure(0, weight=1)
        
        # Response text area
        self.response_text = scrolledtext.ScrolledText(response_frame, height=10, 
                                                      wrap=tk.WORD, state=tk.DISABLED)
        self.response_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure text widget tags for styling
        self.response_text.tag_configure("error", foreground="red")
        self.response_text.tag_configure("success", foreground="green")
        self.response_text.tag_configure("info", foreground="blue")
        
    def create_settings_tab(self):
        """Create the settings tab"""
        settings_frame = ttk.Frame(self.settings_frame, padding="10")
        settings_frame.pack(fill=tk.BOTH, expand=True)
        
        # Hotkey settings
        hotkey_frame = ttk.LabelFrame(settings_frame, text="⌨️ Global Hotkey", padding="10")
        hotkey_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.hotkey_enabled_var = tk.BooleanVar(value=self.hotkey_enabled)
        ttk.Checkbutton(hotkey_frame, text="Enable global hotkey (Cmd+Shift+O)", 
                       variable=self.hotkey_enabled_var,
                       command=self.toggle_hotkey).pack(anchor=tk.W)
        
        ttk.Label(hotkey_frame, text="Press the hotkey to instantly process clipboard content",
                 foreground="gray").pack(anchor=tk.W, pady=(5, 0))
        
        # Domain filtering
        domain_frame = ttk.LabelFrame(settings_frame, text="🌐 Domain Filtering", padding="10")
        domain_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        ttk.Label(domain_frame, text="Allowed domains (one per line):").pack(anchor=tk.W)
        
        self.domain_text = scrolledtext.ScrolledText(domain_frame, height=6, wrap=tk.WORD)
        self.domain_text.pack(fill=tk.BOTH, expand=True, pady=(5, 0))
        
        domain_buttons = ttk.Frame(domain_frame)
        domain_buttons.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Button(domain_buttons, text="💾 Save Domains", 
                  command=self.save_domains).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(domain_buttons, text="🔄 Load Domains", 
                  command=self.load_domains).pack(side=tk.LEFT)
        
        # Load existing domains
        self.load_domains()
        
    def create_history_tab(self):
        """Create the history tab"""
        history_frame = ttk.Frame(self.history_frame, padding="10")
        history_frame.pack(fill=tk.BOTH, expand=True)
        
        # History controls
        controls_frame = ttk.Frame(history_frame)
        controls_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(controls_frame, text="📜 Interaction History", 
                 font=("Arial", 14, "bold")).pack(side=tk.LEFT)
        
        ttk.Button(controls_frame, text="🗑️ Clear History", 
                  command=self.clear_history).pack(side=tk.RIGHT)
        
        # History text area
        self.history_text = scrolledtext.ScrolledText(history_frame, wrap=tk.WORD, 
                                                     state=tk.DISABLED)
        self.history_text.pack(fill=tk.BOTH, expand=True)
        
        # Configure history text tags
        self.history_text.tag_configure("timestamp", foreground="gray", font=("Arial", 9))
        self.history_text.tag_configure("user", foreground="blue", font=("Arial", 10, "bold"))
        self.history_text.tag_configure("assistant", foreground="green", font=("Arial", 10))
        
    def setup_global_hotkey(self):
        """Setup global hotkey listener"""
        def on_hotkey():
            if self.hotkey_enabled_var.get():
                self.root.after(0, self.quick_process_clipboard)
        
        def start_listener():
            try:
                with keyboard.GlobalHotKeys({
                    '<cmd>+<shift>+o': on_hotkey
                }) as listener:
                    self.hotkey_listener = listener
                    listener.join()
            except Exception as e:
                print(f"Hotkey setup error: {e}")
        
        if self.hotkey_enabled:
            threading.Thread(target=start_listener, daemon=True).start()
    
    def toggle_hotkey(self):
        """Toggle global hotkey on/off"""
        self.hotkey_enabled = self.hotkey_enabled_var.get()
        if not self.hotkey_enabled and self.hotkey_listener:
            self.hotkey_listener.stop()
    
    def quick_process_clipboard(self):
        """Quickly process clipboard content with a popup"""
        content = self.get_clipboard_content()
        if not content.strip():
            self.show_popup_message("Clipboard is empty", "warning")
            return
        
        # Check domain filtering if enabled
        if self.allowed_domains and not self.is_content_from_allowed_domain(content):
            return
        
        # Create popup window for quick processing
        popup = tk.Toplevel(self.root)
        popup.title("Quick Process Clipboard")
        popup.geometry("600x400")
        popup.transient(self.root)
        popup.grab_set()
        
        # Center popup
        popup.update_idletasks()
        x = (popup.winfo_screenwidth() // 2) - (popup.winfo_width() // 2)
        y = (popup.winfo_screenheight() // 2) - (popup.winfo_height() // 2)
        popup.geometry(f"600x400+{x}+{y}")
        
        # Popup content
        popup_frame = ttk.Frame(popup, padding="10")
        popup_frame.pack(fill=tk.BOTH, expand=True)
        popup_frame.columnconfigure(0, weight=1)
        popup_frame.rowconfigure(1, weight=1)
        popup_frame.rowconfigure(3, weight=1)
        
        # Content preview
        ttk.Label(popup_frame, text="📋 Clipboard Content:", font=("Arial", 12, "bold")).grid(
            row=0, column=0, sticky=tk.W, pady=(0, 5))
        
        content_preview = scrolledtext.ScrolledText(popup_frame, height=6, wrap=tk.WORD, 
                                                   state=tk.DISABLED)
        content_preview.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        content_preview.config(state=tk.NORMAL)
        content_preview.insert(1.0, content)
        content_preview.config(state=tk.DISABLED)
        
        # Action buttons
        button_frame = ttk.Frame(popup_frame)
        button_frame.grid(row=2, column=0, pady=(0, 10))
        
        def process_and_close():
            popup.destroy()
            self.update_clipboard_display(content)
            self.send_to_ollama()
        
        ttk.Button(button_frame, text="🚀 Process with Ollama", 
                  command=process_and_close).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="❌ Cancel", 
                  command=popup.destroy).pack(side=tk.LEFT)
        
        # Response area
        ttk.Label(popup_frame, text="🤖 Quick Response:", font=("Arial", 12, "bold")).grid(
            row=3, column=0, sticky=tk.W, pady=(10, 5))
        
        response_area = scrolledtext.ScrolledText(popup_frame, height=8, wrap=tk.WORD, 
                                                 state=tk.DISABLED)
        response_area.grid(row=4, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        popup.focus_set()
    
    def is_content_from_allowed_domain(self, content: str) -> bool:
        """Check if content appears to be from an allowed domain"""
        if not self.allowed_domains:
            return True
        
        # Simple heuristic: check if any allowed domain appears in the content
        for domain in self.allowed_domains:
            if domain.lower() in content.lower():
                return True
        return False
    
    def save_domains(self):
        """Save allowed domains to file"""
        domains_text = self.domain_text.get(1.0, tk.END).strip()
        domains = [d.strip() for d in domains_text.split('\n') if d.strip()]
        self.allowed_domains = set(domains)
        
        # Save to file
        try:
            with open('allowed_domains.txt', 'w') as f:
                f.write('\n'.join(domains))
            messagebox.showinfo("Success", f"Saved {len(domains)} domains")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save domains: {e}")
    
    def load_domains(self):
        """Load allowed domains from file"""
        try:
            if os.path.exists('allowed_domains.txt'):
                with open('allowed_domains.txt', 'r') as f:
                    domains = [line.strip() for line in f.readlines() if line.strip()]
                    self.allowed_domains = set(domains)
                    self.domain_text.delete(1.0, tk.END)
                    self.domain_text.insert(1.0, '\n'.join(domains))
        except Exception as e:
            print(f"Error loading domains: {e}")
    
    def add_to_history(self, user_content: str, assistant_response: str):
        """Add interaction to history"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        self.history_text.config(state=tk.NORMAL)
        
        # Add timestamp
        self.history_text.insert(tk.END, f"[{timestamp}]\n", "timestamp")
        
        # Add user content
        self.history_text.insert(tk.END, "User: ", "user")
        self.history_text.insert(tk.END, f"{user_content[:200]}...\n\n" if len(user_content) > 200 
                                 else f"{user_content}\n\n")
        
        # Add assistant response
        self.history_text.insert(tk.END, "Assistant: ", "assistant")
        self.history_text.insert(tk.END, f"{assistant_response}\n\n" + "="*50 + "\n\n")
        
        self.history_text.see(tk.END)
        self.history_text.config(state=tk.DISABLED)
    
    def clear_history(self):
        """Clear interaction history"""
        self.history_text.config(state=tk.NORMAL)
        self.history_text.delete(1.0, tk.END)
        self.history_text.config(state=tk.DISABLED)
    
    def show_popup_message(self, message: str, msg_type: str = "info"):
        """Show a temporary popup message"""
        if msg_type == "warning":
            messagebox.showwarning("Warning", message)
        elif msg_type == "error":
            messagebox.showerror("Error", message)
        else:
            messagebox.showinfo("Info", message)
    
    # Include all the original methods from the basic app
    def check_ollama_status(self):
        """Check if Ollama server is running"""
        def check():
            try:
                response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
                if response.status_code == 200:
                    self.root.after(0, lambda: self.update_status("✅ Connected", "green"))
                else:
                    self.root.after(0, lambda: self.update_status("❌ Error", "red"))
            except requests.exceptions.RequestException:
                self.root.after(0, lambda: self.update_status("❌ Disconnected", "red"))
        
        threading.Thread(target=check, daemon=True).start()
    
    def update_status(self, text: str, color: str):
        """Update the status label"""
        self.status_label.config(text=text, foreground=color)
    
    def load_available_models(self):
        """Load available models from Ollama"""
        def load():
            try:
                response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    models = [model["name"] for model in data.get("models", [])]
                    self.root.after(0, lambda: self.update_model_list(models))
            except requests.exceptions.RequestException:
                pass
        
        threading.Thread(target=load, daemon=True).start()
    
    def update_model_list(self, models: list):
        """Update the model combobox with available models"""
        self.available_models = models
        self.model_combo['values'] = models
        if models and self.default_model in models:
            self.model_var.set(self.default_model)
        elif models:
            self.model_var.set(models[0])
    
    def get_clipboard_content(self) -> str:
        """Get content from macOS clipboard using pbpaste"""
        try:
            result = subprocess.run(['pbpaste'], capture_output=True, text=True)
            return result.stdout
        except Exception as e:
            self.log_message(f"Error reading clipboard: {e}", "error")
            return ""
    
    def refresh_clipboard(self):
        """Manually refresh clipboard content"""
        content = self.get_clipboard_content()
        self.update_clipboard_display(content)
    
    def update_clipboard_display(self, content: str):
        """Update the clipboard display area"""
        self.clipboard_text.config(state=tk.NORMAL)
        self.clipboard_text.delete(1.0, tk.END)
        self.clipboard_text.insert(1.0, content)
        self.clipboard_text.config(state=tk.DISABLED)
        self.last_clipboard_content = content
    
    def start_clipboard_monitoring(self):
        """Start monitoring clipboard for changes"""
        def monitor():
            while True:
                if self.auto_monitor_var.get():
                    content = self.get_clipboard_content()
                    if content != self.last_clipboard_content and content.strip():
                        self.root.after(0, lambda c=content: self.update_clipboard_display(c))
                time.sleep(1)
        
        threading.Thread(target=monitor, daemon=True).start()
    
    def toggle_clipboard_monitoring(self):
        """Toggle clipboard monitoring on/off"""
        if self.auto_monitor_var.get():
            self.refresh_clipboard()
    
    def send_to_ollama(self):
        """Send clipboard content to Ollama API"""
        content = self.get_current_clipboard_content()
        if not content.strip():
            messagebox.showwarning("Warning", "Clipboard is empty or contains only whitespace.")
            return
        
        model = self.model_var.get()
        if not model:
            messagebox.showerror("Error", "No model selected.")
            return
        
        # Disable send button during processing
        self.send_btn.config(state=tk.DISABLED, text="⏳ Processing...")
        
        def process():
            try:
                messages = [{"role": "user", "content": content}]
                
                payload = {
                    "model": model,
                    "messages": messages,
                    "stream": False
                }
                
                response = requests.post(
                    f"{self.ollama_url}/api/chat",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=60
                )
                
                if response.status_code == 200:
                    data = response.json()
                    response_content = data["message"]["content"]
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
                    # Display response
                    self.root.after(0, lambda: self.display_response(
                        f"[{timestamp}] Response from {model}:\n\n{response_content}",
                        "success"
                    ))
                    
                    # Add to history
                    self.root.after(0, lambda: self.add_to_history(content, response_content))
                else:
                    error_msg = f"API Error: HTTP {response.status_code}"
                    self.root.after(0, lambda: self.display_response(error_msg, "error"))
                    
            except requests.exceptions.RequestException as e:
                error_msg = f"Network Error: {str(e)}"
                self.root.after(0, lambda: self.display_response(error_msg, "error"))
            except Exception as e:
                error_msg = f"Unexpected Error: {str(e)}"
                self.root.after(0, lambda: self.display_response(error_msg, "error"))
            finally:
                self.root.after(0, lambda: self.send_btn.config(state=tk.NORMAL, text="🚀 Send to Ollama"))
        
        threading.Thread(target=process, daemon=True).start()
    
    def get_current_clipboard_content(self) -> str:
        """Get current content from clipboard display"""
        self.clipboard_text.config(state=tk.NORMAL)
        content = self.clipboard_text.get(1.0, tk.END).strip()
        self.clipboard_text.config(state=tk.DISABLED)
        return content
    
    def display_response(self, message: str, tag: str = "info"):
        """Display response in the response text area"""
        self.response_text.config(state=tk.NORMAL)
        self.response_text.insert(tk.END, message + "\n\n")
        self.response_text.see(tk.END)
        self.response_text.config(state=tk.DISABLED)
    
    def clear_response(self):
        """Clear the response text area"""
        self.response_text.config(state=tk.NORMAL)
        self.response_text.delete(1.0, tk.END)
        self.response_text.config(state=tk.DISABLED)
    
    def log_message(self, message: str, tag: str = "info"):
        """Log a message to the response area"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.display_response(f"[{timestamp}] {message}", tag)
    
    def run(self):
        """Start the application"""
        # Center the window
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
        
        # Initial clipboard refresh
        self.refresh_clipboard()
        
        # Start the main loop
        self.root.mainloop()

def main():
    """Main entry point"""
    try:
        app = EnhancedClipboardOllamaApp()
        app.run()
    except KeyboardInterrupt:
        print("\nApplication terminated by user")
    except Exception as e:
        print(f"Application error: {e}")

if __name__ == "__main__":
    main()
