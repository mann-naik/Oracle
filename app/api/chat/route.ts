import { GoogleGenAI } from "@google/genai";

const DEFAULT_INSTRUCTIONS = `You are Oracle, a clear, helpful, and direct AI assistant.
- Give practical, accurate answers without unnecessary filler.
- Use bullet points or short steps when explaining something.
- Always format code inside proper Markdown fenced code blocks with language tags.`;

const MODEL_TIERS: Record<string, string[]> = {
  lite: ["gemini-3.5-flash-lite", "gemini-4-hydrogen", "gemini-4-argon"],
  pro: ["gemini-4-hydrogen", "gemini-3.5-flash-lite", "gemini-4-argon"],
  ultra: ["gemini-4-argon", "gemini-4-carbon", "gemini-4-hydrogen"],
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server Error: GEMINI_API_KEY is not set in Vercel Environment Variables." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      messages = [],
      tier = "lite",
      customInstructions = "",
      temperature = 0.7,
    } = body;

    const ai = new GoogleGenAI({ apiKey });

    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const combinedInstructions = customInstructions?.trim()
      ? `${DEFAULT_INSTRUCTIONS}\n\nUser Custom Instructions:\n${customInstructions.trim()}`
      : DEFAULT_INSTRUCTIONS;

    const candidates = MODEL_TIERS[tier] || MODEL_TIERS.lite;
    let lastError = "All Oracle models are currently busy.";

    for (const model of candidates) {
      try {
        const streamResult = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: combinedInstructions,
            temperature: Number(temperature),
          },
        });

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamResult) {
                if (chunk.text) {
                  controller.enqueue(encoder.encode(chunk.text));
                }
              }
              controller.close();
            } catch (streamErr: unknown) {
              const msg = streamErr instanceof Error ? streamErr.message : "Stream interrupted";
              controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Oracle-Model": model,
          },
        });
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`Stream model ${model} failed, trying fallback:`, lastError);
      }
    }

    return new Response(
      JSON.stringify({ error: `Oracle models busy (${lastError}). Please retry.` }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unexpected server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
