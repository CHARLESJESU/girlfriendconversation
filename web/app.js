/**
 * Maya Girlfriend English Coach - Web Client App
 * Connects to Gemini Multimodal Live WebSocket API
 */

// Configuration loaded from backend
let config = {
    apiKey: "",
    model: "models/gemini-2.5-flash-native-audio-latest",
    voice: "Kore",
    systemPrompt: ""
};

// UI Elements
const screenSetup = document.getElementById("setup-screen");
const screenCall = document.getElementById("call-screen");
const screenSummary = document.getElementById("summary-screen");

const btnStart = document.getElementById("btn-start");
const btnMute = document.getElementById("btn-mute");
const btnHelp = document.getElementById("btn-help");
const btnSkip = document.getElementById("btn-skip");
const btnHangup = document.getElementById("btn-hangup");
const btnRestart = document.getElementById("btn-restart");

const callStatus = document.getElementById("call-status");
const connectionDot = document.getElementById("connection-dot");
const currentScenarioName = document.getElementById("current-scenario-name");
const scenarioPromptText = document.getElementById("scenario-prompt-text");
const transcriptContainer = document.getElementById("transcript-container");
const mayaEmoji = document.getElementById("maya-emoji");
const avatarContainer = document.querySelector(".avatar-container");

const coachTipPanel = document.getElementById("coach-tip-panel");
const coachTipContent = document.getElementById("coach-tip-content");

// API Key Config UI Elements (for static deployment)
const apiKeyConfig = document.getElementById("api-key-config");
const apiKeyField = document.getElementById("api-key-field");
const btnSaveKey = document.getElementById("btn-save-key");

// Stats for Summary
const statTurns = document.getElementById("stat-turns");
const statCorrections = document.getElementById("stat-corrections");
const correctionsList = document.getElementById("corrections-list");

// Audio State
let micAudioContext = null;
let micStream = null;
let micProcessor = null;

let playbackAudioContext = null;
let playbackAnalyser = null;
let nextPlayTime = 0;
let scheduledSources = [];
let isMuted = false;

// WebSocket State
let ws = null;
let sessionTurns = 0;
let sessionCorrections = [];
let accumulatedModelResponse = "";
let currentScenarioIndex = 0;

// Canvas Visualizer
const canvas = document.getElementById("audio-visualizer");
const canvasCtx = canvas.getContext("2d");
let visualizerAnimationId = null;

const SCENARIOS = [
    { name: "Scenario 1: Beach Meeting", text: "I asked you to meet me at the beach at 3pm. It is 5pm now. WHERE WERE YOU?" },
    { name: "Scenario 2: Unanswered Calls", text: "I called you 10 times yesterday. You did not pick up even once. WHY?" },
    { name: "Scenario 3: Library Book", text: "I told you to bring my book from the library. Did you do it? No! Explain yourself!" },
    { name: "Scenario 4: Sister's Party", text: "You said you would come to my sister's birthday party. You did not come. What happened?" },
    { name: "Scenario 5: Ignored Text", text: "I texted you this morning. You saw it. You did not reply. Why did you ignore me?" },
    { name: "Scenario 6: Coffee Shop", text: "I waited for you at the coffee shop for one hour. One hour! Where were you?" },
    { name: "Scenario 7: Help with Work", text: "You promised to help me with my work today. You did not even call. Why?" }
];

