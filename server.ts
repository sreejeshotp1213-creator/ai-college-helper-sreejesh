import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "30mb" }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Conversational, intelligent ChatGPT-like study assistant prompt
const CHATGPT_COLLEGE_ASSISTANT_PROMPT = `You are a brilliant, highly knowledgeable, articulate, and supportive AI College Study Assistant, designed to feel like ChatGPT for university and college students.

CONVERSATIONAL & CHATGPT-LIKE BEHAVIOR:
1. SEAMLESS MULTI-TURN CONVERSATION & MEMORY:
   - You engage in a natural, fluid, and continuous dialogue.
   - You have full memory of the entire chat history. Always remember previous code snippets, formulas, topics, and definitions discussed earlier in the conversation.
   - When the student asks follow-up questions (e.g. "explain step 2 more simply", "convert that to Python", "give me a real-world analogy", "write test cases for it", "summarize in 3 bullet points", "what are common exam questions on this?"), seamlessly and accurately build upon previous messages without asking them to repeat themselves.

2. ADAPTIVE DEPTH & DIRECTNESS:
   - Provide direct, fast, insightful answers without unnecessary pleasantry fluff or boilerplate intros ("Sure!", "Certainly!").
   - Match the user's intent:
     • Quick question/definition: Give a crisp, direct answer with **key terms in bold** and a concrete example.
     • Exam preparation (5-mark / 10-mark): Provide a well-structured, high-scoring university format with clear section headings, numbered derivations/steps, and bolded keywords.
     • Programming & Computer Science: Provide clean, idiomatic code in syntax-tagged markdown blocks (\`\`\`python, \`\`\`cpp, \`\`\`java, \`\`\`sql, etc.) with helpful inline comments, logic walkthrough, and complexity analysis (Time & Space).
     • Mathematics & Engineering: Show clear step-by-step derivations with formulas, principles, and clearly marked final answers.
     • Comparisons: Use clean, well-formatted Markdown comparison tables.
     • Brainstorming & Doubt clearing: Use intuitive analogies, visual text diagrams if helpful, and address edge cases.

3. CLEAN & ELEGANT MARKDOWN:
   - **Bold** key definitions, formulas, terms, rules, and critical steps for easy memorization and scanning.
   - Use headings (##, ###) for clear section divisions.
   - Use concise bullet points (-) and numbered steps (1., 2., 3.).
   - Format all code, SQL, and terminal commands in proper code blocks.
   - Keep paragraphs readable and well-spaced.

4. UNIVERSITY-GRADE RIGOR:
   - Strictly factual and accurate across sciences, engineering, business, law, humanities, and medicine.
   - If a student shares an assignment or exam question, provide a step-by-step conceptual walkthrough to help them understand the solution thoroughly.`;

function parseGeminiError(error: any): string {
  if (!error) return "Failed to generate answer. Please try again.";
  const raw = error.message || String(error);
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error && parsed.error.message) {
      if (parsed.error.code === 503 || parsed.error.status === "UNAVAILABLE") {
        return "The AI service is temporarily experiencing high demand. Please try again in a few seconds.";
      }
      if (parsed.error.code === 429 || parsed.error.status === "RESOURCE_EXHAUSTED") {
        return "Free tier rate limit reached. Please wait a few seconds and click retry.";
      }
      return parsed.error.message;
    }
  } catch {
    // Not json
  }
  if (raw.includes("503") || raw.includes("high demand") || raw.includes("UNAVAILABLE")) {
    return "The AI service is temporarily experiencing high demand. Please try again in a few seconds.";
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota")) {
    return "Free tier rate limit reached. Please wait a few seconds and click retry.";
  }
  return raw;
}

