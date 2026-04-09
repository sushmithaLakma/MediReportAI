import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { SYSTEM_PROMPT } from "./prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no extra dependency)
try {
  const envPath = resolve(__dirname, "../.env");
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    process.env[key.trim()] = rest.join("=").trim();
  }
} catch {}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.post("/api/generate", async (req, res) => {
  const { reportText } = req.body;

  if (!reportText) {
    return res.status(400).json({ error: "reportText is required" });
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured. Add your key to .env" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: reportText }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${err}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: "No response from Gemini" });
    }

    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error("Gemini API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MediReport API server running on http://localhost:${PORT}`);
});
