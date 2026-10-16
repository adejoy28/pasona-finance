import React from "react";
import { Link } from "react-router";
import { ChevronRight, Circle } from "lucide-react";
import type { SetupTodoItem } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

interface FinishSettingUpCardProps {
  todos?: SetupTodoItem[];
  items?: SetupTodoItem[];
  className?: string;
}

export function FinishSettingUpCard({ todos, items, className = "" }: FinishSettingUpCardProps) {
  const list = todos ?? items ?? [];
  // Rendered only if at least one item is unmet
  const unmet = list.filter((t) => !t.completed);
  if (unmet.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Finish setting up"
      className={cn(
        "rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      <h3 className="font-semibold text-sm sm:text-base text-[var(--ink)] leading-snug mb-3">
        Finish setting up
      </h3>

      <div className="divide-y divide-[var(--line)]/60">
        {unmet.map((todo) => (
          <Link
            key={todo.id}
            to={todo.linkTo}
            className="py-2.5 flex items-center justify-between gap-3 group first:pt-0 last:pb-0 hover:opacity-85 transition-opacity"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Circle size={15} className="text-[var(--muted)] shrink-0" strokeWidth={1.8} />
              <span className="text-xs font-semibold text-[var(--ink)] truncate group-hover:text-[var(--primary)] transition-colors">
                {todo.label}
              </span>
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
