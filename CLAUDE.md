# Sticky Lingo

A Spanish vocabulary iOS app. V0 is the stripped-down reading version: swipeable word cards with emoji, progress tracking, no audio, no games, no animations beyond card transitions.

## How to work with me

- This is V0. Respect the scope boundary below strictly.
- Always run `npx tsc --noEmit` after writing TypeScript. Don't commit broken types.
- **Always run `@reviewer` before committing.** Surface blockers/concerns to the user and only commit after the user approves (either fix-then-commit or accept-and-commit).
- Always commit after each completed task with a clear message.
- The card swiper component is the single most important piece. Build it well, every stage uses it.
- When unsure, the simpler version is correct.
- Default to asking. Cheap to confirm, expensive to undo.

## When to stop and ask

- Adding any feature in the V0 scope boundary
- Adding any library not already in package.json
- Making architectural decisions not specified in this file
- Anything that would take more than 100 lines to implement
- Anything that requires modifying more than 5 files

## V0 Scope Boundary

V0 is a passive, offline, read-only swipe experience. The only interactions are: swipe (next/prev), tap (flip card on Stage 5), and one typing input on Stage 6 pattern tests.

STOP and ask before adding any of these:
- Audio, TTS, or sound effects
- Animations beyond card swipe and tap-to-flip
- Auth, accounts, Supabase, IAP, RevenueCat
- Practice mode, games, gamification, streaks, XP
- Full-screen overlays, modals beyond simple flips

## Tech Stack

- Expo (managed workflow) + TypeScript
- Expo Router (file-based navigation)
- Zustand + persist middleware (state management)
- expo-sqlite (offline word data only — immutable content)
- react-native-reanimated (swipe gestures and card transitions)
- react-native-gesture-handler (swipe detection)

No other libraries without asking.

## Design System

All styling comes from `theme/index.ts`. Never inline colors, font sizes, or spacing values in components.

- Colors: import from `theme.colors`
- Typography: import from `theme.typography` (Nunito font family)
- Spacing: import from `theme.spacing` (4pt grid)
- Border radius: import from `theme.radius`
- Shadows: import from `theme.shadow`

Use React Native's StyleSheet API. NativeWind/Tailwind is not used.

If a component needs a value not in `theme/index.ts`, add it there first, then use it. Never hardcode hex codes, font sizes, or spacing pixels in components.

