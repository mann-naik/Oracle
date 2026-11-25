"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Code2,
  Lightbulb,
  FileText,
  Compass,
} from "lucide-react";

const AGENT_NAME = "Oracle";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const STARTER_PROMPTS = [
  {
    icon: Code2,
    label: "Write clean code",
    prompt: "Write a clean, well-commented Python function to fetch data from an API with error handling.",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm ideas",
    prompt: "Give me 5 unique project ideas using AI agents for students.",
  },
  {
    icon: FileText,
    label: "Summarize & structure",
    prompt: "Explain how REST APIs work in 5 simple bullet points.",
  },
  {
    icon: Compass,
    label: "Debug an issue",
    prompt: "What are the top 5 causes of a 500 Internal Server Error in Next.js?",
  },
];

export default function OraclePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const submitPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPrompt(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPrompt(input);
    }
  };

  const copyMessage = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-[#0b0c0e] text-zinc-100 antialiased selection:bg-zinc-700 selection:text-white">
      {/* Minimalist Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 border-b border-white/[0.07] bg-[#0b0c0e]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-zinc-100" />
          </div>
          <span className="font-medium text-sm sm:text-base tracking-tight text-zinc-100 truncate">
            {AGENT_NAME}
          </span>
          <span className="hidden xs:inline-flex items-center gap-1.5 text-[11px] text-zinc-400 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Online
          </span>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="shrink-0 flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New chat</span>
          </button>
        )}
      </header>

      {/* Main Conversation Stream */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6">
        {messages.length === 0 ? (
          <div className="h-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center py-6">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-zinc-100" />
            </div>
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-100">
              How can {AGENT_NAME} help today?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mt-1.5">
              Ask anything, write code, or pick a prompt below to get started.
            </p>

            {/* Starter Prompt Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-7 text-left">
              {STARTER_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => submitPrompt(item.prompt)}
                    className="group flex items-start gap-3 p-3.5 rounded-xl bg-[#131519] hover:bg-[#181b20] border border-white/[0.07] hover:border-white/[0.14] transition-all"
                  >
                    <Icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-100 mt-0.5 shrink-0 transition-colors" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                        {item.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto py-6 space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] sm:max-w-[75%] text-sm sm:text-[15px] bg-zinc-100 text-zinc-950 font-normal break-words whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="group flex items-start gap-3 max-w-full sm:max-w-[88%]">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-200" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-[15px] text-zinc-200 break-words whitespace-pre-wrap leading-7">
                        {msg.content}
                      </div>
                      <div className="mt-2 flex items-center">
                        <button
                          type="button"
                          onClick={() => copyMessage(msg.content, idx)}
                          className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-200 px-2 py-1 rounded-md hover:bg-white/[0.05] transition-colors"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-300 animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Floating Input Composer */}
      <footer
        className="shrink-0 bg-[#0b0c0e] px-3 sm:px-6 pt-2"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <form
          onSubmit={handleFormSubmit}
          className="w-full max-w-3xl mx-auto flex items-end gap-2 bg-[#14161a] border border-white/[0.1] focus-within:border-white/[0.25] rounded-2xl px-3.5 py-2 transition-colors"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${AGENT_NAME}...`}
            className="flex-1 min-w-0 max-h-40 resize-none bg-transparent outline-none py-1.5 text-sm sm:text-[15px] text-zinc-100 placeholder-zinc-500 leading-relaxed"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="shrink-0 w-8 h-8 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center justify-center transition-colors"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.25]" />
          </button>
        </form>
      </footer>
    </div>
  );
}
