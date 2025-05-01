const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// ✅ Global middleware
app.use(cors());
app.use(express.json());

// ✅ Preflight CORS handler for browser requests
app.options("/vapi-webhook", cors());

// ✅ Main Claude-like endpoint
app.post("/vapi-webhook", cors(), async (req, res) => {
  const transcript = req.body.transcript;
  console.log("📥 Received transcript:", transcript);

  // Simulate Claude coaching output
  const coaching = `Try slowing down and asking more questions when speaking.`;

  res.send(coaching);
});

// Optional health check
app.get("/", (req, res) => {
  res.send("CoachMyCalls backend is running.");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
git add server.js
git commit -m "Full CORS support for Deepgram Claude fetch"
git push origin main
