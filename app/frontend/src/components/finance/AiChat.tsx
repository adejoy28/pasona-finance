import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CornerDownLeft,
  Loader2,
  Pencil,
  RotateCw,
  Send,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";

import { useAiChat, type MaryCard, type MaryMessage } from "@/hooks/use-ai-chat";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import type { AssistantAction } from "@/lib/api/assistant";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAiChat } from "@/hooks/use-ai-chat";
import type { AiChatResult } from "@/lib/api/chat.stub";
import { useOnline } from "@/hooks/use-online";
import {
  summary as summaryApi,
  type SummaryDto,
} from "@/lib/api";
import { FormattedAiResponse } from "@/components/finance/FormattedAiResponse";

const QUICK_PROMPTS = [
  "Where can I cut down expenses?",
  "Am I saving enough this month?",
  "How am I doing overall?",
] as const;

const MAX_QUESTION_LENGTH = 500;

const SUGGESTION_CHIPS = [
  "Where did my money go?",
  "How much do I have?",
  "Check my budget",
  "Any bills coming up?",
  "Spent 2,500 on lunch from OPay",
] as const;

export function AiChat() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { renderAmount } = usePrivacyMode();

  const {
    messages,
    isSending,
    accounts,
    categories,
    userCurrency,
    send,
    editAndResend,
    retryLast,
    confirmCard,
    cancelCard,
    updateCard,
    ensureWelcome,
  } = useAiChat();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for open events (from sidebar "Ask Mary" or keyboard shortcuts)
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      ensureWelcome();
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener("pasona:open-mary", handleOpen);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("pasona:open-mary", handleOpen);
      window.removeEventListener("keydown", handleKey);
    };
  }, [ensureWelcome, open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending, open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || isSending) return;
    setInputValue("");
    send(text);
  };

  const handleChipClick = (chip: string) => {
    if (isSending) return;
    setInputValue("");
    send(chip);
  };

  const handleActionClick = (action: AssistantAction) => {
    if (action.type === "navigate") {
      setOpen(false);
      switch (action.to) {
        case "budgets":
          navigate("/budgets");
          break;
        case "goals":
          navigate("/budgets?tab=goals");
          break;
        case "bills":
          navigate("/budgets?tab=recurring");
          break;
        case "duplicates":
          navigate("/transactions");
          break;
        case "accounts":
          navigate("/accounts");
          break;
        case "history":
          navigate("/transactions");
          break;
        default:
          navigate("/");
          break;
      }
    }
  };

  return (
    <>
      {/* Floating Action Button (Addendum F & redesign mockup #maryfab) */}
      {!open && (
        <button
          type="button"
          id="maryfab"
          onClick={() => {
            setOpen(true);
            ensureWelcome();
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="fixed right-4 sm:right-6 bottom-[74px] sm:bottom-6 z-40 inline-flex items-center gap-2 bg-[#0b1434] text-white border border-white/20 rounded-full py-2.5 px-4 font-extrabold text-xs sm:text-sm shadow-xl hover:bg-[#101b45] active:scale-95 transition-all cursor-pointer group"
          aria-label="Ask Mary"
        >
          <Sparkles
            size={16}
            className="text-amber-400 fill-amber-400 group-hover:rotate-12 transition-transform"
          />
          <span>Mary</span>
        </button>
      )}

      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mary Drawer: 400px side-drawer on desktop, full-height sheet on mobile */}
      <aside
        id="mary"
        role="dialog"
        aria-label="Mary, your money assistant"
        aria-modal="true"
        className={`fixed top-0 bottom-0 right-0 z-[55] w-full sm:w-[400px] max-w-full bg-[var(--surface)] text-[var(--ink)] border-l border-[var(--line)] shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--line)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[var(--hero)] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
              M
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight flex items-center gap-1.5 text-[var(--ink)]">
                <span>Mary</span>
              </h3>
              <p className="text-[11px] text-[var(--muted)] leading-tight">
                Ask about your money
              </p>
            </div>
          </div>
          <button
            type="button"
            id="mclosebtn"
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
            aria-label="Close Mary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Log */}
        <div
          id="mlog"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain"
        >
          {messages.map((m) => (
            <MessageItem
              key={m.id}
              message={m}
              userCurrency={userCurrency}
              accounts={accounts}
              categories={categories}
              renderAmount={renderAmount}
              onConfirmCard={confirmCard}
              onCancelCard={cancelCard}
              onUpdateCard={updateCard}
              onActionClick={handleActionClick}
              onRetry={(text) => send(text)}
              onEditAndResend={editAndResend}
              onRetryLast={retryLast}
            />
          ))}

          {/* Typing Indicator */}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-[var(--chip)] text-[var(--muted)] rounded-2xl rounded-bl-sm px-4 py-3 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div
          id="mchips"
          className="flex gap-1.5 overflow-x-auto px-4 py-2 border-t border-[var(--line)] bg-[var(--surface)] no-scrollbar shrink-0"
        >
          {SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              disabled={isSending}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-[var(--chip)] text-[var(--ink)] hover:border-[var(--primary)] border border-transparent whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          id="mform"
          onSubmit={handleSubmit}
          className="p-3 border-t border-[var(--line)] bg-[var(--surface)] flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            id="min"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Mary or say what you spent"
            autoComplete="off"
            aria-label="Message Mary"
            className="flex-1 bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-[var(--primary)] transition-colors"
          />
          <button
            type="submit"
            id="msend"
            disabled={!inputValue.trim() || isSending}
            aria-label="Send"
            className="w-9 h-9 rounded-xl bg-[var(--primary)] text-[var(--primary-ink)] flex items-center justify-center shrink-0 disabled:opacity-40 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </form>

        {/* Disclaimer Note (Addendum F binding rule) */}
        <div className="px-4 pb-3 pt-1 text-center shrink-0 bg-[var(--surface)]">
          <p className="text-[10px] text-[var(--muted)]">
            Mary can make mistakes. Check amounts before you confirm.
          </p>
        </div>
      </aside>
    </>
  );
}

function MessageItem({
  message,
  userCurrency,
  accounts,
  categories,
  renderAmount,
  onConfirmCard,
  onCancelCard,
  onUpdateCard,
  onActionClick,
  onRetry,
  onEditAndResend,
  onRetryLast,
}: {
  message: MaryMessage;
  userCurrency: string;
  accounts: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string; type: string }>;
  renderAmount: (amount: number, currency: string) => string;
  onConfirmCard: (cardId: string) => void;
  onCancelCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<MaryCard>) => void;
  onActionClick: (action: AssistantAction) => void;
  onRetry: (prompt: string) => void;
  onEditAndResend: (messageId: string, newContent: string) => void;
  onRetryLast?: () => void;
}) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  if (isUser) {
    return (
      <UserBubbleItem
        message={message}
        onEditAndResend={onEditAndResend}
      />
    );
  }

  if (isError) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[88%] rounded-2xl rounded-bl-sm p-3.5 text-xs sm:text-sm leading-relaxed border border-red-300 bg-red-50/90 text-red-950 space-y-2 shadow-xs">
          <div className="flex items-start gap-2">
            {message.errorKind === "offline" ? (
              <WifiOff size={15} className="text-red-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={15} className="text-red-700 shrink-0 mt-0.5" />
            )}
            <p className="flex-1">{message.content}</p>
          </div>
          {message.retryPrompt && (
            <div>
              {message.errorKind === "expired" ? (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("pasona:reauth-required"));
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onRetry(message.retryPrompt!)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-2xl rounded-bl-sm p-3 text-xs sm:text-sm leading-relaxed bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-xs space-y-2.5 break-words">
        {/* Reply Body with Markdown formatting */}
        <FormattedMaryText
          content={message.content}
          isMasked={!renderAmount(100, userCurrency).includes("100")}
        />

        {/* Interactive Confirm Card */}
        {message.card && (
          <ConfirmCardView
            card={message.card}
            userCurrency={userCurrency}
            accounts={accounts}
            categories={categories}
            renderAmount={renderAmount}
            onConfirm={() => onConfirmCard(message.card!.id)}
            onCancel={() => onCancelCard(message.card!.id)}
            onUpdate={(updates) => onUpdateCard(message.card!.id, updates)}
          />
        )}

        {/* Action Buttons & Quick Retry */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--line)]/50">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {message.actions &&
              message.actions.map((act, i) => {
                if (act.type === "navigate") {
                  const label =
                    act.to === "budgets"
                      ? "Open budgets"
                      : act.to === "bills"
                        ? "View bills"
                        : act.to === "goals"
                          ? "View goals"
                          : act.to === "duplicates"
                            ? "Review duplicates"
                            : `Go to ${act.to}`;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onActionClick(act)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-[var(--chip)] text-[var(--primary)] hover:border-[var(--primary)] border border-transparent transition-all cursor-pointer"
                    >
                      <span>{label}</span>
                      <ArrowRight size={11} />
                    </button>
                  );
                }
                return null;
              })}
          </div>

          {message.id !== "welcome" && onRetryLast && (
            <button
              type="button"
              onClick={onRetryLast}
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[var(--muted)] hover:text-[var(--ink)] px-1.5 py-0.5 rounded hover:bg-[var(--chip)] transition-colors cursor-pointer shrink-0"
              title="Regenerate reply"
            >
              <RotateCw size={11} />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserBubbleItem({
  message,
  onEditAndResend,
}: {
  message: MaryMessage;
  onEditAndResend: (messageId: string, newContent: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setIsEditing(false);
    onEditAndResend(message.id, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(message.content);
    }
  };

  if (isEditing) {
    return (
      <div className="flex justify-end w-full">
        <div className="w-full max-w-[90%] sm:max-w-[85%] rounded-2xl bg-[var(--surface)] text-[var(--ink)] border border-[var(--primary)] p-2.5 shadow-md space-y-2">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl p-2 text-xs sm:text-sm outline-none focus:border-[var(--primary)] resize-none"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditValue(message.content);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-[var(--muted)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!editValue.trim()}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-[var(--primary)] text-[var(--primary-ink)] hover:brightness-105 transition-all cursor-pointer disabled:opacity-50"
            >
              Save & Resend
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex justify-end items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          setEditValue(message.content);
          setIsEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 text-[var(--muted)] hover:text-[var(--ink)] rounded-md hover:bg-[var(--chip)] cursor-pointer"
        aria-label="Edit message"
        title="Edit and resend"
      >
        <Pencil size={13} />
      </button>

      <div className="max-w-[88%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed bg-[var(--primary)] text-[var(--primary-ink)] shadow-xs whitespace-pre-wrap break-words">
        {message.content}
      </div>
    </div>
  );
}

function ConfirmCardView({
  card,
  userCurrency,
  accounts,
  categories,
  renderAmount,
  onConfirm,
  onCancel,
  onUpdate,
}: {
  card: MaryCard;
  userCurrency: string;
  accounts: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string; type: string }>;
  renderAmount: (amount: number, currency: string) => string;
  onConfirm: () => void;
  onCancel: () => void;
  onUpdate: (updates: Partial<MaryCard>) => void;
}) {
  const isIncome = card.kind === "income";
  const filteredCats = categories.filter((c) => c.type === card.kind);

  return (
    <div className="mcard border-t border-[var(--line)] pt-2.5 mt-2 space-y-2">
      {/* Amount and Kind */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--muted)] font-medium">
          {isIncome ? "Income" : "Expense"}
        </span>
        <b className="text-sm font-extrabold text-[var(--ink)]">
          {renderAmount(card.amount, userCurrency)}
        </b>
      </div>

      {/* Description */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--muted)] font-medium">Description</span>
        <b className="font-bold text-[var(--ink)] truncate max-w-[180px]">
          {card.description || "transaction"}
        </b>
      </div>

      {/* Date */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--muted)] font-medium">Date</span>
        <b className="font-semibold text-[var(--ink)]">Today</b>
      </div>

      {/* Done status */}
      {card.done === "added" && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          <Check size={14} />
          <span>Added</span>
        </div>
      )}

      {card.done === "cancel" && (
        <div className="text-xs font-semibold text-[var(--muted)] bg-[var(--chip)] px-2 py-1 rounded-md">
          Cancelled
        </div>
        <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1">
          For budgeting guidance only. Does not constitute certified financial advice.
        </p>
      </div>
    </>
  );
}

function FormattedMaryText({
  content,
  isMasked,
}: {
  content: string;
  isMasked: boolean;
}) {
  let text = content;
  if (isMasked) {
    text = text.replace(/(?:₦|NGN|\$)\s*[\d,]+(?:\.\d+)?/gi, "****");
  }

  const lines = text.split("\n");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md whitespace-pre-wrap"
            : "bg-slate-50 text-slate-800 rounded-bl-md"
        }`}
      >
        {isUser ? message.content : <FormattedAiResponse text={message.content} />}
      </div>
    </div>
  );
}
