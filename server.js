require('dotenv').config();
const WebSocket = require('ws');
const fetch = require('node-fetch');
const http = require('http');
const mic = require('mic');

const ASSEMBLYAI_SOCKET_URL = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000`;
const CLAUDE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PORT = process.env.PORT || 10000;

let bubbleClient = null;

function sendToBubble(message) {
  if (bubbleClient && bubbleClient.readyState === WebSocket.OPEN) {
    bubbleClient.send(message);
  }
}

async function sendToClaude(text) {
  try {
    const response = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLAUDE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content:
              'You are a real-time communication coach helping users speak with clarity, confidence, and curiosity. Respond with short, actionable feedback only.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response';
    console.log('💬 Claude says:', reply);
    sendToBubble(reply);
  } catch (err) {
    console.error('Claude API error:', err);
  }
}

function startMicStream(ws) {
  const micInstance = mic({
    rate: '16000',
    channels: '1',
    debug: false,
    exitOnSilence: 6,
  });

  const micInputStream = micInstance.getAudioStream();

  micInputStream.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  micInputStream.on('error', (err) => {
    console.error('🎤 Mic error:', err);
  });

  micInputStream.on('silence', () => {
    console.log('🎙️ Mic silence detected');
  });

  micInstance.start();
}

// WebSocket Server to connect to Bubble
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🌐 Bubble connected');
  bubbleClient = ws;
});

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server listening on port ${PORT}`);
});

// Connect to AssemblyAI
function connectToAssemblyAI() {
  const ws = new WebSocket(ASSEMBLYAI_SOCKET_URL, {
    headers: {
      Authorization: process.env.ASSEMBLYAI_API_KEY,
    },
  });

  ws.on('open', () => {
    console.log('✅ Connected to AssemblyAI WebSocket');
    startMicStream(ws);
  });

  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    if (msg.text) {
      console.log('📝 Transcript:', msg.text);
      sendToClaude(msg.text);
    }
  });

  ws.on('error', (err) => {
    console.error('❌ AssemblyAI error:', err);
  });

  ws.on('close', () => {
    console.log('🔌 AssemblyAI connection closed, reconnecting in 5s...');
    setTimeout(connectToAssemblyAI, 5000);
  });
}

connectToAssemblyAI();
