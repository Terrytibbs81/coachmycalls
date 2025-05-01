const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for all routes (safe default for dev)
app.use(cors());
app.use(express.json());

// 🔹 Claude webhook endpoint
app.post("/vapi-webhook", async (req, res) => {
  const transcript = req.body.transcript;
  console.log("📥 Received transcript:", transcript);

  // Simulate Claude response (you can replace this with a real API call)
  const coaching = `Try slowing down and pausing more often when you speak.`;

  res.send(coaching);
});

// ✅ Root test route (optional)
app.get("/", (req, res) => {
  res.send("CoachMyCalls backend is running.");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
