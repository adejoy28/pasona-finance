import React from "react";
import { Link } from "react-router";
import { AlertCircle, ChevronRight, Copy, Mail, RefreshCw, AlertTriangle } from "lucide-react";
import type { AttentionItem } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

interface NeedsAttentionCardProps {
  items: AttentionItem[];
  className?: string;
}

export function NeedsAttentionCard({ items, className = "" }: NeedsAttentionCardProps) {
  if (items.length === 0) {
    return null;
  }

  const getRowIcon = (type: AttentionItem["type"]) => {
    switch (type) {
      case "overdue":
        return (
          <div className="w-7 h-7 rounded-[4px] bg-[var(--neg-soft)] text-[var(--neg)] flex items-center justify-center shrink-0">
            <AlertCircle size={15} />
          </div>
        );
      case "duplicate":
        return (
          <div className="w-7 h-7 rounded-[4px] bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Copy size={15} />
          </div>
        );
      case "over_budget":
        return (
          <div className="w-7 h-7 rounded-[4px] bg-[var(--neg-soft)] text-[var(--neg)] flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
        );
      case "near_budget":
        return (
          <div className="w-7 h-7 rounded-[4px] bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
        );
      case "verify_email":
        return (
          <div className="w-7 h-7 rounded-[4px] bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Mail size={15} />
          </div>
        );
      case "pending_sync":
        return (
          <div className="w-7 h-7 rounded-[4px] bg-[var(--chip)] text-[var(--muted)] flex items-center justify-center shrink-0">
            <RefreshCw size={15} />
          </div>
        );
    }
  };

  return (
    <section
      aria-label="Needs attention"
      className={cn(
        "rounded-[6px] p-4 sm:p-5 shadow-[var(--lift)] transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      <h3 className="font-semibold text-sm sm:text-base text-[var(--ink)] leading-snug mb-3">
        Needs attention
      </h3>

      <div className="divide-y divide-[var(--line)]/60">
        {items.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            to={item.linkTo}
            className="py-2.5 flex items-center justify-between gap-3 group first:pt-0 last:pb-0 hover:opacity-85 transition-opacity"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {getRowIcon(item.type)}
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--ink)] truncate group-hover:text-[var(--primary)] transition-colors">
                  {item.title}
                </p>
                <p className="text-[11px] text-[var(--muted)] font-medium truncate mt-0.5">
                  {item.detail}
                </p>
              </div>
            </div>
            <ChevronRight
              size={14}
              className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform shrink-0"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
