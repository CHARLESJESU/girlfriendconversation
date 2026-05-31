# 💬 Maya - Girlfriend English Coach

A console-based English conversation practice app where "Maya" (your dramatically frustrated girlfriend) scolds you in simple English, forcing you to respond and practice real communication skills.

---

## 🗂️ Project Structure

```
girlfriend_english_coach/
│
├── main.py                        ← RUN THIS to start the app
│
├── requirements.txt               ← pip install -r requirements.txt
│
├── core/
│   ├── __init__.py
│   ├── config.py                  ← API key + all settings
│   └── maya_engine.py             ← Core Gemini AI chat logic
│
├── prompts/
│   ├── __init__.py
│   └── maya_system_prompt.py      ← Maya's personality & behavior prompt
│
├── utils/
│   ├── __init__.py
│   ├── display.py                 ← Colored console output helpers
│   └── logger.py                  ← Saves conversation to JSON logs
│
└── logs/                          ← Auto-saved session transcripts (JSON)
```

---

## ⚙️ Setup Instructions

### Step 1: Get Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Step 2: Set Your API Key

**Option A - Environment Variable (Recommended):**
```bash
# Mac / Linux
export GEMINI_API_KEY="your_actual_key_here"

# Windows CMD
set GEMINI_API_KEY=your_actual_key_here

# Windows PowerShell
$env:GEMINI_API_KEY="your_actual_key_here"
```

**Option B - Edit config file:**
Open `core/config.py` and replace:
```python
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"
```
with your actual key.

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the App
```bash
python main.py
```

---

## 🎮 How to Use

| What you type | What happens |
|--------------|--------------|
| Your answer in English | Maya reacts and continues |
| `help` | Maya gives you sentence starters |
| `skip` | Move to the next complaint scenario |
| `quit` | End the session (shows summary) |
| `Ctrl+C` | Force quit |

---

## 💡 Example Conversation

```
💢 Maya: I asked you to meet me at the beach at 3pm. It is 5pm now.
         I waited two hours! WHERE WERE YOU?

👤 You: I am sorry. I was busy with my work.

💢 Maya: "I was busy"? Every time it is work, work, work!
         You mean "I was busy AT work", not "with my work". 
         OK fine. But why did you not call me even once?

👤 You: I forgot to call. I am very sorry.

💢 Maya: Good sentence! But sorry is not enough!
         Next time, you will call me. Promise me right now!
```

## 🎙️ Real-time Voice Web App

We have built a premium, real-time voice-based web application served locally. It uses the **Gemini Multimodal Live API** (WebSockets) to let you converse with Maya entirely using your voice.

### Features:
1. **Full Voice Loop**: Maya scolds you via voice (`Kore` setting). You answer through your microphone.
2. **Real-time Visualizations**: Interactive pulsing avatar and voice visualizers based on audio states.
3. **Barge-in Support**: Interrupt Maya mid-speech, and she will stop and listen to you immediately!
4. **Live Grammar Coach Dashboard**: Text transcriptions and highlighted grammar correction tips on-screen.

### How to Run:
1. Make sure your API key is configured in `core/config.py`.
2. Start the local server:
   ```bash
   python server.py
   ```
3. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)
4. Click **Start Call with Maya**, allow microphone access, and start practicing!

---

## 📝 Session Logs

Every session is saved to the `logs/` folder as a JSON file:
```json
{
  "summary": {
    "total_turns": 12,
    "user_turns": 6,
    "grammar_corrections": 3
  },
  "conversation": [
    {"speaker": "maya", "message": "WHERE WERE YOU?"},
    {"speaker": "user", "message": "I was busy"}
  ]
}
```
Use these logs to review your mistakes later!
