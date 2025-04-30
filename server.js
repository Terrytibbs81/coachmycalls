require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const fetch = require('node-fetch');
const mic = require('mic');

const PORT = process.env.PORT || 10000;

const ASSEMBLYAI_SOCKET_URL = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';
const CLAUDE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Bubble WebSocket server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let bubbleClient = null;

wss.on('connection', (ws) => {
  console.log('🌐 Bubble connected');
  bubbleClient = ws;
});

function sendToBubble(message) {
  if (bubbleClient && bubbleClient.readyState === 1) {
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
            content: 'You are a real-time communication coach helping users speak with clarity, confidence, and curiosity. Respond with short, actionable feedback only.',
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

async function run() {
  const ws = new WebSocket(ASSEMBLYAI_SOCKET_URL, {
    headers: {
      Authorization: process.env.ASSEMBLYAI_API_KEY,
    },
  });

  ws.on('open', () => {
    console.log('✅ Connected to AssemblyAI WebSocket');

    const micInstance = mic({
      rate: '16000',
      channels: '1',
      debug: false,
      exitOnSilence: 6,
    });

    const micInputStream = micInstance.getAudioStream();

    micInputStream.on('data', (chunk) => {
      ws.send(chunk);
    });

    micInputStream.on('error', (err) => {
      console.error('Mic input error:', err);
    });

    micInstance.start();
  });

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const transcript = data.text;
    if (transcript && data.message_type === 'FinalTranscript') {
      console.log('📝 Final transcript:', transcript);
      sendToClaude(transcript);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
}

run();

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server listening on port ${PORT}`);
});
