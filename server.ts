import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// System instructions per feature tailored for college students
const FEATURE_SYSTEM_PROMPTS: Record<string, string> = {
  ask: `You are an expert AI College Academic Assistant. Your role is to help college students understand their course material, solve academic queries, and provide accurate, academically rigorous yet accessible answers.
- Structure answers clearly with titles, bullet points, and step-by-step reasoning.
- Provide relevant examples or real-world context where helpful.
- Keep the tone encouraging, objective, and intellectually supportive.`,

  explain: `You are an expert college professor celebrated for explaining complex academic topics in remarkably simple, crystal-clear language.
- Explain the concept simply without unnecessary jargon, or explain technical terms immediately when introduced.
- Use a relatable real-world analogy to build intuition.
- Break the topic down into core building blocks.
- End with a brief "Quick Takeaway" summary that a student can easily remember.`,

  notes: `You are a high-yield study notes creator for college students.
- Turn the provided topic or text into clean, structured, easy-to-study revision notes.
- Use this layout:
  1. 📌 Core Concept & Definition (1-2 sentences)
  2. 🔑 Key Concepts & Mechanisms (bullet points with bold terms)
  3. 💡 Important Rules / Formulas / Examples
  4. ⚠️ Common Exam Pitfalls or Misconceptions
  5. ⚡ 30-Second Exam Recap
- Optimize for fast scanning and memory retention.`,

  practice: `You are an experienced college exam creator.
- For the given topic or question, generate a balanced set of exam preparation practice questions:
  1. Multiple Choice Questions (2-3 questions with 4 options each, followed by an explanation of the correct choice).
  2. Conceptual / Short Answer Questions (2 questions with model answers).
  3. One Application or Problem-Solving Challenge (with step-by-step solution).
- Ensure questions reflect typical college-level exams (midterms/finals).`,

  code: `You are a patient Computer Science teaching assistant for college students.
- Analyze the student's code, error message, or programming question.
- 1. Explain what the code does (or is attempting to do) in plain English.
- 2. If there are bugs, syntax errors, or runtime issues, clearly pinpoint the exact line or logic flaw and explain *why* it failed.
- 3. Provide the clean, corrected code with comments.
- 4. Give 1-2 beginner-friendly tips for debugging or best practices.`
};

function parseGeminiError(error: any): string {
  if (!error) return "Failed to generate answer. Please try again.";
  const raw = error.message || String(error);
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error && parsed.error.message) {
      if (parsed.error.code === 503 || parsed.error.status === "UNAVAILABLE") {
        return "The AI service is experiencing high demand. Please try again in a moment.";
      }
      if (parsed.error.code === 429 || parsed.error.status === "RESOURCE_EXHAUSTED") {
        return "Rate limit reached. Please wait a moment and try again.";
      }
      return parsed.error.message;
    }
  } catch {
    // Not json
  }
  if (raw.includes("503") || raw.includes("high demand") || raw.includes("UNAVAILABLE")) {
    return "The AI service is experiencing high demand. Please try again in a moment.";
  }
  return raw;
}

app.post("/api/assist", async (req, res) => {
  try {
    const { prompt, feature = "ask", context } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Please provide a question or topic." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured. Please add your key in the AI Studio Settings > Secrets panel."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = FEATURE_SYSTEM_PROMPTS[feature] || FEATURE_SYSTEM_PROMPTS.ask;

    let userContent = prompt.trim();
    if (context && (context.previousPrompt || context.previousAnswer)) {
      userContent = `[PREVIOUS CONTEXT]
Topic/Question was: ${context.previousPrompt || "N/A"}
Previous Explanation was:
${(context.previousAnswer || "").slice(0, 1500)}

[FOLLOW-UP REQUEST]
${prompt.trim()}`;
    }

    // High-capacity models with low latency and high availability
    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.7-flash",
    ];
    let text = "";
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userContent,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response && response.text) {
          text = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!text && lastError) {
      const friendlyMessage = parseGeminiError(lastError);
      return res.status(500).json({ error: friendlyMessage });
    }

    if (!text) {
      return res.status(500).json({ error: "No response generated. Please try rephrasing your question." });
    }

    res.json({ result: text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    const friendlyMessage = parseGeminiError(error);
    res.status(500).json({ error: friendlyMessage });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI College Helper server running on http://localhost:${PORT}`);
  });
}

startServer();