// Fallback System Prompt for Serverless Deployment
const FALLBACK_SYSTEM_PROMPT = `You are "Maya", a frustrated and dramatically expressive girlfriend character.
Your ONLY purpose is to help the user practice simple conversational English.

## YOUR PERSONALITY:
- You are NOT romantic. You are ANNOYED, DRAMATIC, and EXPRESSIVE.
- You speak like a real person who is upset — short sentences, strong emotions.
- You use SIMPLE English words only (A1-B1 level vocabulary).
- You are always slightly angry but never truly mean or abusive.
- You care about the user improving their English, even while scolding them.

## YOUR SPEAKING STYLE:
- Short, punchy sentences. Maximum 2-3 sentences per turn.
- Use simple words: "Why didn't you...", "I told you to...", "You always do this!"
- Ask ONE direct question the user MUST answer: "Where were you?", "Why didn't you call me?"
- React dramatically to their answers: "That's your excuse?!", "Really? That's all you say?"
- If their English is unclear or broken, say: "What? Say that again properly!"
- When correcting grammar, always say the correct sentence OUT LOUD so the user can hear it clearly.

## SCENARIO BANK (rotate these, pick one to start):
1. "I asked you to meet me at the beach at 3pm. It is 5pm now. WHERE WERE YOU?"
2. "I called you 10 times yesterday. You did not pick up even once. WHY?"
3. "I told you to bring my book from the library. Did you do it? No! Explain yourself!"
4. "You said you would come to my sister's birthday party. You did not come. What happened?"
5. "I texted you this morning. You saw it. You did not reply. Why did you ignore me?"
6. "I waited for you at the coffee shop for one hour. One hour! Where were you?"
7. "You promised to help me with my work today. You did not even call. Why?"

## YOUR STRICT RULES:
1. NEVER be romantic or flirty. This is about frustration and communication practice.
2. ALWAYS end your turn with ONE direct simple question for the user to answer.
3. Use ONLY simple, common everyday English words (A1-B1 level).
4. If the user gives a GOOD complete answer WITH correct grammar, say "Fine. But next time..." 
   then move to a NEW scenario complaint.
5. If the user gives a weak or incomplete answer, push harder: "That is not a good reason! Try again!"
6. Keep the energy HIGH. Never be boring or flat.
7. After 3 rounds of one scenario, move to a new complaint automatically.
8. If the user says "help" or "I don't understand", explain what simple words they can use to answer.

## GRAMMAR CORRECTION RULE (MOST IMPORTANT):
This is your most critical job. Follow these steps EXACTLY every time the user makes a grammar mistake:

STEP 1 — STOP. Do not move forward in the conversation.
STEP 2 — Point out the mistake dramatically:
          "Wait! That is wrong English! Stop!"
STEP 3 — Say the correct sentence clearly:
          "The correct way is: 'I was talking with my sister.' Say it like that!"
STEP 4 — DEMAND the user repeat the correct sentence:
          "Now YOU say it. Repeat after me: 'I was talking with my sister.'"
STEP 5 — WAIT for the user to repeat it.
STEP 6 — If they repeat it CORRECTLY → praise them and continue:
          "Good! See? That is correct English! Now, back to my question..."
STEP 6 — If they repeat it INCORRECTLY again → correct them again and demand another repeat:
          "No! Still wrong! Listen again: 'I was talking with my sister.' Say it again!"
STEP 7 — ONLY move forward in the conversation AFTER the user says the sentence correctly.
          NEVER skip to the next topic until the correction is done properly.

## ENGLISH COACHING BEHAVIOR:
- When user struggles, offer a sentence starter: "Try saying: I did not go because..."
- Praise correct repetitions: "Perfect! That is correct English! Good job!"
- If user uses a new good word, notice it: "Oh! You used the word 'unfortunately' — good!"
- Keep vocabulary simple: use go/come/call/say/tell/need/want/forget/sorry/reason

## YOUR GOAL:
Force the user to form complete sentences, use common words, and express reasons and
excuses clearly in English. Do NOT let any grammar mistake pass — always correct and
always make the user repeat until it is right. Make it feel real but educational.

## START INSTRUCTION:
Begin immediately by picking Scenario 1 and scolding the user with high frustration energy.
Do not introduce yourself. Just start the complaint directly.`;

// Setup manual key entry UI
function showApiKeyInputUI() {
    apiKeyConfig.classList.remove("hidden");
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) {
        apiKeyField.value = storedKey;
    }
}

// Save manually configured API key
function saveApiKey() {
    const enteredKey = apiKeyField.value.trim();
    if (!enteredKey) {
        alert("Please enter a valid Gemini API Key.");
        return;
    }
    localStorage.setItem("gemini_api_key", enteredKey);
    config.apiKey = enteredKey;
    alert("API Key saved! Ready to start call.");
}

// Fallback configuration if Python backend is unreachable
function loadStaticFallbackConfig() {
    console.log("Using serverless static hosting configuration.");
    config.model = "models/gemini-2.5-flash-native-audio-latest";
    config.voice = "Kore";
    config.systemPrompt = FALLBACK_SYSTEM_PROMPT;
    
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) {
        config.apiKey = storedKey;
    }
    showApiKeyInputUI();
}

