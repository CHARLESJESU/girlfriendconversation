"""
Conversation logger - saves chat history for review and learning.
"""

import os
import json
from datetime import datetime
from core.config import LOG_DIR


def ensure_log_dir():
    """Create logs directory if it doesn't exist."""
    os.makedirs(LOG_DIR, exist_ok=True)


def get_log_filename():
    """Generate a unique log filename with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return os.path.join(LOG_DIR, f"session_{timestamp}.json")


class ConversationLogger:
    """Logs every conversation turn with timestamps."""

    def __init__(self):
        ensure_log_dir()
        self.log_file = get_log_filename()
        self.session_start = datetime.now().isoformat()
        self.turns = []
        self.corrections = []  # Track grammar corrections

    def log_turn(self, speaker: str, message: str):
        """Log a single conversation turn."""
        turn = {
            "timestamp": datetime.now().isoformat(),
            "speaker": speaker,  # "maya" or "user"
            "message": message,
        }
        self.turns.append(turn)
        self._save()

    def log_correction(self, wrong: str, correct: str):
        """Log a grammar correction made by Maya."""
        self.corrections.append({
            "timestamp": datetime.now().isoformat(),
            "wrong": wrong,
            "correct": correct,
        })
        self._save()

    def get_summary(self) -> dict:
        """Return session summary."""
        return {
            "session_start": self.session_start,
            "session_end": datetime.now().isoformat(),
            "total_turns": len(self.turns),
            "user_turns": sum(1 for t in self.turns if t["speaker"] == "user"),
            "grammar_corrections": len(self.corrections),
            "corrections_detail": self.corrections,
        }

    def _save(self):
        """Save current state to JSON file."""
        data = {
            "summary": self.get_summary(),
            "conversation": self.turns,
        }
        with open(self.log_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def print_session_summary(self):
        """Print a summary of the session to console."""
        summary = self.get_summary()
        print(f"\n{'='*50}")
        print("📊 SESSION SUMMARY")
        print(f"{'='*50}")
        print(f"Total conversation turns : {summary['total_turns']}")
        print(f"Your responses           : {summary['user_turns']}")
        print(f"Grammar corrections      : {summary['grammar_corrections']}")
        if self.corrections:
            print("\n📝 Grammar corrections this session:")
            for c in self.corrections:
                print(f"   ✗ Wrong  : {c['wrong']}")
                print(f"   ✓ Correct: {c['correct']}")
                print()
        print(f"Session saved to: {self.log_file}")
        print(f"{'='*50}\n")
