require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

const server = http.createServer(); // base HTTP server
const wss = new WebSocket.Server({ server }); // attach WebSocket server to it

let bubbleClient = null;

wss.on('connection', (ws) => {
  console.log('🌐 Bubble connected');
  bubbleClient = ws;
});

function sendToBubble(message) {
  if (bubbleClient && bubbleClient.readyState === WebSocket.OPEN) {
    bubbleClient.send(message);
  }
}

const ASSEMBLYAI_SOCKET_URL = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';
const CLAUDE_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
  sendToBubble(reply); // send to front-end
}

async function run() {
  const ws = new WebSocket(ASSEMBLYAI_SOCKET_URL, {
    headers: { Authorization: process.env.ASSEMBLYAI_API_KEY }
  });

  ws.on('open', () => {
    console.log('✅ Connected to AssemblyAI WebSocket');

    setTimeout(() => {
      const fakeTranscript = 'How do I introduce myself confidently in a business call?';
      sendToClaude(fakeTranscript);
    }, 2000);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
}

run();

server.listen(PORT, () => {
  console.log(`🛰️ Server listening on port ${PORT}`);
});