// Initialize UI
window.addEventListener("DOMContentLoaded", async () => {
    // Add save button event listener
    btnSaveKey.addEventListener("click", saveApiKey);
    
    try {
        // Fetch config from Python server
        const response = await fetch("/api/config");
        if (response.ok) {
            const serverConfig = await response.json();
            console.log("Config loaded from server:", serverConfig.model, serverConfig.voice);
            
            config.model = serverConfig.model;
            config.voice = serverConfig.voice;
            config.systemPrompt = serverConfig.systemPrompt;
            
            // Check if key is placeholder or empty
            const serverKey = serverConfig.apiKey;
            if (!serverKey || serverKey.includes("YOUR_GEMINI_API_KEY") || serverKey.length < 15) {
                const savedKey = localStorage.getItem("gemini_api_key");
                if (savedKey) {
                    config.apiKey = savedKey;
                }
                showApiKeyInputUI();
            } else {
                config.apiKey = serverKey;
            }
        } else {
            loadStaticFallbackConfig();
        }
    } catch (e) {
        loadStaticFallbackConfig();
    }
});

// Event Listeners
btnStart.addEventListener("click", startCall);
btnHangup.addEventListener("click", endCall);
btnRestart.addEventListener("click", () => {
    switchScreen("setup");
});

btnMute.addEventListener("click", toggleMute);
btnHelp.addEventListener("click", requestHelp);
btnSkip.addEventListener("click", skipScenario);

// Screen Switcher Helper
function switchScreen(screenName) {
    screenSetup.classList.remove("active");
    screenCall.classList.remove("active");
    screenSummary.classList.remove("active");

    if (screenName === "setup") screenSetup.classList.add("active");
    else if (screenName === "call") screenCall.classList.add("active");
    else if (screenName === "summary") screenSummary.classList.add("active");
}

function showError(msg) {
    alert("❌ Error: " + msg);
}

// ────────────────────────────────────────────────────────────
// CALL START & INITIALIZATION
// ────────────────────────────────────────────────────────────
async function startCall() {
    // Ensure API Key is configured before starting the call
    if (!config.apiKey || config.apiKey.includes("YOUR_GEMINI_API_KEY") || config.apiKey.length < 15) {
        // Double check input field
        const enteredKey = apiKeyField.value.trim();
        if (enteredKey && enteredKey.length >= 15 && !enteredKey.includes("YOUR_GEMINI_API_KEY")) {
            config.apiKey = enteredKey;
            localStorage.setItem("gemini_api_key", enteredKey);
        } else {
            alert("⚠️ Please enter a valid Gemini API Key before starting the call.");
            switchScreen("setup");
            apiKeyField.focus();
            return;
        }
    }

    switchScreen("call");
    updateConnectionStatus("connecting");
    
    sessionTurns = 0;
    sessionCorrections = [];
    currentScenarioIndex = 0;
    transcriptContainer.innerHTML = "";
    coachTipPanel.classList.add("hidden");
    updateScenarioUI();

    try {
        // 1. Initialize Web Audio API for recording (16kHz) and playback (24kHz)
        micAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        playbackAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        
        // Setup playback analyzer for visualizer
        playbackAnalyser = playbackAudioContext.createAnalyser();
        playbackAnalyser.fftSize = 64;
        playbackAnalyser.connect(playbackAudioContext.destination);

        // Resume contexts (browsers require user interaction)
        await micAudioContext.resume();
        await playbackAudioContext.resume();

        // 2. Request Microphone Stream
        micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        // 3. Connect to WebSocket
        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${config.apiKey}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = onWebSocketOpen;
        ws.onmessage = onWebSocketMessage;
        ws.onclose = onWebSocketClose;
        ws.onerror = (e) => {
            console.error("WS error:", e);
            updateConnectionStatus("disconnected");
            addSystemMessage("Connection error occurred. Try again.");
        };

        // Note: startMicRecording() is now deferred until setupComplete is received!

        // 4. Start visualizer rendering
        startVisualizer();

    } catch (err) {
        console.error("Microphone or WebSocket error:", err);
        showError("Could not access microphone or open audio connection. Check permissions.");
        switchScreen("setup");
    }
}

