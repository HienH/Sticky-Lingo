# Sticky Lingo

A Spanish vocabulary iOS app. V0 is the stripped-down reading version: swipeable word cards with emoji, progress tracking, no audio, no games, no animations beyond card transitions.

## How to work with me

- This is V0. Respect the scope boundary below strictly.
- Always run `npx tsc --noEmit` after writing TypeScript. Don't commit broken types.
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

V0 is a passive, offline, read-only swipe experience. The only interactions are: swipe (next/prev), tap (flip card), and one typing input on Stage 3 pattern tests.

STOP and ask before adding any of these:
- Audio, TTS, or sound effects
- Animations beyond card swipe and tap-to-flip
- Auth, accounts, Supabase, IAP, RevenueCat
- Practice mode, games, gamification, streaks, XP
- Full-screen overlays, modals beyond simple flips
- Stage 5 content (placeholder screen only)

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
- `data/words.json` — all swipeable cards (Stages 1–4)
- `data/patterns.json` — English→Spanish ending rewrites (Stage 3 reference, 22 rules)
- `data/false_friends.json` — anti-cognates reference data
- `data/cheat_sheets.json` — grammar reference content (gender rules, -ería suffix, past participles, WEIRDO subjunctive, vowel-swap rule, LONERS/DIJON, VIN DIESEL — 7 sections from the Pattern Cheat Sheet sheet that don't fit the ending-rewrite schema)

The runtime seeder in `db/client.ts` reads all four and runs `INSERT OR IGNORE`, so re-running is safe.

### Sheet → destination mapping

| Sheet | Rows | Destination | Field mapping |
|---|---|---|---|
| Easy Associations | 222 | `words` Stage 1 | `memory_hook` ← "English Association / Memory Hook" col; `category` ← Type |
| Smart Hooks | 260 | `words` Stage 1 | `memory_hook` ← "Memory Hook" (+ Pictionary if present); `category` ← Hook Type |
| Themed Cognates | 64 | `words` Stage 1 | `category` ← Theme; no memory hook |
| Spanish for Spanish | 100 | `words` Stage 1 | Two sub-sections. **Standard rows** (top of sheet): `memory_hook` ← Breakdown + " — " + "How it teaches itself"; `category` = "Compound". **CONFUSING PAIRS** sub-section (rows 82+, schema `[spanish_A, eng_A, spanish_B, eng_B, trick]`): each row emits TWO Stage 1 cards (one per word), both sharing the trick as `memory_hook`; `category` = "Confusing pair". The literal template row "Word A / Meaning A / Word B / Meaning B" is skipped. Cells like `"veso/beso"` use the second (standard) spelling. Confusing pairs are emitted last in the Stage 1 pipeline so dedupe by `(spanish_word, stage)` keeps better hooks from earlier sheets when a word appears in both. |
| Formal English = Spanish | 227 | `words` Stage 2 + dual-write verbs to Stage 4 | `formal_english`, `english_meaning`, `category` (Daily/Business/Medical) |
| Cognates by Pattern | 380 | `words` Stage 3 | `pattern_id` ← Pattern Rule string |
| Pattern Cheat Sheet | 156 | `patterns` table (rows 2–23, 22 rules) + `cheat_sheets` table (rows 25+, 7 sections) | Patterns block: english_ending → spanish_ending → example → count_estimate → reliability. Cheat sheets block: each section becomes one row keyed by `section` slug, with `content_json` blob = `{column_headers, rows, sub_headers, footnotes}` preserving the spreadsheet shape verbatim. |
| False Friends (Watch Out) | 35 | `false_friends` table (reference) | spanish_word, looks_like, actually_means, real_spanish, example_sentence |

**Notes**
- Skip section-header rows (uppercase row in col 0, all other cols empty) — e.g. "VERBS", "PATTERN: -tion → -ción".
- The "Memory Hook" column already exists in the spreadsheet for sheets that have one; never invent or hardcode hooks for sheets without it.
- Verbs from the "Formal English = Spanish" sheet are dual-written: kept in Stage 2 *and* copied to Stage 4. Stage 4 also gets 20–30 hardcoded common verbs added separately later.
- False Friends are captured now for future UI; not surfaced in V0.
- Cheat sheet sections are captured now for future UI; not surfaced in V0. Section slugs are stable: `gender_rules`, `eria_suffix`, `past_participles`, `subjunctive_weirdo`, `subjunctive_vowel_swap`, `loners_dijon`, `vin_diesel`. The importer must fix two title/body misalignments in the source xlsx: the `NICE TO HAVE` banner (row 104) is a category divider, not a footnote on past participles; the `VIN DIESEL: irregular command verbs` header (row 145) is the real title for section 7, not a footnote on LONERS/DIJON.
- **-ería belongs in `cheat_sheets`, NOT `patterns`.** The `patterns` table is for English→Spanish ending rewrites (e.g. `-tion → -ción`); -ería is a Spanish-internal derivational suffix (`pan → panadería`) with no English ending involved.

### Done in V0 (formerly deferred)
- ✅ **-ería section** dual-written into Stage 1 cards (39 net new). Each row emits a derived "shop" card (`category="-ería suffix"`, hook `"base (meaning) + -ería = derived"`) and a base card (`category="-ería base"`); cross-sheet dedupe drops base words already in earlier Stage-1 sheets so the better hook wins. Source content stays in `cheat_sheets.eria_suffix` for future reference UI.
- ✅ **Past participles section** promoted to Stage 4 verb cards (31 verbs across `-ar/-er/-ir/irregular`, `category="Past participle: <group>"`). Source content stays in `cheat_sheets.past_participles`.

### Deferred opportunities (V1, not V0)
- **Gender rules + LONERS/DIJON** overlap heavily; if a "gender quiz" feature ever appears, both sections can feed a normalized `gender_rules (ending, gender, reliability, exceptions[])` table. For V0, leave as two separate `cheat_sheets` rows since the source author intentionally presents them as different mnemonics.

## Stages

### Stage 1: Easy Words (652 words from 5 sources)
Sources: Easy Associations (215), Smart Hooks (246), Themed Cognates (64), Spanish for Spanish (88 standard + 19 net new from CONFUSING PAIRS, after dedupe), -ería suffix promotions (~39 net new: 23 derived "shop" words + 16 base words not already covered by earlier sheets).
Card: emoji + Spanish word + memory hook (when present). No English translation needed.

### Stage 2: Formal English (221 words)
Source sheet: "Formal English = Spanish" (227 raw rows; 3 section-header rows skipped + 3 NOUNS/ADJECTIVES collisions merged into single cards with both meanings → 221 emitted). The 3 merged cards (`exterior`, `inferior`, `superior`) carry combined `english_meaning` like `"outside (n.) / outer (adj.)"`. Card: emoji + Spanish word + formal English cognate + everyday English meaning. Tap to flip for example sentence. Grouped by category (Daily, Business, Medical) — user picks category first, then swipes.

### Stage 3: Cognates by Pattern (~20 patterns, 366 words)
Source sheets: "Cognates by Pattern" (380 raw rows; 14 PATTERN section-header rows skipped → 366 emitted) + "Pattern Cheat Sheet" (22 ending rules in `patterns` table). First screen: ~20 patterns as tappable cards. Tap pattern → swipeable deck for that pattern. Last card in each deck: typing input to test conversion (accept with or without accents).

### Stage 4: Verbs (132 verbs)
Sources: verbs from "Formal English" sheet (dual-written by importer, 101 cognate verbs after Stage-4 dedupe) + 31 past-participle example verbs promoted from the cheat_sheets `past_participles` section (`-ar: 8`, `-er: 6`, `-ir: 5`, irregular: 12). Past-participle verbs win the dedupe over Formal English cognates for 3 overlaps (`decidir`, `descubrir`, `resolver`) — those still appear as Stage 2 cards. First screen: conjugation cheat sheet (-AR/-ER/-IR rules, yo/tú/él). Then swipeable verb cards: infinitive, English meaning, verb family tag, conjugations, mini example sentence. (`conjugations` is `null` on every imported verb today; population comes when a hardcoded verb list is added later if needed — the 132 cards may already be enough.)

### Stage 5: Coming Soon
Placeholder screen only.

## Always-Visible UI

### Word Counter (home screen, top right)
Increments when user swipes past a word for the first time. Shows total + noun/verb/adjective split. Persists across restarts via Zustand + AsyncStorage.

### Pattern Cheat Sheet Tab
Always accessible from tab navigator. Scrollable reference of the 22 ending-rewrite rules in the `patterns` table. English ending → Spanish ending → example → reliability. The 7 grammar reference sections in `cheat_sheets` (gender, subjunctive, irregulars, etc.) are NOT surfaced in V0 — captured for V1 reference UI.

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

- `theme/index.ts` — design tokens (colors, typography, spacing, radius, shadow), Nunito font loading.
- `db/schema.ts` — four tables:
  - `words` (Stages 1–4, with `memory_hook`, `pattern_id`, etc.) — UNIQUE on `(spanish_word, stage)`
  - `patterns` (Pattern Cheat Sheet ending rewrites) — UNIQUE on `(english_ending, spanish_ending)`
  - `false_friends` (anti-cognates reference) — UNIQUE on `spanish_word`
  - `cheat_sheets` (grammar reference content, 7 sections) — UNIQUE on `section`
- `db/client.ts` — `initDB()` creates all 4 tables + indices and runs `seedFromJSON()` (single transaction, `INSERT OR IGNORE` for all 4 datasets, count-check gate to skip on already-seeded DBs). `getWordsByStage(stage)` getter present. No runtime write functions; user state lives in Zustand.
- `scripts/import_data.py` — parses xlsx → emits `data/words.json` (1371 rows: stage1=652, stage2=221, stage3=366, stage4=132), `data/patterns.json` (22), `data/false_friends.json` (35), `data/cheat_sheets.json` (7 sections). Idempotent — byte-identical re-runs. Promotes -ería pairs to Stage 1 and past participles to Stage 4 from cheat_sheets data; merges NOUN/ADJ duplicates in Formal English into single cards instead of dropping.
- `scripts/requirements.txt` — pins `openpyxl`.