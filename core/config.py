"""
Configuration settings for the Girlfriend English Coach app.
"""

import os

# ─────────────────────────────────────────────
# GEMINI API SETTINGS
# ─────────────────────────────────────────────

# Put your Gemini API key here OR set it as environment variable GEMINI_API_KEY
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")

# Model to use - gemini-2.0-flash is best for Live API voice
GEMINI_MODEL = "gemini-2.0-flash-live-001"

# Fallback text model (used when Live API is not available)
GEMINI_TEXT_MODEL = "gemini-2.0-flash"

# ─────────────────────────────────────────────
# VOICE SETTINGS (for Live API)
# ─────────────────────────────────────────────

# Maya's voice - Gemini Live API voice options:
# Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, Zephyr
MAYA_VOICE = "Kore"  # Kore sounds expressive and strong - good for Maya

# Audio format settings
AUDIO_SAMPLE_RATE = 16000   # 16kHz - standard for speech
AUDIO_CHANNELS = 1          # Mono
AUDIO_CHUNK_SIZE = 1024     # Buffer size

# ─────────────────────────────────────────────
# APP SETTINGS
# ─────────────────────────────────────────────

# How many rounds before moving to new scenario
ROUNDS_PER_SCENARIO = 3

# Log folder path
LOG_DIR = "logs"

# Console colors (for terminal display)
COLORS = {
    "maya": "\033[91m",    # Red - Maya speaking (angry!)
    "user": "\033[94m",    # Blue - User speaking
    "system": "\033[93m",  # Yellow - System messages
    "coach": "\033[92m",   # Green - English coaching tips
    "reset": "\033[0m",    # Reset color
    "bold": "\033[1m",     # Bold text
}

# App display settings
APP_NAME = "Maya - English Coach Girlfriend"
APP_VERSION = "1.0.0"
APP_MODE = "console"  # "console" or "voice" - start with console
