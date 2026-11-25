"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Square,
  Sparkles,
  Copy,
  Check,
  Code2,
  Lightbulb,
  FileText,
  Compass,
  Settings,
  X,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  PanelLeft,
  Plus,
  Trash2,
  RotateCw,
  Download,
  Zap,
  Cpu,
  Brain,
} from "lucide-react";

const AGENT_NAME = "Oracle";

type ThemeMode = "system" | "dark" | "light";
type ModelTier = "lite" | "pro" | "ultra";
type FontScale = "sm" | "base" | "lg";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

type OracleSettings = {
  theme: ThemeMode;
  tier: ModelTier;
  customInstructions: string;
  temperature: number;
  fontScale: FontScale;
};

const DEFAULT_SETTINGS: OracleSettings = {
  theme: "system",
  tier: "lite",
  customInstructions: "",
  temperature: 0.7,
  fontScale: "base",
};

const MODEL_OPTIONS: {
  id: ModelTier;
  name: string;
  badge: string;
  desc: string;
  icon: typeof Zap;
}[] = [
  {
    id: "lite",
    name: "Oracle Lite",
    badge: "Fast",
    desc: "Instant replies for everyday questions",
    icon: Zap,
  },
  {
    id: "pro",
    name: "Oracle Pro",
    badge: "Balanced",
    desc: "Smart coding, writing & daily tasks",
    icon: Cpu,
  },
  {
    id: "ultra",
    name: "Oracle Ultra",
    badge: "Reasoning",
    desc: "Deep logic, math & complex architecture",
    icon: Brain,
  },
];

const STARTER_PROMPTS = [
  {
    icon: Code2,
    label: "Write clean code",
    prompt: "Write a clean Python function to fetch JSON from a REST API with proper error handling.",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm ideas",
    prompt: "Give me 5 unique AI agent project ideas for computer engineering students.",
  },
  {
    icon: FileText,
    label: "Summarize & structure",
    prompt: "Explain how streaming APIs work in 5 clear bullet points.",
  },
  {
    icon: Compass,
    label: "Debug an issue",
    prompt: "How do I optimize a Next.js app for mobile and foldable screens?",
  },
];

