# Audit: Design Tokens

This document details every color, font, radius, and shadow currently configured in `styles.css` (Tailwind v4 `@theme inline` and `:root` / `.dark`), notes multi-screen usage, and maps them to the target variables specified in Phase 1 and `pasona-redesign.html`.

---

## 1. Typography

| Token Name | Current Definition | Used in Multi-Screen? | Target in Brief (Phase 1) |
| :--- | :--- | :--- | :--- |
| `--font-sans` | `"Manrope", ui-sans-serif, system-ui, sans-serif` | **Yes** (All screens body & UI) | `--font-ui`: Manrope across entire app shell |
| `--font-display` | `"Fraunces", ui-serif, Georgia, serif` | **Yes** (Headings, auth, splash) | Keep only where currently used for display; Manrope wins in UI shell |

---

## 2. Radii

| Token Name | Current Value | Used in Multi-Screen? | Target in Brief |
| :--- | :--- | :--- | :--- |
| `--radius-sm` | `calc(var(--radius) - 4px)` (~10px) | **Yes** (badges, small tags) | Standardize to mockup radii: 4px, 6px, 8px, 12px |
| `--radius-md` | `calc(var(--radius) - 2px)` (~12px) | **Yes** (buttons, inputs) | Standardize to 8px / 12px |
| `--radius-lg` | `var(--radius)` (14px) | **Yes** (cards, dialogs) | Standardize to 12px |
| `--radius-xl` | `calc(var(--radius) + 4px)` (18px) | **Yes** (hero cards) | Standardize to 12px |
| `--radius-2xl` | `calc(var(--radius) + 8px)` (22px) | **Yes** (modals, sheets) | Standardize |
| `--radius-full` | `9999px` | **Yes** (pills, avatars) | Retain for pills and toggle chips |

---

## 3. Shadows & Surface Elevations

| Token / Class | Current Definition | Used in Multi-Screen? | Target in Brief |
| :--- | :--- | :--- | :--- |
| `.card-shadow` | `0 1px 0 0 oklch(0.18 0.04 258 / 3%), 0 1px 2px -1px oklch(0.18 0.04 258 / 6%), 0 8px 24px -12px oklch(0.18 0.04 258 / 10%)` | **Yes** (Dashboard, Accounts, History cards) | One soft shadow across all cards and sheets |
| `.premium-gradient`| Triple gradient linear + radial (`navy-900` to `navy-700`) | **Yes** (Hero cards in Dashboard, Accounts, Categories) | Map to `--hero` and `--primary` tokens |
| `.auth-shell` | Multi-stop radial and linear dark navy backdrop | **Yes** (Login, Register, Password reset) | Retain |

---

## 4. Current Color Palette (`@theme inline` and `:root`)

| Variable | Current Value (Light) | Dark Value | Screens Used | Target Semantic Token (Phase 1) |
| :--- | :--- | :--- | :--- | :--- |
| `--color-navy-950` | `#0a1230` | `#0a1230` | **Multi** (Navbars, header, splash) | `--nav-bg` |
| `--color-navy-900` | `#101b45` | `#101b45` | **Multi** (Hero backgrounds, headers) | `--hero` |
| `--color-navy-700` | `#1b2d6b` | `#1b2d6b` | **Multi** (Buttons, active tabs) | `--primary` |
| `--background` | `oklch(0.985 0.004 250)` | `oklch(0.16 0.03 258)` | **Multi** (All page roots) | `--bg` |
| `--foreground` | `oklch(0.18 0.04 258)` | `oklch(0.97 0.005 250)` | **Multi** (Body copy, titles) | `--ink` |
| `--card` / `--surface` | `oklch(1 0 0)` | `oklch(0.21 0.04 260)` | **Multi** (Cards, dialogs, sheets) | `--surface` |
| `--muted` | `oklch(0.96 0.008 250)` | `oklch(0.27 0.04 260)` | **Multi** (Pills, secondary chips) | `--chip` / `--surface-2` |
| `--muted-foreground` | `oklch(0.5 0.025 258)` | `oklch(0.72 0.025 254)` | **Multi** (Subtitles, helper text) | `--muted` |
| `--border` | `oklch(0.18 0.04 258 / 7%)`| `oklch(1 0 0 / 8%)` | **Multi** (All card borders, dividers) | `--line` |
| `--input` | `oklch(0.18 0.04 258 / 10%)`| `oklch(1 0 0 / 12%)` | **Multi** (Form fields, search inputs) | `--line` / `--input` |
| `--color-amber` | `#d98e2a` | `#d98e2a` | **Multi** (Warnings, bills, add CTA) | `--warn` / `--add` |
| `--color-rose` | `#c1443b` | `#c1443b` | **Multi** (Expenses, overdue, deletes) | `--neg` |
| `--color-rose-soft` | `#f6e2e0` | `#f6e2e0` | **Multi** (Negative badges, alert bgs) | `--neg-soft` |
| `--color-emerald` | `#2f8f6b` | `#2f8f6b` | **Multi** (Income, matched status) | `--pos` |
| `--color-emerald-soft` | `#dcede5` | `#dcede5` | **Multi** (Positive badges) | `--pos-soft` |
| `--chart-1..--5` | Range of blues/teals/ambers | Range of blues/teals/ambers | **Multi** (Donut, trends, stack bar) | `--c1..--c8` |

---

## 5. Phase 1 Migration Targets

In Phase 1, these definitions will be consolidated onto `:root` CSS variables and switched via `data-skin` (`original` vs `fresh`) and `data-mode` (`light` vs `dark` vs `system`):
- `--bg`
- `--surface`
- `--surface-2`
- `--ink`
- `--muted`
- `--line`
- `--primary`
- `--primary-ink`
- `--accent`
- `--pos` / `--pos-soft`
- `--neg` / `--neg-soft`
- `--warn`
- `--info-soft`
- `--chip`
- `--nav-bg` / `--nav-ink`
- `--c1` through `--c8`