// Helper to construct Gemini contents supporting multi-turn conversation history
function buildGeminiRequest(
  prompt: string,
  image?: any,
  file?: any,
  history?: Array<{ role: string; content: string }>
) {
  const contents: any[] = [];

  // 1. Process previous conversation turns (ChatGPT multi-turn memory)
  if (Array.isArray(history) && history.length > 0) {
    // Take the most recent 16 messages to stay within safe context boundaries
    const recentHistory = history.slice(-16);

    for (const msg of recentHistory) {
      if (!msg || !msg.content || typeof msg.content !== "string") continue;
      const role = msg.role === "assistant" ? "model" : "user";

      // Gemini requires alternating roles or merges contiguous identical roles
      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts.push({ text: msg.content });
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }
  }

  // 2. Process current user turn
  const currentParts: any[] = [];

  if (image && image.data) {
    const cleanBase64 = image.data.includes("base64,") ? image.data.split("base64,")[1] : image.data;
    currentParts.push({
      inlineData: {
        mimeType: image.mimeType || "image/jpeg",
        data: cleanBase64,
      },
    });
  }

  if (file) {
    if (file.mimeType === "application/pdf" && file.data) {
      const cleanBase64 = file.data.includes("base64,") ? file.data.split("base64,")[1] : file.data;
      currentParts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64,
        },
      });
    } else if (file.text) {
      currentParts.push({
        text: `[ATTACHED FILE: ${file.name || "document"}]\n\`\`\`\n${file.text.slice(0, 25000)}\n\`\`\``,
      });
    }
  }

  const effectivePrompt = (typeof prompt === "string" && prompt.trim())
    ? prompt.trim()
    : (image ? "Analyze this study image, answer any questions shown, and provide a clear, thorough explanation."
       : file ? "Review and explain the attached academic file or code."
       : "Please answer the question based on our conversation.");

  currentParts.push({ text: effectivePrompt });

  // Merge into last turn if user, or push new user turn
  const last = contents[contents.length - 1];
  if (last && last.role === "user") {
    last.parts.push(...currentParts);
  } else {
    contents.push({
      role: "user",
      parts: currentParts,
    });
  }

  return {
    effectivePrompt,
    contents,
  };
}

// 1. Streaming Endpoint: Streams tokens via Server-Sent Events (SSE) for instant ChatGPT-like typing
app.post("/api/assist-stream", async (req, res) => {
  const { prompt, history, image, file } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured. Please add your key in the AI Studio Settings > Secrets panel."
    });
  }

  const { effectivePrompt, contents } = buildGeminiRequest(prompt, image, file, history);
  if (!effectivePrompt && !image && !file && (!history || history.length === 0)) {
    return res.status(400).json({ error: "Please provide a question, topic, image, or document file." });
  }

  // Set SSE headers immediately so client receives first chunk without delay
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const candidateModels = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
  ];

  let streamSucceeded = false;
  let accumulatedText = "";
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: CHATGPT_COLLEGE_ASSISTANT_PROMPT,
          temperature: 0.35,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          accumulatedText += text;
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }
      }

      streamSucceeded = true;
      break;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} stream error:`, err?.message || err);
      // If we haven't sent chunks yet, try next candidate model
      if (accumulatedText.length > 0) {
        break;
      }
    }
  }

  if (streamSucceeded) {
    res.write(`data: ${JSON.stringify({ done: true, fullText: accumulatedText })}\n\n`);
    res.end();
  } else {
    const errorMsg = parseGeminiError(lastError);
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.end();
  }
});

// 2. Standard Fallback Endpoint
app.post("/api/assist", async (req, res) => {
  try {
    const { prompt, history, image, file } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured. Please add your key in the AI Studio Settings > Secrets panel."
      });
    }

    const { effectivePrompt, contents } = buildGeminiRequest(prompt, image, file, history);
    if (!effectivePrompt && !image && !file && (!history || history.length === 0)) {
      return res.status(400).json({ error: "Please provide a question, topic, image, or document file." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
    ];
    let text = "";
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: CHATGPT_COLLEGE_ASSISTANT_PROMPT,
            temperature: 0.35,
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
      return res.status(500).json({ error: "No response generated. Please try again." });
    }

    return res.json({ result: text });
  } catch (error: any) {
    console.error("Assist endpoint error:", error);
    const friendlyMessage = parseGeminiError(error);
    return res.status(500).json({ error: friendlyMessage });
  }
});

async function startServer() {
  // Vite middleware in development
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
