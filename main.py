"""
main.py - Entry point for Maya Girlfriend English Coach (Console Mode)

Run this file to start the conversation:
    python main.py

Requirements:
    pip install google-generativeai

Setup:
    1. Get your Gemini API key from https://aistudio.google.com/app/apikey
    2. Either:
       a) Set environment variable: export GEMINI_API_KEY="your_key_here"
       b) OR edit core/config.py and replace YOUR_GEMINI_API_KEY_HERE
"""

import sys
import os

# Force UTF-8 encoding for stdout and stderr to prevent UnicodeEncodeError on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Add project root to path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.config import GEMINI_API_KEY
from core.maya_engine import MayaEngine
from utils.display import (
    print_welcome,
    print_maya,
    print_user_prompt,
    print_system,
    print_separator,
)


def check_api_key():
    """Validate that API key is set before starting."""
    if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE" or not GEMINI_API_KEY:
        print("\n❌ ERROR: Gemini API key not set!")
        print("\nTo fix this:")
        print("  Option 1: Set environment variable")
        print("            export GEMINI_API_KEY='your_key_here'  (Mac/Linux)")
        print("            set GEMINI_API_KEY=your_key_here       (Windows)")
        print("\n  Option 2: Edit core/config.py")
        print("            Replace YOUR_GEMINI_API_KEY_HERE with your actual key")
        print("\nGet your free API key at: https://aistudio.google.com/app/apikey\n")
        sys.exit(1)


def run_console_app():
    """Main console application loop."""

    # Step 1: Check API key
    check_api_key()

    # Step 2: Show welcome screen
    print_welcome()

    # Step 3: Initialize Maya engine
    print_system("Connecting to Gemini API...")
    try:
        maya = MayaEngine()
    except Exception as e:
        print(f"\n❌ Failed to initialize Maya: {e}")
        print("Please check your API key and internet connection.\n")
        sys.exit(1)

    # Step 4: Maya fires the first message
    print_system("Maya is ready. Starting conversation...")
    print_separator()

    opening = maya.start_conversation()
    print_maya(opening)

    # Step 5: Main conversation loop
    while maya.is_running:
        try:
            # Get user input
            print_user_prompt()
            user_input = input().strip()

            # Process input and get Maya's response
            response, should_continue = maya.process_user_input(user_input)

            # Display Maya's response
            print_maya(response)

            # Check if session should end
            if not should_continue:
                maya.is_running = False

        except KeyboardInterrupt:
            # Handle Ctrl+C gracefully
            print_maya("Fine! You are leaving without even saying goodbye! Typical!")
            maya.is_running = False

        except EOFError:
            # Handle end of input stream
            maya.is_running = False

    # Step 6: Show session summary
    print_separator()
    maya.end_session()
    print_system("Session ended. Practice again tomorrow!")


if __name__ == "__main__":
    run_console_app()
