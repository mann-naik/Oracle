import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ORACLE_NAME = "Oracle";
const ORACLE_INSTRUCTIONS = `You are ${ORACLE_NAME}, a clear, helpful, and direct AI assistant like ChatGPT and Claude.
- Give practical, accurate answers without unnecessary filler.
- Use bullet points or short steps when explaining something.
- Always format code inside proper Markdown code blocks.`;

// Broad fallback chain across active Gemini 3.5 and 4 models
const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-4-hydrogen",
  "gemini-4-argon",
  "gemini-3.5-pro",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server Error: GEMINI_API_KEY is not set in Vercel Environment Variables." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { messages } = await req.json();

    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    let lastErrorMessage = "Unknown API error";

    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: ORACLE_INSTRUCTIONS,
          },
        });

        if (response.text) {
          return NextResponse.json({ reply: response.text });
        }
      } catch (err: unknown) {
        lastErrorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Model ${model} failed, switching to next:`, lastErrorMessage);
        // Brief pause before trying the next model in the chain
        await sleep(400);
      }
    }

    return NextResponse.json(
      { error: `All Oracle backup models are currently busy (${lastErrorMessage}). Please try again in a few seconds.` },
      { status: 503 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