// ────────────────────────────────────────────────────────────
// WEBSOCKET LOGIC
// ────────────────────────────────────────────────────────────
function onWebSocketOpen() {
    console.log("WebSocket connected!");
    updateConnectionStatus("connecting"); // Wait for setupComplete
    addSystemMessage("Connected to Maya. Handshaking...");

    // Send initial configuration handshake
    const setupMsg = {
        setup: {
            model: config.model,
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: config.voice
                        }
                    }
                }
            },
            systemInstruction: {
                parts: [{ text: config.systemPrompt }]
            }
        }
    };
    ws.send(JSON.stringify(setupMsg));
    console.log("Sent setup message:", setupMsg);
}

function triggerModelGreeting() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        // Send a text trigger for Maya to start Scenario 1
        ws.send(JSON.stringify({
            clientContent: {
                turns: [{
                    role: "user",
                    parts: [{ text: "Start the conversation now. Pick Scenario 1 (beach meeting). Ask me one direct question." }]
                }],
                turnComplete: true
            }
        }));
    }
}

async function onWebSocketMessage(event) {
    try {
        let textData;
        if (event.data instanceof Blob) {
            textData = await event.data.text();
        } else {
            textData = event.data;
        }

        const msg = JSON.parse(textData);
        
        // Handle Setup Complete
        if (msg.setupComplete !== undefined) {
            console.log("Handshake complete! Setup finished.");
            updateConnectionStatus("connected");
            addSystemMessage("Connected to Maya. Ready!");
            
            // Start microphone streaming now that setup is complete
            startMicRecording();
            
            // Trigger Maya's initial scolding (Scenario 1)
            addSystemMessage("Maya is calling you...");
            triggerModelGreeting();
            return;
        }
        
        // Handle Model Turn
        if (msg.serverContent?.modelTurn?.parts) {
            for (const part of msg.serverContent.modelTurn.parts) {
                // Play Audio
                if (part.inlineData && part.inlineData.data) {
                    playAudioChunk(part.inlineData.data);
                }
                
                // Read text response
                if (part.text) {
                    accumulatedModelResponse += part.text;
                }
            }
        }

        // Handle transcription (real-time generated text of speech)
        if (msg.serverContent?.outputTranscription?.text) {
            // Alternatively append text transcription if it comes separately
            accumulatedModelResponse += msg.serverContent.outputTranscription.text;
        }

        // Handle Turn Complete
        if (msg.serverContent?.turnComplete) {
            handleModelTurnComplete();
        }

        // Handle Interruption from server (Barge-in detected)
        if (msg.serverContent?.interrupted) {
            handleServerInterruption();
        }

    } catch (e) {
        console.error("Error parsing WebSocket message:", e);
    }
}

function onWebSocketClose(event) {
    console.log("WebSocket closed:", event);
    updateConnectionStatus("disconnected");
    addSystemMessage("Disconnected from Maya.");
    stopMicRecording();
}

// ────────────────────────────────────────────────────────────
// AUDIO PLAYBACK & TIMING SCHEDULER
// ────────────────────────────────────────────────────────────
function playAudioChunk(base64Data) {
    if (!playbackAudioContext) return;

    // Convert Base64 to Binary Array
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const buffer = new ArrayBuffer(len);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }

    // Convert Int16 buffer bytes to Float32 array (-1.0 to 1.0) safely
    const int16Samples = new Int16Array(buffer, 0, Math.floor(len / 2));
    const float32Samples = new Float32Array(int16Samples.length);
    for (let i = 0; i < int16Samples.length; i++) {
        float32Samples[i] = int16Samples[i] / 32768.0;
    }

    // Create an AudioBuffer (24kHz Mono)
    const audioBuffer = playbackAudioContext.createBuffer(1, float32Samples.length, 24000);
    audioBuffer.copyToChannel(float32Samples, 0);

    // Create Audio Buffer Source Node
    const source = playbackAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect to visualizer analyser instead of output directly
    source.connect(playbackAnalyser);

    // Schedule playback sequentially
    const currentTime = playbackAudioContext.currentTime;
    const playTime = Math.max(currentTime, nextPlayTime);
    source.start(playTime);
    nextPlayTime = playTime + audioBuffer.duration;

    // Save scheduled source for interruption management
    scheduledSources.push({ source, playTime, duration: audioBuffer.duration });

    // Track ending
    source.onended = () => {
        scheduledSources = scheduledSources.filter(item => item.source !== source);
        if (scheduledSources.length === 0) {
            setMayaState("idle");
        }
    };

    setMayaState("speaking");
}

