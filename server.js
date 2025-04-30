require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');

const ASSEMBLYAI_SOCKET_URL = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';
const CLAUDE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let bubbleClient = null;

// WebSocket connection to Bubble
wss.on('connection', (ws) => {
  console.log('🌐 Bubble connected');
  bubbleClient = ws;
});

// Sends message to connected Bubble client
function sendToBubble(message) {
  if (bubbleClient && bubbleClient.readyState === 1) {
    bubbleClient.send(message);
  }
}

// Sends transcript to Claude and gets coaching feedback
async function sendToClaude(text) {
  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CLAUDE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: 'You are a real-time communication coach helping users speak with clarity, confidence, and curiosity. Respond with short, actionable feedback only.'
        },
        {
          role: 'user',
          content: text
        }
      ]
    })
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || 'No response';
  console.log('💬 Claude says:', reply);
  sendToBubble(reply);
}

// Start the AssemblyAI WebSocket
async function run() {
  const ws = new WebSocket(ASSEMBLYAI_SOCKET_URL, {
    headers: {
      Authorization: process.env.ASSEMBLYAI_API_KEY
    }
  });

  ws.on('open', () => {
    console.log('✅ Connected to AssemblyAI WebSocket');

    // Simulate input for testing
    setTimeout(() => {
      const fakeTranscript = 'How do I introduce myself confidently in a business call?';
      sendToClaude(fakeTranscript);
    }, 2000);
  });

  ws.on('error', (err) => {
    console.error('❌ AssemblyAI error:', err);
  });
}

run();

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🛰️ Server listening on port ${PORT}`);
});

