"""
Display helpers for colored, formatted console output.
"""

from core.config import COLORS, APP_NAME, APP_VERSION


def print_maya(message: str):
    """Print Maya's dialogue in red (angry girlfriend color)."""
    c = COLORS
    print(f"\n{c['bold']}{c['maya']}💢 Maya:{c['reset']} {c['maya']}{message}{c['reset']}\n")


def print_user_prompt():
    """Print the user input prompt."""
    c = COLORS
    print(f"{c['bold']}{c['user']}👤 You:{c['reset']} ", end="", flush=True)


def print_system(message: str):
    """Print system/status messages in yellow."""
    c = COLORS
    print(f"\n{c['system']}[{message}]{c['reset']}")


def print_coach(message: str):
    """Print English coaching tips in green."""
    c = COLORS
    print(f"\n{c['bold']}{c['coach']}💡 Coach tip: {message}{c['reset']}\n")


def print_separator():
    """Print a visual separator line."""
    print(f"\n{'─' * 60}\n")


def print_welcome():
    """Print the welcome screen."""
    c = COLORS
    print(f"""
{c['bold']}{c['maya']}
╔══════════════════════════════════════════════════════════╗
║          💬 GIRLFRIEND ENGLISH COACH - MAYA             ║
║                   Version {APP_VERSION}                         ║
╚══════════════════════════════════════════════════════════╝
{c['reset']}
{c['system']}HOW THIS WORKS:{c['reset']}
  • Maya (your girlfriend) will SCOLD you in simple English
  • You must RESPOND to her questions in English
  • She will CORRECT your grammar gently
  • This builds your English speaking confidence!

{c['coach']}USEFUL WORDS TO REMEMBER:{c['reset']}
  • Reasons  : because, since, due to
  • Apologies : I am sorry, I forgot, I did not know
  • Excuses   : I was busy, I had work, I was not feeling well
  • Promises  : I will, next time, I promise, it will not happen again

{c['system']}COMMANDS:{c['reset']}
  • Type your reply and press ENTER
  • Type 'help' if you don't know what to say
  • Type 'quit' to end the session
  • Type 'skip' to move to the next scenario

{c['bold']}{'─' * 60}{c['reset']}
{c['bold']}{c['maya']}Get ready... Maya is about to start!{c['reset']}
{'─' * 60}
""")