Brand identity: warm and approachable. Coral primary (#FF6B5B), generous whitespace, friendly Nunito typography. The vibe is "you already know more than you think" — encouraging, not academic.

## Source Data

`data/spanish_english_cognates.xlsx` contains all word data across **8 sheets** (~1300 rows total). Parse it, don't hardcode.

The parser is `scripts/import_data.py` (uses `openpyxl`, dev-only — see `scripts/requirements.txt`). It emits four JSON files committed to the repo:
- `data/words.json` — all swipeable word cards (Stages 1–7)
- `data/patterns.json` — English→Spanish ending rewrites (Stage 6 reference + Pattern Cheat Sheet tab, 22 rules)
- `data/false_friends.json` — Stage 8 source data (35 anti-cognates)
- `data/cheat_sheets.json` — grammar reference content (gender rules, -ería suffix, past participles, WEIRDO subjunctive, vowel-swap rule, LONERS/DIJON, VIN DIESEL — 7 sections from the Pattern Cheat Sheet sheet that don't fit the ending-rewrite schema)

The runtime seeder in `db/client.ts` reads all four and runs `INSERT OR IGNORE`, so re-running is safe.

### Sheet → stage mapping

V0 is sheet-aligned: each spreadsheet sheet maps to its own home-screen stage. The only derived stage is Stage 7 (Verbs), because verbs come from two sheets.

| Sheet | Rows | Destination | Field mapping |
|---|---|---|---|
| Easy Associations | 222 | `words` Stage 1 | `memory_hook` ← "English Association / Memory Hook" col; `category` ← Type; `subsection` ← section header (7 groups, e.g. "BRAND NAMES THAT ARE SPANISH WORDS") |
| Smart Hooks | 260 | `words` Stage 2 | `memory_hook` ← "Memory Hook" (+ Pictionary if present); `category` ← Hook Type; `subsection` ← section header (14 groups, e.g. "PREFIXES (word-building multiplier)", "ANIMALS") |
| Themed Cognates | 64 | `words` Stage 3 | `category` ← Theme; no memory hook; `subsection` = null (already grouped via Theme/category) |
| Spanish for Spanish | 100 | `words` Stage 4 | Three sub-sections, each driven by a section-header banner: **COMPOUND WORDS (mini-sentences)**: `memory_hook` ← Breakdown + " — " + "How it teaches itself"; `category` = "Compound". **WORD FAMILIES (one root = many words)**: same column shape as Compound; `category` = "Word family". **CONFUSING PAIRS (memorize one, get the other free)**: schema `[spanish_A, eng_A, spanish_B, eng_B, trick]`; each row emits TWO Stage 4 cards, both sharing the trick; `category` = "Confusing pair". The literal template row "Word A / Meaning A / Word B / Meaning B" is skipped. Cells like `"veso/beso"` use the second (standard) spelling. `subsection` ← verbatim section-header text on every emitted card. |
| Formal English = Spanish | 227 | `words` Stage 5 + dual-write verbs to Stage 7 | `formal_english`, `english_meaning`, `category` (Daily/Business/Medical), `subsection` ← section header (VERBS / NOUNS / ADJECTIVES). Stage 5 sub-picker uses `subsection`; `category` is rendered as a small chip on each card. |
| Cognates by Pattern | 380 | `words` Stage 6 | `pattern_id` ← Pattern Rule string; `subsection` = null (Stage 6 picker uses `pattern_id`) |
| Pattern Cheat Sheet | 156 | `patterns` table (rows 2–23, 22 rules) + `cheat_sheets` table (rows 25+, 7 sections); past-participle rows also promoted to Stage 7 | Patterns block: english_ending → spanish_ending → example → count_estimate → reliability. Cheat sheets block: each section becomes one row keyed by `section` slug, with `content_json` blob = `{column_headers, rows, sub_headers, footnotes}` preserving the spreadsheet shape verbatim. |
| False Friends (Watch Out) | 35 | `false_friends` table → Stage 8 cards | spanish_word, looks_like, actually_means, real_spanish, example_sentence |

**Notes**
- Skip section-header rows (uppercase row in col 0, all other cols empty) — e.g. "VERBS", "PATTERN: -tion → -ción". The header text is captured into the `subsection` field on each row that follows it (Stages 1, 2, 4, 5).
- The "Memory Hook" column already exists in the spreadsheet for sheets that have one; never invent or hardcode hooks for sheets without it.
- **Stage 7 is the only derived stage**: verbs from "Formal English = Spanish" are dual-written (kept in Stage 5 *and* copied to Stage 7) with `subsection = "VERBS"`, and 31 past-participle example verbs are promoted from `cheat_sheets.past_participles` with `subsection = null`. Stage 7 has no sub-picker, so dedupe ignores `subsection` for Stage 7 — past-participle cards shadow Formal-English Stage 7 cards on the 3 overlaps (decidir, descubrir, resolver). Those still appear as Stage 5 cards.
- **No cross-sheet dedupe**: a Spanish word that appears in multiple sheets now appears in each sheet's stage. Within-sheet dedupe is by `(spanish_word, stage, subsection)` — same word can co-exist in different subsections of one stage (e.g. `exterior` is both a NOUN and an ADJECTIVE on Stage 5; `caballo` is both a PICTIONARY card and an ANIMAL on Stage 2).
- Cheat sheet sections are captured now for future UI; only `past_participles` is currently surfaced (as Stage 7 cards). Section slugs are stable: `gender_rules`, `eria_suffix`, `past_participles`, `subjunctive_weirdo`, `subjunctive_vowel_swap`, `loners_dijon`, `vin_diesel`. The importer must fix two title/body misalignments in the source xlsx: the `NICE TO HAVE` banner (row 104) is a category divider, not a footnote on past participles; the `VIN DIESEL: irregular command verbs` header (row 145) is the real title for section 7, not a footnote on LONERS/DIJON.
- **-ería belongs in `cheat_sheets`, NOT `patterns`.** The `patterns` table is for English→Spanish ending rewrites (e.g. `-tion → -ción`); -ería is a Spanish-internal derivational suffix (`pan → panadería`) with no English ending involved. Under sheet=stage, -ería is reference-only — it does NOT promote to any swipeable stage.

### Deferred opportunities (V1, not V0)
- **-ería section** lives only in `cheat_sheets.eria_suffix`. If a V1 reference UI surfaces it, render the section content directly; do not re-promote to Stage 1.
- **Gender rules + LONERS/DIJON** overlap heavily; if a "gender quiz" feature ever appears, both sections can feed a normalized `gender_rules (ending, gender, reliability, exceptions[])` table. For V0, leave as two separate `cheat_sheets` rows since the source author intentionally presents them as different mnemonics.

## Stages

Each spreadsheet sheet is its own stage (sheet = stage). Stage 7 is the only derived stage.

### Stage 1: Easy Associations (215 words, 7 subsections)
Source: "Easy Associations" sheet (222 raw rows; 7 section headers skipped → 215, exact 1:1 with sheet data rows). Sub-picker by `subsection` (e.g. "BRAND NAMES THAT ARE SPANISH WORDS", "BODY PARTS", "FOOD WORDS YOU ALREADY USE"); user picks one, then swipes. Card: emoji + Spanish word + memory hook.

### Stage 2: Smart Hooks (246 words, 14 subsections)
Source: "Smart Hooks" sheet (260 raw rows; 14 section headers skipped → 246, exact 1:1 with sheet data rows). Sub-picker by `subsection` (e.g. "PREFIXES", "ANIMALS", "PICTIONARY WORDS"). Card: emoji + Spanish word + memory hook (+ Pictionary appended if present). Same Spanish word can appear in multiple subsections (caballo, perro, gato, lobo, cerdo each appear under both PICTIONARY and ANIMALS — 5 cards × 2 subsections).

### Stage 3: Themed Cognates (64 words)
Source: "Themed Cognates" sheet (64 raw rows). Card: emoji + Spanish word + English meaning + theme label. No memory hook. No sub-picker — `Theme` lives in `category` and is shown inline.

### Stage 4: Spanish for Spanish (119 words, 3 subsections)
Source: "Spanish for Spanish" sheet (33 Compound + 39 Word Family standard rows + 47 confusing-pair cards = 119 after dedupe). Sub-picker by `subsection`: COMPOUND WORDS / WORD FAMILIES / CONFUSING PAIRS. Card: emoji + Spanish word + memory hook.

### Stage 5: Formal English (224 words, 3 subsections)
Source: "Formal English = Spanish" sheet (224 raw rows after section-header skips; exact 1:1 with sheet data rows). Sub-picker by `subsection`: VERBS / NOUNS / ADJECTIVES. Words like `exterior`, `inferior`, `superior` appear in both NOUNS and ADJECTIVES with their respective meanings. Card: small `category` chip (Daily/Business/Medical) + Spanish word + formal English cognate + everyday English meaning. Tap to flip for example sentence.

### Stage 6: Cognates by Pattern (~20 patterns, 366 words)
Source: "Cognates by Pattern" sheet (380 raw rows; 14 PATTERN section-header rows skipped → 366 emitted). First screen: ~20 patterns as tappable cards. Tap pattern → swipeable deck for that pattern. Last card in each deck: typing input to test conversion (accept with or without accents). Picker uses `pattern_id`, not `subsection`.

### Stage 7: Verbs (combined) (132 verbs)
The only derived stage. Sources: 104 cognate verbs dual-written from "Formal English = Spanish" (subsection="VERBS") + 31 past-participle example verbs promoted from `cheat_sheets.past_participles` (subsection=null). Stage 7 dedupe ignores `subsection` so past-participle cards shadow Formal-English Stage 7 cards on 3 overlaps (`decidir`, `descubrir`, `resolver`). Those still appear as Stage 5 cards. First screen: conjugation cheat sheet (-AR/-ER/-IR rules, yo/tú/él) — past-participle decks show a participle-rules variant instead. Then swipeable verb cards: infinitive, English meaning, verb family tag, mini example sentence. No sub-picker.

### Stage 8: False Friends (35 cards)
Source: "False Friends (Watch Out)" sheet, read via `getFalseFriends()` (not `words` table). Card: spanish_word in bold, "Looks like" / "Actually means" / "For '<looks_like>' use" rows, example sentence. No memory hook field — false friends use their own row schema.

## Always-Visible UI

### Card Counter (home screen, top right)
Increments when user swipes past a card for the first time. Total = `words.json` rows + `false_friends.json` rows (currently 1366 + 35 = 1401). Persists across restarts via Zustand + AsyncStorage. Persist version is **2**; v1 → v2 reset `seenKeys` because stage numbering changed from 1–4 to 1–8 and the old `${stage}:${word}` keys would otherwise be ambiguous.

### Pattern Cheat Sheet Tab
Always accessible from tab navigator. Scrollable reference of the 22 ending-rewrite rules in the `patterns` table. English ending → Spanish ending → example → reliability. The 7 grammar reference sections in `cheat_sheets` (gender, -ería, subjunctive, past participles, irregulars, etc.) are stored but NOT surfaced as a reference UI in V0 — `past_participles` is the only one currently consumed (by Stage 7 cards).

## Onboarding (first launch only)

- Screen 1: Welcome + tagline + select language [Spanish]
- Screen 2: Example card "mosquito = mosquito 🦟"
- Screen 3: "You already know more Spanish than you think" → go to Stage 1

## Architecture Principles

- The card swiper is the core reusable component. Build it once, every stage uses it.
- Offline-first. Everything works without internet.
- Let the data drive the UI. One word model serves all stages.
- Keep it simple. This is V0.
- **State split:** SQLite holds immutable content (words, emojis, conjugations, patterns, false friends, cheat sheets). All user/progress state — including which words have been seen, the word counter, and onboarding flags — lives in Zustand and persists via AsyncStorage. SQLite is never written to at runtime after initial seeding.

## Card Swiper Component

The most important component. Must:
- Show one card at a time, centered on screen
- Swipe right = next card, swipe left = previous card
- Show progress counter "X / total" on each card (top right)
- Support different card layouts per stage
- Accept any array of data and a render function for card content
- Trigger callback when a new card is shown (for word counter)

## Emoji Strategy

Map each word to an emoji during data import. Store in SQLite alongside the word. For words without a good match, leave blank and show the word larger. Good enough is fine. Current coverage: ~10% of imported words have an emoji (the obvious-match dictionary in `scripts/import_data.py`); the other 90% render as a larger Spanish word with no emoji. Expand the dictionary opportunistically — never force a match.

## Subagents

Defined in `.claude/agents/`. Add only when pain justifies it.

- **@reviewer** — Read-only review after each completed feature. Active from day one.
- **@data-importer** — Parses spreadsheet, populates SQLite, maps emojis. Activate when starting data import work.

When tasks are independent, spawn agents in parallel. When sequential, chain them. Don't delegate trivial work — handoff overhead exceeds the value.

## File References

- `data/spanish_english_cognates.xlsx` — all word data (8 sheets, ~1300 rows)
- `data/words.json` / `data/patterns.json` / `data/false_friends.json` / `data/cheat_sheets.json` — generated by `scripts/import_data.py`, committed to repo, bundled with the app
- `scripts/requirements.txt` — `openpyxl` (dev-only, importer dependency; never bundled with the app)

## What Exists So Far

(Update this section after each completed task.)

- `theme/index.ts` — design tokens (colors, typography, spacing, radius, shadow), Nunito font loading. 8 stage accent colors (stage1–stage8), warm→cool sequence.
- `db/schema.ts` — four tables:
  - `words` (Stages 1–7, with `memory_hook`, `pattern_id`, `subsection`, etc.) — UNIQUE INDEX on `(spanish_word, stage, COALESCE(subsection, ''))` so the same word can co-exist in different subsections of one stage
  - `patterns` (Pattern Cheat Sheet ending rewrites) — UNIQUE on `(english_ending, spanish_ending)`
  - `false_friends` (Stage 8 source) — UNIQUE on `spanish_word`
  - `cheat_sheets` (grammar reference content, 7 sections) — UNIQUE on `section`
- `db/client.ts` — `initDB()` creates all 4 tables + indices and runs `seedFromJSON()` (single transaction, `INSERT OR IGNORE` for all 4 datasets, count-check gate to skip on already-seeded DBs). `getWordsByStage(stage)` and `getFalseFriends()` getters present. No runtime write functions; user state lives in Zustand.
- `scripts/import_data.py` — parses xlsx → emits `data/words.json` (1366 rows: stage1=215, stage2=246, stage3=64, stage4=119, stage5=224, stage6=366, stage7=132), `data/patterns.json` (22), `data/false_friends.json` (35), `data/cheat_sheets.json` (7 sections). Idempotent — byte-identical re-runs. Sheet-aligned: each sheet emits its own stage with row counts matching the sheet's data rows 1:1 (Stages 1, 2, 3, 5, 6 exact; Stage 4 expands confusing-pair rows 1→2 cards each; Stages 7 derived). Captures section-header text into the `subsection` field on Stages 1, 2, 4, 5. Promotes past-participle verbs to Stage 7. -ería section is parsed but stays reference-only (does not promote to any stage).
- `scripts/requirements.txt` — pins `openpyxl`.
- `state/progress.ts` — Zustand store, persisted via AsyncStorage. Persist `version: 2` — v1 → v2 migration resets `seenKeys` because stage numbering shifted.
- `utils/format.ts` — `sentenceCase()` helper for displaying SHOUTY xlsx subsection labels (e.g. "BRAND NAMES THAT ARE SPANISH WORDS" → "Brand names that are spanish words"). Source data stays verbatim.
- `app/(home)/` — 8 stage routes (`stage1.tsx`–`stage8.tsx`) + `index.tsx` (8 home tiles) + `_layout.tsx` (Stack). Stages 1, 2, 4 each have a `subsection` sub-picker (Stage 6 model), then a swiper. Stage 3 is a simple swiper (no picker, theme shown inline). Stage 5 is Formal English with `subsection` sub-picker (VERBS/NOUNS/ADJECTIVES) + tap-to-flip example, `category` (Daily/Business/Medical) shown as small chip on each card. Stage 6 is Patterns with pattern sub-picker + typing quiz on the last card. Stage 7 is Verbs with conjugation/past-participle cheat-sheet first card + verb cards (no sub-picker). Stage 8 is False Friends with a custom multi-row card (no sub-picker).
- `app/cheatsheet.tsx` — always-visible Patterns reference tab.