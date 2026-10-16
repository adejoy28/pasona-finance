import React from "react";
import { Link } from "react-router";
import { AlertCircle, ChevronRight, Copy, Mail, RefreshCw, AlertTriangle } from "lucide-react";
import type { AttentionItem } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

interface NeedsAttentionCardProps {
  items?: AttentionItem[];
  className?: string;
}

export function NeedsAttentionCard({ items = [], className = "" }: NeedsAttentionCardProps) {
  if (items.length === 0) {
    return null;
  }

  const getRowIcon = (type: AttentionItem["type"]) => {
    switch (type) {
      case "overdue":
        return (
          <div className="w-6 h-6 rounded-[3px] bg-[var(--neg-soft)] text-[var(--neg)] flex items-center justify-center shrink-0">
            <AlertCircle size={13} strokeWidth={2.5} />
          </div>
        );
      case "duplicate":
        return (
          <div className="w-6 h-6 rounded-[3px] bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Copy size={13} strokeWidth={2.5} />
          </div>
        );
      case "over_budget":
        return (
          <div className="w-6 h-6 rounded-[3px] bg-[var(--neg-soft)] text-[var(--neg)] flex items-center justify-center shrink-0">
            <AlertTriangle size={13} strokeWidth={2.5} />
          </div>
        );
      case "near_budget":
        return (
          <div className="w-6 h-6 rounded-[3px] bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={13} strokeWidth={2.5} />
          </div>
        );
      case "verify_email":
        return (
          <div className="w-6 h-6 rounded-[3px] bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Mail size={13} strokeWidth={2.5} />
          </div>
        );
      case "pending_sync":
        return (
          <div className="w-6 h-6 rounded-[3px] bg-[var(--chip)] text-[var(--muted)] flex items-center justify-center shrink-0">
            <RefreshCw size={13} strokeWidth={2.5} />
          </div>
        );
    }
  };

  return (
    <section
      aria-label="Needs attention"
      className={cn(
        "rounded-[6px] p-3 sm:p-3.5 shadow-[var(--lift)] transition-all",
        "bg-[var(--surface)] border border-amber-500/30 text-[var(--ink)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Needs attention
        </span>
        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="divide-y divide-[var(--line)]/50">
        {items.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            to={item.linkTo}
            className="py-2 flex items-center justify-between gap-2.5 group first:pt-0 last:pb-0 hover:opacity-85 transition-opacity"
          >
            <div className="flex items-center gap-2 min-w-0">
              {getRowIcon(item.type)}
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--ink)] truncate group-hover:text-[var(--primary)] transition-colors">
                  {item.title}
                </p>
                <p className="text-[10.5px] text-[var(--muted)] font-medium truncate">
                  {item.detail}
                </p>
              </div>
            </div>
            <ChevronRight
              size={13}
              className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform shrink-0"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
