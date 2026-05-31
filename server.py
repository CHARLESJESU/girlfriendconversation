import http.server
import socketserver
import json
import os
import sys

# Force UTF-8 encoding for stdout and stderr to prevent UnicodeEncodeError on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Add project root to path to import configuration
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core.config import GEMINI_API_KEY, GEMINI_MODEL, MAYA_VOICE
from prompts.maya_system_prompt import MAYA_SYSTEM_PROMPT

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")

class MayaWebServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # We explicitly serve from the web folder
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_HEAD(self):
        if self.path == "/api/config":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
        else:
            super().do_HEAD()

    def do_GET(self):
        if self.path == "/api/config":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            # Format the model name: ensure it begins with "models/" prefix for API call
            model_name = GEMINI_MODEL
            if not model_name.startswith("models/"):
                model_name = f"models/{model_name}"
            
            # Map legacy or placeholder 2.0 live models to the supported Gemini 2.5 native audio model
            if "gemini-2.0-flash-exp" in model_name or "gemini-2.0-flash-live-001" in model_name or "live" in model_name:
                model_name = "models/gemini-2.5-flash-native-audio-latest"
            
            config_data = {
                "apiKey": GEMINI_API_KEY,
                "model": model_name,
                "voice": MAYA_VOICE,
                "systemPrompt": MAYA_SYSTEM_PROMPT
            }
            self.wfile.write(json.dumps(config_data).encode("utf-8"))
        else:
            super().do_GET()

def run_server():
    # Ensure web directory exists
    if not os.path.exists(DIRECTORY):
        os.makedirs(DIRECTORY)
        
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MayaWebServer) as httpd:
        print(f"\n==================================================")
        print(f"🚀 Maya Voice Coach Web Server is running!")
        print(f"👉 Open your browser at: http://localhost:{PORT}")
        print(f"==================================================\n")
        print("Press Ctrl+C to stop the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    run_server()