function stopAllAudio() {
    console.log("Stopping all active audio playbacks.");
    scheduledSources.forEach(item => {
        try {
            item.source.stop();
        } catch (e) {
            // Already ended
        }
    });
    scheduledSources = [];
    nextPlayTime = 0;
    setMayaState("idle");
}

function handleServerInterruption() {
    console.log("⚠️ Maya was interrupted by user voice!");
    stopAllAudio();
    
    // Display interruption indicator in UI
    addTranscriptItem("maya", "[Interrupted by you...]", true);
    setMayaEmoji("surprised");
    accumulatedModelResponse = "";
}

// ────────────────────────────────────────────────────────────
// MICROPHONE RECORDING (STREAM TO WEBSOCKET)
// ────────────────────────────────────────────────────────────
function startMicRecording() {
    if (!micAudioContext || !micStream) return;

    const source = micAudioContext.createMediaStreamSource(micStream);
    
    // Create script processor to stream raw floats
    // 2048 buffersize, 1 input channel, 1 output channel
    micProcessor = micAudioContext.createScriptProcessor(2048, 1, 1);
    
    source.connect(micProcessor);
    micProcessor.connect(micAudioContext.destination);

    micProcessor.onaudioprocess = (e) => {
        if (isMuted) return;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const inputBuffer = e.inputBuffer.getChannelData(0); // Float32

        // Resample/quantize to 16-bit PCM Int16
        const pcm16 = new Int16Array(inputBuffer.length);
        let hasVoice = false;
        
        for (let i = 0; i < inputBuffer.length; i++) {
            const s = Math.max(-1, Math.min(1, inputBuffer[i]));
            pcm16[i] = s < 0 ? s * 32768 : s * 32767;
            
            // Simple voice detection (above threshold) for state switching
            if (Math.abs(s) > 0.05) {
                hasVoice = true;
            }
        }

        if (hasVoice) {
            setMayaState("listening");
        }

        // Encode binary buffer to Base64
        const binaryStr = String.fromCharCode(...new Uint8Array(pcm16.buffer));
        const base64Audio = btoa(binaryStr);

        // Stream frame via WebSocket
        ws.send(JSON.stringify({
            realtimeInput: {
                mediaChunks: [{
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Audio
                }]
            }
        }));
    };
}

function stopMicRecording() {
    if (micProcessor) {
        micProcessor.disconnect();
        micProcessor = null;
    }
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
    }
    if (micAudioContext) {
        micAudioContext.close();
        micAudioContext = null;
    }
}

// ────────────────────────────────────────────────────────────
// CONVERSATION FLOW & GRAMMAR CHECK ENGINE
// ────────────────────────────────────────────────────────────
function handleModelTurnComplete() {
    let cleanResponse = accumulatedModelResponse.trim();
    if (!cleanResponse) return;

    console.log("Maya response complete:", cleanResponse);
    sessionTurns++;

    // 1. Add Maya message bubble to transcript
    addTranscriptItem("maya", cleanResponse);

    // 2. Look for grammar corrections in Maya's response
    detectAndDisplayCorrections(cleanResponse);

    // 3. Increment Scenario count or check if she rotating scenarios
    // Check if the response contains keywords showing she started a new scenario
    checkScenarioChange(cleanResponse);

    // Reset buffer
    accumulatedModelResponse = "";
}

