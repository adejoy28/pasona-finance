import React from "react";
import { Link } from "react-router";
import { AlertCircle, Target, TrendingUp, TrendingDown, Wallet, ChevronRight } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

export interface InsightItem {
  id: string;
  type: "overdue" | "budget" | "trend" | "savings";
  title: string;
  description: string;
  linkTo: string;
  tone: "neg" | "warn" | "pos" | "info";
}

interface InsightsCardProps {
  insights: InsightItem[];
  className?: string;
}

export function InsightsCard({ insights, className = "" }: InsightsCardProps) {
  const visible = insights.slice(0, 4);

  if (visible.length === 0) {
    return null;
  }

  const getIcon = (type: InsightItem["type"], tone: InsightItem["tone"]) => {
    switch (type) {
      case "overdue":
        return <AlertCircle size={15} className="text-[var(--neg)]" />;
      case "budget":
        return <Target size={15} className="text-amber-500" />;
      case "trend":
        return tone === "pos" ? (
          <TrendingDown size={15} className="text-[var(--pos)]" />
        ) : (
          <TrendingUp size={15} className="text-amber-500" />
        );
      case "savings":
        return <Wallet size={15} className="text-[var(--primary)]" />;
    }
  };

  return (
    <section
      aria-label="Insights"
      className={cn(
        "rounded-2xl p-4 sm:p-5 shadow-xs transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      <div className="mb-3">
        <h3 className="font-display font-semibold text-base sm:text-lg text-[var(--ink)] leading-snug">
          Insights
        </h3>
        <p className="text-[11px] font-semibold text-[var(--muted)] mt-0.5">
          What needs your attention
        </p>
      </div>

      <div className="divide-y divide-[var(--line)]/60">
        {visible.map((item) => (
          <Link
            key={item.id}
            to={item.linkTo}
            className="py-2.5 flex items-center gap-3 group hover:opacity-85 transition-opacity"
          >
            {/* Small Tinted Icon Container (per Addendum D: tone shown only by a small tinted icon, never filled rows) */}
            <div className="w-7 h-7 rounded-lg bg-[var(--chip)] flex items-center justify-center shrink-0">
              {getIcon(item.type, item.tone)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--ink)] leading-snug group-hover:text-[var(--primary)] transition-colors">
                {item.title}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate">
                {item.description}
              </p>
            </div>

            <ChevronRight
              size={14}
              className="text-[var(--muted)] shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
