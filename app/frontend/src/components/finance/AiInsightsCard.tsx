// "AI Insights" card for the dashboard.
//
// Renders a freeform input, three quick-prompt chips, a Generate button,
// and the LLM's response. All states are driven by the discriminated
// union returned from `useAiInsights`:
//   - idle              (no question asked)
//   - loading           (fetch in flight)
//   - ok                (show the answer + regenerate / clear)
//   - not_configured    (info banner; feature disabled)
//   - empty_history     (amber info; user needs more data)
//   - error             (red banner; retry if `retryable`)
//
// Hides itself entirely when the user has no accounts yet (matches the
// dashboard's existing "No accounts yet" empty state). Offline = input
// and button disabled + offline banner.

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAiInsights } from "@/hooks/use-ai-insights";
import type { AiInsightResult } from "@/lib/api/insights.stub";
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

const TYPING_SPEED_MS = 15;

function useTypewriter(text: string, active: boolean): string {
  const [displayed, setDisplayed] = useState(active ? text : "");
  const idxRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setDisplayed("");
      idxRef.current = 0;
      return;
    }

    if (idxRef.current > text.length) {
      idxRef.current = 0;
    }

    const tick = () => {
      if (idxRef.current < text.length) {
        idxRef.current += Math.min(3, text.length - idxRef.current);
        setDisplayed(text.slice(0, idxRef.current));
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [text, active]);

  return active ? displayed : text;
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function AiInsightsCard() {
  const isOnline = useOnline();

  const [summaryData, setSummaryData] = useState<SummaryDto | null>(null);
  useEffect(() => {
    summaryApi.getSummary().then(setSummaryData).catch(() => {});
  }, []);
  const accountCount = summaryData?.accounts.length ?? 0;
  if (accountCount === 0) return null;

  return <AiInsightsCardBody isOnline={isOnline} />;
}

function AiInsightsCardBody({ isOnline }: { isOnline: boolean }) {
  const { result, isFetching, isLoading, generate, reset, refetch, currentQuestion } =
    useAiInsights();

  const [inputValue, setInputValue] = useState<string>("");
  // Keep the textarea in sync with the active question after a Generate
  // click so the user sees what was actually sent.
  useEffect(() => {
    if (currentQuestion && currentQuestion !== inputValue.trim()) {
      setInputValue(currentQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  const trimmedInput = inputValue.trim();
  const canSubmit = isOnline && trimmedInput.length >= 3 && !isFetching;

  // Track answer identity so typewriter only plays on fresh answers
  const [seenAnswer, setSeenAnswer] = useState<string | null>(null);
  const okResult = result?.kind === "ok" ? (result as Extract<AiInsightResult, { kind: "ok" }>) : null;
  const isNewAnswer = okResult !== null && okResult.answer !== seenAnswer;
  const typewriterActive = isNewAnswer && !isFetching;
  const displayAnswer = useTypewriter(okResult?.answer ?? "", typewriterActive);

  useEffect(() => {
    if (okResult && !isFetching) {
      if (!typewriterActive && seenAnswer !== okResult.answer) {
        setSeenAnswer(okResult.answer);
      }
    }
  }, [okResult, isFetching, typewriterActive, seenAnswer]);

  const onGenerate = () => {
    if (!canSubmit) return;
    generate(trimmedInput);
  };

  const onRegenerate = () => {
    if (!isOnline || !currentQuestion) return;
    void refetch();
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-end px-2">
        <h3 className="text-lg font-black text-slate-900 leading-none flex items-center gap-2">
          <Sparkles size={18} className="text-blue-600" />
          AI Insights
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Ask anything
        </p>
      </div>

      <div className="bg-white rounded-2xl card-shadow border border-slate-50 p-6 space-y-4">
        {/* Banners for non-ok results. Each is rendered above the input
            so the user always sees context before typing. */}
        {result?.kind === "not_configured" && (
          <InsightBanner
            tone="slate"
            icon={<Info size={18} />}
            title="AI insights are not configured"
            body={result.message}
          />
        )}

        {result?.kind === "empty_history" && (
          <InsightBanner
            tone="amber"
            icon={<AlertCircle size={18} />}
            title="Not enough data yet"
            body={result.message}
          />
        )}

        {result?.kind === "error" && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-900">Couldn't generate insights</p>
              <p className="text-xs text-red-700 mt-1 break-words">{result.message}</p>
              {result.retryable && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={isFetching}
                  className="mt-2 text-xs font-bold text-red-700 hover:underline disabled:opacity-50"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex gap-2 items-center">
            <WifiOff size={16} className="text-amber-600 shrink-0" />
            <p className="text-xs font-bold text-amber-800">
              You're offline. AI insights need a connection.
            </p>
          </div>
        )}

        {/* Input + chips + Generate */}
        <div className="space-y-3">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
            placeholder="Where can I cut down expenses? Should I save more? How am I doing this month?"
            rows={3}
            disabled={!isOnline}
            className="resize-none text-sm leading-relaxed"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onGenerate();
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInputValue(prompt)}
                disabled={!isOnline}
                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={onGenerate}
            disabled={!canSubmit}
            className="w-full rounded-2xl h-11"
          >
            {isLoading || isFetching ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Insights
              </>
            )}
          </Button>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400">
              Press <kbd className="font-bold">⌘</kbd>/<kbd className="font-bold">Ctrl</kbd> + <kbd className="font-bold">Enter</kbd>
            </p>
            <p className="text-[10px] font-bold text-slate-400 tabular-nums">
              {isOnline ? `${trimmedInput.length}/${MAX_QUESTION_LENGTH}` : ""}
            </p>
          </div>
        </div>

        {/* OK result */}
        {okResult && (
          <div className="border-t border-slate-100 pt-4 space-y-3 animate-slide-up">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Asked {formatRelativeTime(okResult.generatedAt)}
                </p>
                <p className="text-sm font-bold text-slate-700 truncate">
                  {okResult.question}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={isFetching || !isOnline}
                  title="Regenerate"
                  aria-label="Regenerate insights"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
                </button>
                <button
                  type="button"
                  onClick={reset}
                  title="Clear"
                  aria-label="Clear insights"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {displayAnswer}
                {typewriterActive && <span className="animate-pulse">▌</span>}
              </p>
            </div>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Your anonymized financial summary was sent to an AI language model to
              generate this. Transaction descriptions and references are not shared.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

type InsightBannerProps = {
  tone: "slate" | "amber";
  icon: React.ReactNode;
  title: string;
  body: string;
};

function InsightBanner({ tone, icon, title, body }: InsightBannerProps) {
  const palette =
    tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-900"
      : "bg-slate-50 border-slate-200 text-slate-700";
  const subText = tone === "amber" ? "text-amber-700" : "text-slate-500";
  const iconClass = tone === "amber" ? "text-amber-600" : "text-slate-400";
  return (
    <div className={`${palette} border rounded-2xl p-4 flex gap-3`}>
      <span className={`${iconClass} shrink-0 mt-0.5`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className={`text-xs mt-1 break-words ${subText}`}>{body}</p>
      </div>
    </div>
  );
}
