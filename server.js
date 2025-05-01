require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const port = process.env.PORT || 3000;

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.options("/vapi-webhook", cors());

app.post("/vapi-webhook", cors(), async (req, res) => {
  const transcript = req.body.transcript;
  console.log("📥 Received transcript:", transcript);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: `Give feedback to help someone improve their speaking style. Here's what they said: "${transcript}"`
          }
        ]
      })
    });

    const data = await response.json();
    const coaching = data?.content?.[0]?.text || "No response from Claude.";
    console.log("💬 Claude says:", coaching);
    res.send(coaching);
  } catch (err) {
    console.error("❌ Claude API error:", err);
    res.status(500).send("Claude API error");
  }
});

app.get("/", (req, res) => {
  res.send("CoachMyCalls backend is running.");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});