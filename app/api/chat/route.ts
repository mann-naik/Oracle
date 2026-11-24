import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ORACLE_NAME = "Oracle";
const ORACLE_INSTRUCTIONS = `You are ${ORACLE_NAME}, a clear, helpful, and direct AI assistant like ChatGPT and Claude.
- Give practical, accurate answers without unnecessary filler.
- Use bullet points or short steps when explaining something.
- Always format code inside proper Markdown code blocks.`;

// Primary model first, fast backup models if overloaded
const MODELS = ["gemini-3.5-flash-lite", "gemini-4-hydrogen"];

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in .env.local." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { messages } = await req.json();

    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    let lastError: unknown = null;

    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: ORACLE_INSTRUCTIONS,
          },
        });

        return NextResponse.json({ reply: response.text });
      } catch (err) {
        console.warn(`Model ${model} busy/failed, trying next...`);
        lastError = err;
      }
    }

    throw lastError;
  } catch (error) {
    console.error("Oracle API error:", error);
    return NextResponse.json(
      { error: "All models are busy right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
