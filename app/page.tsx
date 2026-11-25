"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, RotateCcw } from "lucide-react";

const AGENT_NAME = "Oracle";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function OraclePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: input.trim() },
    ];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || data.error || "No reply received from Oracle.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error: Could not reach the Oracle backend.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          <h1 className="font-semibold text-base sm:text-lg truncate">
            {AGENT_NAME}
          </h1>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="shrink-0 flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800 px-3 py-1.5 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        )}
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 px-4">
            <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 mb-3" />
            <p className="text-base sm:text-lg font-medium text-zinc-200">
              I am {AGENT_NAME}
            </p>
            <p className="text-xs sm:text-sm max-w-md mt-1">
              Ask a question or give me a task to begin.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end gap-2 sm:gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl max-w-[85%] sm:max-w-[78%] text-sm sm:text-base break-words whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-200"
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-zinc-400 text-xs sm:text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                <span>{AGENT_NAME} is thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <footer
        className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-3 sm:px-6 pt-2.5 sm:pt-3"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        <form
          onSubmit={sendMessage}
          className="w-full max-w-3xl mx-auto flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 focus-within:border-indigo-500"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${AGENT_NAME}...`}
            className="flex-1 min-w-0 bg-transparent outline-none py-1.5 sm:py-2 text-sm sm:text-base text-zinc-100 placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </footer>
    </div>
  );
}
