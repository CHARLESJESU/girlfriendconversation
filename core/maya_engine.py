"""
Gemini Chat Engine - handles all communication with Gemini API.
This is the TEXT-based console mode (Step 1).
Voice mode (Step 2) will be added later for Flutter integration.
"""

import google.generativeai as genai
from core.config import GEMINI_API_KEY, GEMINI_TEXT_MODEL
from prompts.maya_system_prompt import MAYA_SYSTEM_PROMPT
from utils.logger import ConversationLogger
from utils.display import print_maya, print_system, print_coach


class MayaEngine:
    """
    Manages the conversation with Maya using Gemini API.
    Handles chat history, grammar detection, and responses.
    """

    def __init__(self):
        # Configure Gemini API
        genai.configure(api_key=GEMINI_API_KEY)

        # Initialize the model
        self.model = genai.GenerativeModel(
            model_name=GEMINI_TEXT_MODEL,
            system_instruction=MAYA_SYSTEM_PROMPT,
        )

        # Start chat session (keeps full history automatically)
        self.chat = self.model.start_chat(history=[])

        # Logger
        self.logger = ConversationLogger()

        # Track conversation state
        self.round_count = 0
        self.is_running = True

        print_system(f"Maya initialized with model: {GEMINI_TEXT_MODEL}")

    def get_maya_response(self, user_input: str) -> str:
        """
        Send user input to Gemini and get Maya's response.
        
        Args:
            user_input: What the user typed
            
        Returns:
            Maya's response as a string
        """
        try:
            # Build the message with coaching instruction
            message = f"""
User said: "{user_input}"

Respond as Maya. Remember:
1. React to their answer with frustration or approval
2. If their English has grammar mistakes, correct ONE mistake gently 
3. End with a new question OR move to new scenario if answer was good
4. Keep response SHORT (2-4 sentences max)
5. Use ONLY simple A1-B1 English words
"""
            response = self.chat.send_message(message)
            return response.text.strip()

        except Exception as e:
            error_msg = str(e)
            if "API_KEY" in error_msg or "api_key" in error_msg:
                return "ERROR: Invalid API key. Please check your GEMINI_API_KEY in core/config.py"
            elif "quota" in error_msg.lower():
                return "ERROR: API quota exceeded. Please wait and try again."
            else:
                return f"ERROR: Could not connect to Gemini API. Details: {error_msg}"

    def start_conversation(self) -> str:
        """
        Start the conversation - Maya fires the first message.
        
        Returns:
            Maya's opening complaint
        """
        try:
            opening = self.chat.send_message(
                "Start the conversation now. Pick Scenario 1 (beach meeting). "
                "Be frustrated and dramatic. Ask one direct question. Keep it short."
            )
            return opening.text.strip()
        except Exception as e:
            # Fallback opening if API fails
            return (
                "I asked you to meet me at the beach at 3pm. "
                "It is now 5pm. I waited for two hours! "
                "WHERE WERE YOU? Tell me right now!"
            )

    def handle_help_request(self) -> str:
        """Give the user hints when they ask for help."""
        try:
            hint = self.chat.send_message(
                "The user said 'help'. They do not know what to say. "
                "Give them 2-3 simple sentence starters they can use to answer your last question. "
                "Use very simple English. Then ask the question again."
            )
            return hint.text.strip()
        except:
            return (
                "💡 Try using these sentences:\n"
                "   • 'I am sorry, I was busy because...'\n"
                "   • 'I forgot. I am very sorry.'\n"
                "   • 'I did not come because I had a problem.'\n\n"
                "Now tell me — WHERE WERE YOU?"
            )

    def handle_skip_request(self) -> str:
        """Move to the next scenario."""
        try:
            skip = self.chat.send_message(
                "The user wants to skip to the next scenario. "
                "Say one short angry line about their excuse being weak, "
                "then immediately start a NEW scenario complaint from your scenario bank. "
                "Pick a different scenario than the current one."
            )
            return skip.text.strip()
        except:
            return (
                "Fine! We will talk about this later. "
                "But now — I called you 10 times yesterday! "
                "You did not pick up even once. WHY?"
            )

    def process_user_input(self, user_input: str) -> tuple[str, bool]:
        """
        Process user input and return Maya's response.
        
        Args:
            user_input: The user's typed message
            
        Returns:
            Tuple of (maya_response, should_continue)
        """
        user_input = user_input.strip()

        # Handle special commands
        if user_input.lower() in ["quit", "exit", "bye", "stop"]:
            farewell = "Fine! Go! You never have time for me anyway! Goodbye!"
            self.logger.log_turn("user", user_input)
            self.logger.log_turn("maya", farewell)
            return farewell, False

        if user_input.lower() == "help":
            response = self.handle_help_request()
            self.logger.log_turn("user", "help")
            self.logger.log_turn("maya", response)
            return response, True

        if user_input.lower() == "skip":
            response = self.handle_skip_request()
            self.logger.log_turn("user", "skip")
            self.logger.log_turn("maya", response)
            return response, True

        if not user_input:
            return "Say something! I am talking to you!", True

        # Normal conversation flow
        self.round_count += 1
        self.logger.log_turn("user", user_input)

        response = self.get_maya_response(user_input)
        self.logger.log_turn("maya", response)

        return response, True

    def end_session(self):
        """End the session and print summary."""
        self.logger.print_session_summary()
