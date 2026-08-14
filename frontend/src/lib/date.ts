// Shared date helpers. All functions return or compare plain
// `YYYY-MM-DD` strings — the format the API speaks and the format
// `transaction_date` arrives in.
//
// Two rules keep this module safe:
//
//   1. `toDateOnlyIso` never constructs a `Date`. Transaction dates come
//      back with a mixed delimiter ("2026-08-03", "2026-08-03 14:22:00",
//      "2026-08-03T14:22:00Z"), and parsing a late-evening datetime in a
//      negative-offset timezone would shift it to the previous day.
//      String surgery is deterministic; `Date` is not.
//   2. Range checks are lexicographic. Zero-padded `YYYY-MM-DD` sorts
//      correctly as a string, so no parsing is needed to compare.
//
// Calendar arithmetic (month boundaries, "3 months back") does use
// date-fns, because month lengths make hand-rolling it a bug farm.

import { format, startOfMonth, startOfYear, subDays, subMonths } from "date-fns";

const ISO_DATE_LENGTH = 10; // "YYYY-MM-DD"
const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

/**
 * Normalize any API date string to `YYYY-MM-DD`.
 *
 * Handles the date-only, space-delimited, and `T`-delimited forms that
 * all appear in `transaction_date`. Input that doesn't start with an ISO
 * date is returned trimmed but otherwise untouched, so unexpected data
 * degrades to a harmless non-match instead of `NaN`.
 */
export function toDateOnlyIso(raw: string): string {
  const trimmed = raw.trim();
  if (!ISO_DATE_PREFIX.test(trimmed)) return trimmed;
  return trimmed.slice(0, ISO_DATE_LENGTH);
}

function asDate(from?: string): Date {
  return from ? new Date(from) : new Date();
}

function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Today as `YYYY-MM-DD`. */
export function todayIso(from?: string): string {
  return toIso(asDate(from));
}

/** `days` days before today, as `YYYY-MM-DD`. */
export function daysAgoIso(days: number, from?: string): string {
  return toIso(subDays(asDate(from), days));
}

/** First day of the current month. */
export function startOfMonthIso(from?: string): string {
  return toIso(startOfMonth(asDate(from)));
}

/** First day of the previous month. */
export function startOfPreviousMonthIso(from?: string): string {
  return toIso(startOfMonth(subMonths(asDate(from), 1)));
}

/** January 1st of the current year. */
export function startOfYearIso(from?: string): string {
  return toIso(startOfYear(asDate(from)));
}

/**
 * First day of the month `months - 1` months back, so that
 * `startOfMonthsAgoIso(3)` covers three calendar months *including* the
 * current one.
 */
export function startOfMonthsAgoIso(months: number, from?: string): string {
  return toIso(subMonths(startOfMonth(asDate(from)), Math.max(0, months - 1)));
}

/**
 * Inclusive range check on `YYYY-MM-DD` strings. Omitted bounds are
 * treated as open.
 */
export function isIsoInRange(dateOnly: string, from?: string, to?: string): boolean {
  if (from && dateOnly < from) return false;
  if (to && dateOnly > to) return false;
  return true;
}

// ---------------------------------------------------------------------
// Dashboard period selection
// ---------------------------------------------------------------------

export type DashboardPeriod = "month" | "3m" | "6m" | "year";

export const DASHBOARD_PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: "month", label: "This Month" },
  { id: "3m", label: "3 Months" },
  { id: "6m", label: "6 Months" },
  { id: "year", label: "This Year" },
];

export type PeriodRange = { from: string; to: string };

/**
 * Date range for a dashboard period.
 *
 * The result is used inside a TanStack Query key, so it must be
 * referentially stable across renders for a given period — otherwise the
 * key churns and the query refetches forever. Results are memoized per
 * period, keyed by the current day so the range still rolls over at
 * midnight.
 */
const rangeCache = new Map<string, PeriodRange>();

export function periodRange(period: DashboardPeriod): PeriodRange {
  const to = todayIso();
  const cacheKey = `${period}:${to}`;
  const cached = rangeCache.get(cacheKey);
  if (cached) return cached;

  let from: string;
  switch (period) {
    case "3m":
      from = startOfMonthsAgoIso(3);
      break;
    case "6m":
      from = startOfMonthsAgoIso(6);
      break;
    case "year":
      from = startOfYearIso();
      break;
    case "month":
    default:
      from = startOfMonthIso();
      break;
  }

  const range: PeriodRange = { from, to };
  rangeCache.set(cacheKey, range);
  return range;
}
