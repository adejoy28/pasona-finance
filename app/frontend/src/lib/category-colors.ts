/**
 * Category Color Palette Helpers
 * Maps categories deterministically to the Phase 1 / redesign design tokens (--c1 through --c8).
 */

export const CATEGORY_PALETTE = [
  "var(--c1)", // blue
  "var(--c2)", // orange
  "var(--c3)", // emerald
  "var(--c4)", // amber
  "var(--c5)", // pink
  "var(--c6)", // green
  "var(--c7)", // purple
  "var(--c8)", // gray / other
];

export function getCategoryColor(name?: string | null, id?: number | null): string {
  if (id !== undefined && id !== null && id > 0) {
    return CATEGORY_PALETTE[(id - 1) % (CATEGORY_PALETTE.length - 1)];
  }
  if (!name) return "var(--c8)";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_PALETTE[Math.abs(hash) % (CATEGORY_PALETTE.length - 1)];
}