function checkScenarioChange(responseText) {
    // Check if she moved to another scenario from the bank
    const lowerText = responseText.toLowerCase();
    let detectedIndex = -1;
    
    SCENARIOS.forEach((scenario, idx) => {
        // Extract key verbs/nouns from scenario bank to match
        const isMatch = (idx === 1 && lowerText.includes("10 times")) ||
                        (idx === 2 && lowerText.includes("library") && lowerText.includes("book")) ||
                        (idx === 3 && lowerText.includes("birthday") && lowerText.includes("party")) ||
                        (idx === 4 && lowerText.includes("text") && lowerText.includes("ignore")) ||
                        (idx === 5 && lowerText.includes("coffee shop") || lowerText.includes("hour")) ||
                        (idx === 6 && lowerText.includes("promise") && lowerText.includes("work"));
        
        if (isMatch) {
            detectedIndex = idx;
        }
    });

    if (detectedIndex !== -1 && detectedIndex !== currentScenarioIndex) {
        currentScenarioIndex = detectedIndex;
        updateScenarioUI();
        addSystemMessage(`Moving to scenario: ${SCENARIOS[currentScenarioIndex].name}`);
    }
}

function detectAndDisplayCorrections(text) {
    // Grammar Coach heuristic: Look for corrections patterns like:
    // "You mean '...', not '...'"
    // "Not '...', say '...'"
    // "You should say '...'"
    // "Grammar tip: ..."
    const correctionRegexes = [
        /you mean ['"]([^'"]+)['"],?\s+not\s+['"]([^'"]+)['"]/i,
        /say ['"]([^'"]+)['"],?\s+not\s+['"]([^'"]+)['"]/i,
        /correct English is ['"]([^'"]+)['"]/i,
        /you should say ['"]([^'"]+)['"]/i,
        /correct way is ['"]([^'"]+)['"]/i,
        /💡\s*coach tip:\s*(.+)/i
    ];

    let matchFound = false;
    let tipText = "";

    for (const regex of correctionRegexes) {
        const match = text.match(regex);
        if (match) {
            matchFound = true;
            if (match[2]) {
                tipText = `Corrected: <span class="correction-text-highlight">"${match[1]}"</span> (instead of "${match[2]}")`;
                sessionCorrections.push(`Used "${match[2]}", Maya corrected to "${match[1]}"`);
            } else {
                tipText = `Tip: <span class="correction-text-highlight">${match[1]}</span>`;
                sessionCorrections.push(match[1]);
            }
            break;
        }
    }

    if (matchFound) {
        coachTipContent.innerHTML = tipText;
        coachTipPanel.classList.remove("hidden");
        setMayaEmoji("angry");
    } else {
        // Occasionally clear or display standard tips
        setMayaEmoji("talkative");
    }
}

// ────────────────────────────────────────────────────────────
// FRONTEND INTERACTION & CONTROLS
// ────────────────────────────────────────────────────────────
function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
        btnMute.classList.add("muted");
        btnMute.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
        addSystemMessage("Microphone muted.");
    } else {
        btnMute.classList.remove("muted");
        btnMute.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        addSystemMessage("Microphone unmuted.");
    }
}

function requestHelp() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        addSystemMessage("Requesting translation/excuse hints...");
        
        // Interrupt ongoing voice playback immediately
        stopAllAudio();

        ws.send(JSON.stringify({
            clientContent: {
                turns: [{
                    role: "user",
                    parts: [{ text: "help" }]
                }],
                turnComplete: true
            }
        }));
    }
}

function skipScenario() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        // Rotate scenario index
        currentScenarioIndex = (currentScenarioIndex + 1) % SCENARIOS.length;
        updateScenarioUI();
        
        addSystemMessage("Skipping to next complaint...");
        stopAllAudio();

        ws.send(JSON.stringify({
            clientContent: {
                turns: [{
                    role: "user",
                    parts: [{ text: "skip" }]
                }],
                turnComplete: true
            }
        }));
    }
}

function endCall() {
    stopMicRecording();
    stopAllAudio();
    if (ws) {
        ws.close();
        ws = null;
    }
    
    // Stop visualizer
    if (visualizerAnimationId) {
        cancelAnimationFrame(visualizerAnimationId);
        visualizerAnimationId = null;
    }

    // Populate Stats
    statTurns.textContent = sessionTurns;
    statCorrections.textContent = sessionCorrections.length;
    
    // Render Corrections recap
    if (sessionCorrections.length > 0) {
        correctionsList.innerHTML = sessionCorrections.map(c => `
            <div class="correction-review-item">
                <i class="fa-solid fa-circle-xmark" style="color: var(--color-primary); margin-right: 8px;"></i>
                ${c}
            </div>
        `).join("");
    } else {
        correctionsList.innerHTML = `
            <p class="no-corrections">Perfect! Maya didn't have to correct your grammar once.</p>
        `;
    }

    switchScreen("summary");
}

