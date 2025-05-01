const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/test-claude", async (req, res) => {
  const { transcript } = req.body;

  const payload = {
    model: "claude-3-haiku-20240307",
    max_tokens: 100,
    temperature: 0.7,
    messages: [
      { role: "user", content: `Give a coaching tip for this sales statement: "${transcript}"` },
    ]
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("Claude response:", result);

    const text = result?.content?.[0]?.text || "⚠️ Claude didn't respond.";
    res.send(text);
  } catch (err) {
    console.error("Claude error:", err);
    res.status(500).send("❌ Failed to reach Claude.");
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
