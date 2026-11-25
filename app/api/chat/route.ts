import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ORACLE_NAME = "Oracle";
const ORACLE_INSTRUCTIONS = `You are ${ORACLE_NAME}, a clear, helpful, and direct AI assistant like ChatGPT and Claude.
- Give practical, accurate answers without unnecessary filler.
- Use bullet points or short steps when explaining something.
- Always format code inside proper Markdown code blocks.`;

const MODELS = ["gemini-3.5-flash-lite", "gemini-4-hydrogen", "gemini-3.8-flash"];

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
      for (let attempt = 1; attempt <= 2; attempt++) {
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
          console.warn(`Model ${model} (attempt ${attempt}) failed:`, lastErrorMessage);
          if (attempt === 1) await sleep(1200);
        }
      }
    }

    return NextResponse.json(
      { error: `Oracle API Error: ${lastErrorMessage}` },
      { status: 500 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