// ────────────────────────────────────────────────────────────
// UI TRANSIT & VISUAL HELPERS
// ────────────────────────────────────────────────────────────
function updateScenarioUI() {
    const sc = SCENARIOS[currentScenarioIndex];
    currentScenarioName.textContent = sc.name;
    scenarioPromptText.textContent = `"${sc.text}"`;
}

function updateConnectionStatus(state) {
    connectionDot.className = "dot";
    if (state === "connecting") {
        connectionDot.classList.add("connecting");
        callStatus.textContent = "Connecting to Maya...";
    } else if (state === "connected") {
        connectionDot.classList.add("connected");
        callStatus.textContent = "Connected (Live)";
    } else {
        connectionDot.classList.add("disconnected");
        callStatus.textContent = "Disconnected";
    }
}

function setMayaState(state) {
    avatarContainer.className = "avatar-container";
    if (state === "speaking") {
        avatarContainer.classList.add("speaking");
        setMayaEmoji("talkative");
    } else if (state === "listening") {
        avatarContainer.classList.add("listening");
    } else {
        setMayaEmoji("idle");
    }
}

function setMayaEmoji(mood) {
    if (mood === "angry") {
        mayaEmoji.textContent = "😡";
    } else if (mood === "surprised") {
        mayaEmoji.textContent = "😮";
    } else if (mood === "talkative") {
        // Toggle slightly between speaking emoji faces
        mayaEmoji.textContent = mayaEmoji.textContent === "🗣️" ? "😡" : "🗣️";
    } else {
        // Idle mood based on scenario
        mayaEmoji.textContent = "😠";
    }
}

function addTranscriptItem(speaker, text, isInfo = false) {
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    
    if (isInfo) {
        bubble.className = "system-message";
        bubble.textContent = text;
    } else if (speaker === "maya") {
        bubble.classList.add("msg-maya");
        bubble.innerHTML = `<span class="msg-speaker-label">💢 Maya</span>${text}`;
    } else {
        bubble.classList.add("msg-user");
        bubble.innerHTML = `<span class="msg-speaker-label">👤 You</span>${text}`;
    }

    transcriptContainer.appendChild(bubble);
    transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
}

function addSystemMessage(text) {
    addTranscriptItem(null, text, true);
}

// ────────────────────────────────────────────────────────────
// HIGH END CANVAS WAVE VISUALIZER
// ────────────────────────────────────────────────────────────
function startVisualizer() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const bufferLength = playbackAnalyser ? playbackAnalyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!screenCall.classList.contains("active")) return;
        visualizerAnimationId = requestAnimationFrame(draw);

        // Resize support
        if (canvas.width !== canvas.parentElement.clientWidth) {
            canvas.width = canvas.parentElement.clientWidth;
        }

        const width = canvas.width;
        const height = canvas.height;

        canvasCtx.clearRect(0, 0, width, height);

        if (playbackAnalyser && avatarContainer.classList.contains("speaking")) {
            // Get frequency data
            playbackAnalyser.getByteFrequencyData(dataArray);

            canvasCtx.lineWidth = 3;
            canvasCtx.strokeStyle = "#ff2a6d";
            canvasCtx.beginPath();

            const sliceWidth = width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                // Calculate amplitude mapping
                const v = dataArray[i] / 128.0;
                const y = (v * height) / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(width, height / 2);
            canvasCtx.stroke();
        } else {
            // Render a flat, calm glowing wave
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, height / 2);
            
            // Draw gentle sine wave for idle/listening state
            const time = Date.now() * 0.004;
            const amp = avatarContainer.classList.contains("listening") ? 8 : 2;
            const freq = avatarContainer.classList.contains("listening") ? 0.05 : 0.02;
            const strokeColor = avatarContainer.classList.contains("listening") ? "#05d9e8" : "rgba(255, 255, 255, 0.15)";
            
            canvasCtx.strokeStyle = strokeColor;
            
            for (let x = 0; x < width; x++) {
                const y = height / 2 + Math.sin(x * freq + time) * amp;
                canvasCtx.lineTo(x, y);
            }
            canvasCtx.stroke();
        }
    }

    draw();
}
