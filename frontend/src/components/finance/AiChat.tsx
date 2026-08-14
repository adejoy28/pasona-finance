import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Info,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAiChat } from "@/hooks/use-ai-chat";
import type { AiChatResult } from "@/lib/api/chat.stub";
import { useOnline } from "@/hooks/use-online";
import {
  summary as summaryApi,
  type SummaryDto,
} from "@/lib/api";

const QUICK_PROMPTS = [
  "Where can I cut down expenses?",
  "Am I saving enough this month?",
  "How am I doing overall?",
] as const;

const MAX_QUESTION_LENGTH = 500;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function AiChat() {
  const [open, setOpen] = useState(false);
  const isOnline = useOnline();

  const [summaryData, setSummaryData] = useState<SummaryDto | null>(null);
  useEffect(() => {
    summaryApi.getSummary().then(setSummaryData).catch(() => {});
  }, []);

  const accountCount = summaryData?.accounts.length ?? 0;
  if (accountCount === 0) return null;

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-50 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center"
        aria-label="Open AI Chat"
      >
        <MessageSquare size={22} />
      </button>

      {/* Overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-5 z-[70] w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-200 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-2xl card-shadow border border-slate-100 flex flex-col max-h-[560px] shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              AI Chat
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                }}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <AiChatBody isOnline={isOnline} />
        </div>
      </div>
    </>
  );
}

function AiChatBody({ isOnline }: { isOnline: boolean }) {
  const { messages, lastResult, isSending, send, reset } = useAiChat();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const trimmedInput = inputValue.trim();
  const canSubmit = isOnline && trimmedInput.length >= 1 && !isSending;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastResult]);

  const onSubmit = () => {
    if (!canSubmit) return;
    send(trimmedInput);
    setInputValue("");
  };

  const onQuickPrompt = (prompt: string) => {
    setInputValue("");
    send(prompt);
  };

  return (
    <>
      {/* Banners */}
      {lastResult?.kind === "not_configured" && (
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex gap-3">
          <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-700">AI chat is not configured</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{lastResult.message}</p>
          </div>
        </div>
      )}

      {lastResult?.kind === "empty_history" && (
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex gap-3">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-amber-900">Not enough data yet</p>
            <p className="text-[11px] text-amber-700 mt-0.5">{lastResult.message}</p>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex gap-2 items-center">
          <WifiOff size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs font-bold text-amber-800">
            You're offline. AI chat needs a connection.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px]">
        {messages.length === 0 && !lastResult && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <Sparkles size={28} className="text-blue-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">
              Ask anything about your finances
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Try one of the prompts below
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-slate-50 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-xs text-slate-400 font-medium">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {lastResult?.kind === "error" && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-900">Couldn't get a response</p>
              <p className="text-xs text-red-700 mt-1 break-words">{lastResult.message}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onQuickPrompt(prompt)}
                disabled={!isOnline || isSending}
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
            placeholder="Ask a follow-up..."
            rows={1}
            disabled={!isOnline}
            className="resize-none text-sm leading-relaxed min-h-[36px] max-h-[100px] flex-1"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            size="icon"
            className="rounded-xl h-9 w-9 shrink-0"
          >
            {isSending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            <kbd className="font-bold">Enter</kbd> to send
          </p>
          <p className="text-[10px] font-bold text-slate-400 tabular-nums">
            {isOnline ? `${trimmedInput.length}/${MAX_QUESTION_LENGTH}` : ""}
          </p>
        </div>
      </div>
    </>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-slate-50 text-slate-800 rounded-bl-md"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