function FormattedMessage({
  content,
  isDark,
  fontScale,
}: {
  content: string;
  isDark: boolean;
  fontScale: FontScale;
}) {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const textSizeClass =
    fontScale === "sm"
      ? "text-xs sm:text-sm leading-6"
      : fontScale === "lg"
      ? "text-base sm:text-lg leading-8"
      : "text-sm sm:text-[15px] leading-7";

  // Split fenced code blocks ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  const renderInline = (line: string) => {
    const tokens = line.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return tokens.map((tok, i) => {
      if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
        return (
          <strong key={i} className="font-semibold">
            {tok.slice(2, -2)}
          </strong>
        );
      }
      if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
        return (
          <code
            key={i}
            className={`px-1.5 py-0.5 rounded text-[0.88em] font-mono ${
              isDark
                ? "bg-white/[0.08] text-zinc-100"
                : "bg-zinc-200/80 text-zinc-900"
            }`}
          >
            {tok.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{tok}</span>;
    });
  };

  const copyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedBlock(index);
      setTimeout(() => setCopiedBlock(null), 1800);
    } catch {
      // Ignore
    }
  };

  return (
    <div className={`space-y-3 break-words ${textSizeClass}`}>
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const firstNewline = inner.indexOf("\n");
          const lang =
            firstNewline !== -1 ? inner.slice(0, firstNewline).trim() : "code";
          const codeBody =
            firstNewline !== -1 ? inner.slice(firstNewline + 1) : inner;

          return (
            <div
              key={idx}
              className={`rounded-xl overflow-hidden border my-2 ${
                isDark
                  ? "bg-[#111317] border-white/[0.1]"
                  : "bg-zinc-900 border-zinc-800 text-zinc-100"
              }`}
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.04] border-b border-white/[0.08] text-[11px] text-zinc-400">
                <span className="font-mono uppercase tracking-wider">
                  {lang || "code"}
                </span>
                <button
                  type="button"
                  onClick={() => copyCode(codeBody, idx)}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedBlock === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-zinc-100">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        if (!part) return null;

        return (
          <div key={idx} className="whitespace-pre-wrap">
            {part.split("\n").map((line, lineIdx, arr) => (
              <span key={lineIdx}>
                {renderInline(line)}
                {lineIdx < arr.length - 1 ? "\n" : ""}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function OraclePage() {
  const [settings, setSettings] = useState<OracleSettings>(DEFAULT_SETTINGS);
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load saved settings & chats
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("oracle_settings_v1");
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
      const savedSessions = localStorage.getItem("oracle_sessions_v1");
      if (savedSessions) {
        const parsed: ChatSession[] = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      }
    } catch {
      // Ignore storage errors
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem("oracle_settings_v1", JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Save sessions
  useEffect(() => {
    try {
      localStorage.setItem("oracle_sessions_v1", JSON.stringify(sessions));
    } catch {
      // Ignore
    }
  }, [sessions]);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModelMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [modelMenuOpen]);

  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" && systemPrefersDark);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const startNewChat = () => {
    if (isLoading) stopGenerating();
    setActiveSessionId("");
    setSidebarOpen(false);
  };

  const stopGenerating = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const updateSessionMessages = (sessionId: string, newMessages: Message[], titleHint?: string) => {
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === sessionId);
      if (exists) {
        return prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: newMessages,
                updatedAt: Date.now(),
                title:
                  s.title === "New Chat" && titleHint
                    ? titleHint.slice(0, 36)
                    : s.title,
              }
            : s
        );
      }
      return [
        {
          id: sessionId,
          title: (titleHint || "New Chat").slice(0, 36),
          messages: newMessages,
          updatedAt: Date.now(),
        },
        ...prev,
      ];
    });
  };

  const submitPrompt = async (promptText: string, overrideHistory?: Message[]) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    const sessionId = activeSessionId || `chat_${Date.now()}`;
    if (!activeSessionId) setActiveSessionId(sessionId);

    const baseHistory = overrideHistory ?? messages;
    const userMsg: Message = { role: "user", content: trimmed };
    const historyWithUser = [...baseHistory, userMsg];
    const historyWithPlaceholder: Message[] = [
      ...historyWithUser,
      { role: "assistant", content: "" },
    ];

    updateSessionMessages(sessionId, historyWithPlaceholder, trimmed);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: historyWithUser,
          tier: settings.tier,
          customInstructions: settings.customInstructions,
          temperature: settings.temperature,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        updateSessionMessages(sessionId, [
          ...historyWithUser,
          {
            role: "assistant",
            content: errData.error || `Error ${res.status}: Oracle could not respond.`,
          },
        ]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream reader available");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        updateSessionMessages(sessionId, [
          ...historyWithUser,
          { role: "assistant", content: accumulated },
        ]);
      }

      if (!accumulated.trim()) {
        updateSessionMessages(sessionId, [
          ...historyWithUser,
          { role: "assistant", content: "No reply received from Oracle." },
        ]);
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "AbortError") {
        // User stopped generation manually; keep partial text
      } else {
        updateSessionMessages(sessionId, [
          ...historyWithUser,
          {
            role: "assistant",
            content: "Network error: Could not reach the Oracle backend.",
          },
        ]);
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  const regenerateLast = () => {
    if (isLoading || messages.length < 2) return;
    const lastUserIdx = [...messages]
      .map((m) => m.role)
      .lastIndexOf("user");
    if (lastUserIdx === -1) return;
    const lastUserPrompt = messages[lastUserIdx].content;
    const priorMessages = messages.slice(0, lastUserIdx);
    submitPrompt(lastUserPrompt, priorMessages);
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
      // Ignore
    }
  };

  const exportMarkdown = () => {
    if (messages.length === 0) return;
    const md = messages
      .map((m) => `### ${m.role === "user" ? "You" : "Oracle"}\n\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oracle-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) setActiveSessionId("");
  };

  const currentModel =
    MODEL_OPTIONS.find((m) => m.id === settings.tier) || MODEL_OPTIONS[0];
  const CurrentModelIcon = currentModel.icon;

  return (
    <div
      className={`flex h-dvh w-full overflow-hidden antialiased transition-colors duration-200 ${
        isDark
          ? "bg-[#0b0c0e] text-zinc-100 selection:bg-zinc-700 selection:text-white"
          : "bg-[#f8f9fb] text-zinc-900 selection:bg-zinc-300 selection:text-zinc-950"
      }`}
    >
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Left Sidebar (Chat History) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 flex flex-col border-r transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${
          isDark
            ? "bg-[#0e1013] border-white/[0.07]"
            : "bg-white border-zinc-200"
        }`}
      >
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-inherit">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                isDark
                  ? "bg-white/[0.06] border-white/[0.1]"
                  : "bg-zinc-900 border-zinc-900 text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              {AGENT_NAME}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg opacity-70 hover:opacity-100"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={startNewChat}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
              isDark
                ? "bg-white/[0.05] hover:bg-white/[0.09] border-white/[0.09] text-zinc-100"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-900 text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2.5 space-y-1">
          <p className="px-2 pt-1 pb-1 text-[11px] font-medium uppercase tracking-wider opacity-45">
            Recent Chats
          </p>
          {sessions.length === 0 ? (
            <p className="px-2 py-3 text-xs opacity-50">
              No saved chats yet.
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id);
                  setSidebarOpen(false);
                }}
                className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  s.id === activeSessionId
                    ? isDark
                      ? "bg-white/[0.09] text-white font-medium"
                      : "bg-zinc-200/80 text-zinc-950 font-medium"
                    : isDark
                    ? "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <span className="truncate">{s.title}</span>
                <button
                  type="button"
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-70 hover:!opacity-100 p-0.5 rounded"
                  aria-label="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-inherit">
          <button
            type="button"
            onClick={() => {
              setSettingsOpen(true);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isDark
                ? "hover:bg-white/[0.06] text-zinc-300"
                : "hover:bg-zinc-100 text-zinc-700"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Theme</span>
          </button>
        </div>
      </aside>

      {/* Main Right Workspace */}
      <div className="flex-1 min-w-0 flex flex-col h-dvh overflow-hidden">
        {/* Top Header with Model Switcher & Quick Controls */}
        <header
          className={`shrink-0 flex items-center justify-between px-3 sm:px-6 h-14 border-b backdrop-blur-md z-20 ${
            isDark
              ? "bg-[#0b0c0e]/90 border-white/[0.07]"
              : "bg-[#f8f9fb]/90 border-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isDark ? "hover:bg-white/[0.06]" : "hover:bg-zinc-200/70"
              }`}
              aria-label="Open chat history"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Model Switcher Dropdown */}
            <div ref={modelMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setModelMenuOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                  isDark
                    ? "bg-[#14161a] hover:bg-[#1a1d23] border-white/[0.09] text-zinc-100"
                    : "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-900 shadow-2xs"
                }`}
              >
                <CurrentModelIcon className="w-3.5 h-3.5 opacity-80 shrink-0" />
                <span>{currentModel.name}</span>
                <span
                  className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-md ${
                    isDark
                      ? "bg-white/[0.07] text-zinc-400"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {currentModel.badge}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {modelMenuOpen && (<>
                  <div
                    className={`absolute left-0 mt-2 w-72 rounded-2xl border p-1.5 shadow-xl z-30 ${
                      isDark
                        ? "bg-[#14161b] border-white/[0.1]"
                        : "bg-white border-zinc-200"
                    }`}
                  >
                    {MODEL_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const selected = opt.id === settings.tier;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSettings((s) => ({ ...s, tier: opt.id }));
                            setModelMenuOpen(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors ${
                            selected
                              ? isDark
                                ? "bg-white/[0.08]"
                                : "bg-zinc-100"
                              : isDark
                              ? "hover:bg-white/[0.04]"
                              : "hover:bg-zinc-50"
                          }`}
                        >
                          <Icon className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">
                                {opt.name}
                              </span>
                              <span className="text-[10px] opacity-60">
                                {opt.badge}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-60 mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={startNewChat}
              title="New Chat"
              className={`p-2 rounded-xl border text-xs transition-colors ${
                isDark
                  ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]"
                  : "bg-white hover:bg-zinc-100 border-zinc-200"
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              className={`p-2 rounded-xl border text-xs transition-colors ${
                isDark
                  ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]"
                  : "bg-white hover:bg-zinc-100 border-zinc-200"
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6">
          {messages.length === 0 ? (
            <div className="h-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center py-6">
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-4 ${
                  isDark
                    ? "bg-white/[0.05] border-white/[0.1]"
                    : "bg-white border-zinc-200 shadow-2xs"
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                How can {AGENT_NAME} help today?
              </h2>
              <p className="text-xs sm:text-sm opacity-60 max-w-md mt-1.5">
                Running on {currentModel.name}. Stream answers live or customize behavior in Settings.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-7 text-left">
                {STARTER_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => submitPrompt(item.prompt)}
                      className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                        isDark
                          ? "bg-[#131519] hover:bg-[#181b20] border-white/[0.07] hover:border-white/[0.15]"
                          : "bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300 shadow-2xs"
                      }`}
                    >
                      <Icon className="w-4 h-4 opacity-60 group-hover:opacity-100 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium">
                          {item.label}
                        </p>
                        <p className="text-xs opacity-55 line-clamp-1 mt-0.5">
                          {item.prompt}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto py-5 space-y-6">
              {messages.map((msg, idx) => {
                const isLastAssistant =
                  msg.role === "assistant" && idx === messages.length - 1;
                return (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <div
                        className={`px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] sm:max-w-[75%] text-sm sm:text-[15px] break-words whitespace-pre-wrap leading-relaxed ${
                          isDark
                            ? "bg-zinc-100 text-zinc-950"
                            : "bg-zinc-900 text-white"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 max-w-full sm:max-w-[90%] w-full">
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                            isDark
                              ? "bg-white/[0.06] border-white/[0.1]"
                              : "bg-white border-zinc-200"
                          }`}
                        >
                          <Sparkles
                            className={`w-3.5 h-3.5 ${
                              isLoading && isLastAssistant ? "animate-pulse" : ""
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          {msg.content ? (
                            <FormattedMessage
                              content={msg.content}
                              isDark={isDark}
                              fontScale={settings.fontScale}
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 py-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-bounce" />
                            </div>
                          )}

                          {msg.content && !(isLoading && isLastAssistant) && (
                            <div className="mt-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => copyMessage(msg.content, idx)}
                                className={`inline-flex items-center gap-1 text-[11px] opacity-60 hover:opacity-100 px-2 py-1 rounded-md transition-colors ${
                                  isDark
                                    ? "hover:bg-white/[0.06]"
                                    : "hover:bg-zinc-200/70"
                                }`}
                              >
                                {copiedIdx === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-500">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              {isLastAssistant && (
                                <button
                                  type="button"
                                  onClick={regenerateLast}
                                  className={`inline-flex items-center gap-1 text-[11px] opacity-60 hover:opacity-100 px-2 py-1 rounded-md transition-colors ${
                                    isDark
                                      ? "hover:bg-white/[0.06]"
                                      : "hover:bg-zinc-200/70"
                                  }`}
                                >
                                  <RotateCw className="w-3 h-3" />
                                  <span>Regenerate</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        {/* Bottom Input Composer */}
        <footer
          className="shrink-0 px-3 sm:px-6 pt-2"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitPrompt(input);
            }}
            className={`w-full max-w-3xl mx-auto flex items-end gap-2 rounded-2xl border px-3.5 py-2 transition-colors ${
              isDark
                ? "bg-[#14161a] border-white/[0.1] focus-within:border-white/[0.25]"
                : "bg-white border-zinc-300 focus-within:border-zinc-500 shadow-2xs"
            }`}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${currentModel.name}...`}
              className="flex-1 min-w-0 max-h-40 resize-none bg-transparent outline-none py-1.5 text-sm sm:text-[15px] placeholder:opacity-45 leading-relaxed"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={stopGenerating}
                aria-label="Stop generating"
                className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isDark
                    ? "bg-white/[0.12] hover:bg-white/[0.2] text-white"
                    : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900"
                }`}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message"
                className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 ${
                  isDark
                    ? "bg-zinc-100 text-zinc-950 hover:bg-white"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.25]" />
              </button>
            )}
          </form>
        </footer>
      </div>

      {/* Settings Drawer Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
              isDark
                ? "bg-[#121418] border-white/[0.1] text-zinc-100"
                : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 opacity-75" />
                <h3 className="font-semibold text-sm">Oracle Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[75dvh] overflow-y-auto text-xs">
              {/* Theme Option */}
              <div>
                <label className="block font-medium mb-2">Appearance</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "system", label: "System", icon: Monitor },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = settings.theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSettings((s) => ({ ...s, theme: item.id }))
                        }
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-medium transition-colors ${
                          active
                            ? isDark
                              ? "bg-zinc-100 text-zinc-950 border-zinc-100"
                              : "bg-zinc-900 text-white border-zinc-900"
                            : isDark
                            ? "bg-white/[0.03] border-white/[0.09] hover:bg-white/[0.07]"
                            : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Scale */}
              <div>
                <label className="block font-medium mb-2">Text Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "sm", label: "Compact" },
                      { id: "base", label: "Default" },
                      { id: "lg", label: "Large" },
                    ] as const
                  ).map((sz) => {
                    const active = settings.fontScale === sz.id;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() =>
                          setSettings((s) => ({ ...s, fontScale: sz.id }))
                        }
                        className={`py-2 px-3 rounded-xl border font-medium transition-colors ${
                          active
                            ? isDark
                              ? "bg-zinc-100 text-zinc-950 border-zinc-100"
                              : "bg-zinc-900 text-white border-zinc-900"
                            : isDark
                            ? "bg-white/[0.03] border-white/[0.09] hover:bg-white/[0.07]"
                            : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {sz.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom System Instructions */}
              <div>
                <label className="block font-medium mb-1.5">
                  Custom Instructions
                </label>
                <textarea
                  rows={3}
                  value={settings.customInstructions}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      customInstructions: e.target.value,
                    }))
                  }
                  placeholder="e.g., Answer concisely, explain code step-by-step, or act as a senior engineer..."
                  className={`w-full rounded-xl border p-2.5 outline-none resize-none leading-relaxed ${
                    isDark
                      ? "bg-[#0b0c0e] border-white/[0.1] focus:border-white/[0.25]"
                      : "bg-zinc-50 border-zinc-200 focus:border-zinc-400"
                  }`}
                />
              </div>

              {/* Temperature / Creativity */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium">Creativity (Temperature)</label>
                  <span className="font-mono opacity-70">
                    {settings.temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.1}
                  value={settings.temperature}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      temperature: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-zinc-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] opacity-50 mt-0.5">
                  <span>Precise (0.0)</span>
                  <span>Balanced (0.7)</span>
                  <span>Creative (1.5)</span>
                </div>
              </div>

              {/* Export & Clear Actions */}
              <div className="pt-2 border-t border-inherit flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={exportMarkdown}
                  disabled={messages.length === 0}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-medium disabled:opacity-40 ${
                    isDark
                      ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.09]"
                      : "bg-zinc-100 hover:bg-zinc-200 border-zinc-200"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .md</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSessions([]);
                    setActiveSessionId("");
                    setSettingsOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

