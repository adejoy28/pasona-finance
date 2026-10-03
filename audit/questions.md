# Open questions (per brief §0: stop and record instead of guessing)

| # | Question | Blocks | Proposed default |
|---|---|---|---|
| 1 | Run **Phase 6 (category `kind`, `saved`/`spent` on `/api/summary`) before Phase 4**? Home's hero, donut and savings rate all depend on it. | Phase 4 | Yes — do 6 first. |
| 2 | Budgets tab currently routes to `/categories`. Keep that until Phase 7 builds the real Budgets screen? | Phase 2b | Yes, with a "Budgets coming soon" header on Categories. |
| 3 | Addendum B renames `data-mode` → `data-theme` and "System"/"Fresh" → "Auto"/"New". OK to migrate the stored `pasona.theme` value silently? | Phase 2b | Yes, map old values on read. |
| 4 | Final policy text (Privacy, Terms, Data and security, Licences) for Help and legal. | Phase 9 | Reuse existing `PrivacyPage` / `TermsPage` content until supplied. |
| 5 | Mary needs a Groq API key in backend `.env` (`GROQ_API_KEY`). Is one available, and is the existing AI chat backend reusable? | Phase 9b | Reuse existing AI endpoint config if present. |
| 6 | Quick-log sentence parsing: client-side only (regex for amount + known account/category names), or via Mary's backend? | Phase 4 | Client-side, no network, so it works offline. |
