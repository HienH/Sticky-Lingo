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
- expo-sqlite (offline word data + progress)
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

`data/spanish_english_cognates.xlsx` contains all word data across 7 sheets. Parse it, don't hardcode.

## Stages

### Stage 1: Easy Words (222 words)
Source sheet: "Easy Associations". Card: emoji + Spanish word + memory hook. No English translation needed.

### Stage 2: Formal English (227 words)
Source sheet: "Formal English = Spanish". Card: emoji + Spanish word + formal English cognate + everyday English meaning. Tap to flip for example sentence. Grouped by category (Daily, Business, Medical) — user picks category first, then swipes.

### Stage 3: Cognates by Pattern (20 patterns, 380 words)
Source sheets: "Cognates by Pattern" + "Pattern Cheat Sheet". First screen: 20 patterns as tappable cards. Tap pattern → swipeable deck for that pattern. Last card in each deck: typing input to test conversion (accept with or without accents).

### Stage 4: Verbs (~50 verbs)
Source: verbs from "Formal English" sheet + 20–30 hardcoded common verbs. First screen: conjugation cheat sheet (-AR/-ER/-IR rules, yo/tú/él). Then swipeable verb cards: infinitive, English meaning, verb family tag, conjugations, mini example sentence.

### Stage 5: Coming Soon
Placeholder screen only.

## Always-Visible UI

### Word Counter (home screen, top right)
Increments when user swipes past a word for the first time. Shows total + noun/verb/adjective split. Persists across restarts via Zustand + AsyncStorage.

### Pattern Cheat Sheet Tab
Always accessible from tab navigator. Scrollable reference of all 20 pattern rules. English ending → Spanish ending → example → reliability.

## Onboarding (first launch only)

- Screen 1: Welcome + tagline + select language [Spanish]
- Screen 2: Example card "mosquito = mosquito 🦟"
- Screen 3: "You already know more Spanish than you think" → go to Stage 1

## Architecture Principles

- The card swiper is the core reusable component. Build it once, every stage uses it.
- Offline-first. Everything works without internet.
- Let the data drive the UI. One word model serves all stages.
- Keep it simple. This is V0.

## Card Swiper Component

The most important component. Must:
- Show one card at a time, centered on screen
- Swipe right = next card, swipe left = previous card
- Show progress counter "X / total" on each card (top right)
- Support different card layouts per stage
- Accept any array of data and a render function for card content
- Trigger callback when a new card is shown (for word counter)

## Emoji Strategy

Map each word to an emoji during data import. Store in SQLite alongside the word. For words without a good match, leave blank and show the word larger. Good enough is fine.

## Subagents

Defined in `.claude/agents/`. Add only when pain justifies it.

- **@reviewer** — Read-only review after each completed feature. Active from day one.
- **@data-importer** — Parses spreadsheet, populates SQLite, maps emojis. Activate when starting data import work.

When tasks are independent, spawn agents in parallel. When sequential, chain them. Don't delegate trivial work — handoff overhead exceeds the value.

## File References

- `data/spanish_english_cognates.xlsx` — all word data (7 sheets, ~1000 words)

## What Exists So Far

(Update this section after each completed task.)

Nothing yet. Starting from scratch.