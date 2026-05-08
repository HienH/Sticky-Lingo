import * as SQLite from 'expo-sqlite';

import cheatSheetsData from '../data/cheat_sheets.json';
import falseFriendsData from '../data/false_friends.json';
import patternsData from '../data/patterns.json';
import wordsData from '../data/words.json';

import {
  CREATE_CHEAT_SHEETS_SORT_INDEX,
  CREATE_CHEAT_SHEETS_TABLE,
  CREATE_FALSE_FRIENDS_TABLE,
  CREATE_PATTERNS_TABLE,
  CREATE_WORDS_STAGE_INDEX,
  CREATE_WORDS_TABLE,
  CREATE_WORDS_UNIQUE_INDEX,
  Conjugations,
  FalseFriendRow,
  Word,
  WordRow,
} from './schema';

// Bumped from 'stickylingo.db' when the words table gained the `subsection`
// column. CREATE TABLE IF NOT EXISTS won't add a column to an existing table,
// so installed apps with the v1 schema would crash on the new UNIQUE INDEX
// that references subsection. A new filename forces a fresh DB on next launch.
const DB_NAME = 'stickylingo.v2.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function initDB(): Promise<void> {
  try {
    const db = await getDB();
    await db.execAsync(CREATE_WORDS_TABLE);
    await db.execAsync(CREATE_WORDS_STAGE_INDEX);
    await db.execAsync(CREATE_WORDS_UNIQUE_INDEX);
    await db.execAsync(CREATE_PATTERNS_TABLE);
    await db.execAsync(CREATE_FALSE_FRIENDS_TABLE);
    await db.execAsync(CREATE_CHEAT_SHEETS_TABLE);
    await db.execAsync(CREATE_CHEAT_SHEETS_SORT_INDEX);
    await seedFromJSON(db);
  } catch (err) {
    console.error('[db] initDB failed', err);
    throw err;
  }
}

type WordSeed = {
  spanish_word: string;
  english_meaning: string | null;
  formal_english: string | null;
  example_sentence: string | null;
  emoji: string | null;
  memory_hook: string | null;
  pattern_id: string | null;
  verb_family: string | null;
  conjugations: string | null;
  category: string | null;
  subsection: string | null;
  stage: number;
};

type PatternSeed = {
  english_ending: string;
  spanish_ending: string;
  example: string | null;
  count_estimate: string | null;
  reliability: string | null;
};

type FalseFriendSeed = {
  spanish_word: string;
  looks_like: string | null;
  actually_means: string | null;
  real_spanish: string | null;
  example_sentence: string | null;
};

type CheatSheetSeed = {
  section: string;
  title: string;
  content_json: string;
  sort_order: number;
};

async function seedFromJSON(db: SQLite.SQLiteDatabase): Promise<void> {
  const words = wordsData as WordSeed[];
  const patterns = patternsData as PatternSeed[];
  const falseFriends = falseFriendsData as FalseFriendSeed[];
  const cheatSheets = cheatSheetsData as CheatSheetSeed[];

  const expected =
    words.length + patterns.length + falseFriends.length + cheatSheets.length;

  const counts = await db.getFirstAsync<{ total: number }>(
    `SELECT
      (SELECT COUNT(*) FROM words) +
      (SELECT COUNT(*) FROM patterns) +
      (SELECT COUNT(*) FROM false_friends) +
      (SELECT COUNT(*) FROM cheat_sheets) AS total`,
  );
  if (counts && counts.total >= expected) return;

  await db.withTransactionAsync(async () => {
    for (const w of words) {
      await db.runAsync(
        `INSERT OR IGNORE INTO words
         (spanish_word, english_meaning, formal_english, example_sentence, emoji, memory_hook, pattern_id, verb_family, conjugations, category, subsection, stage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        w.spanish_word,
        w.english_meaning,
        w.formal_english,
        w.example_sentence,
        w.emoji,
        w.memory_hook,
        w.pattern_id,
        w.verb_family,
        w.conjugations,
        w.category,
        w.subsection,
        w.stage,
      );
    }
    for (const p of patterns) {
      await db.runAsync(
        `INSERT OR IGNORE INTO patterns
         (english_ending, spanish_ending, example, count_estimate, reliability)
         VALUES (?, ?, ?, ?, ?)`,
        p.english_ending,
        p.spanish_ending,
        p.example,
        p.count_estimate,
        p.reliability,
      );
    }
    for (const f of falseFriends) {
      await db.runAsync(
        `INSERT OR IGNORE INTO false_friends
         (spanish_word, looks_like, actually_means, real_spanish, example_sentence)
         VALUES (?, ?, ?, ?, ?)`,
        f.spanish_word,
        f.looks_like,
        f.actually_means,
        f.real_spanish,
        f.example_sentence,
      );
    }
    for (const c of cheatSheets) {
      await db.runAsync(
        `INSERT OR IGNORE INTO cheat_sheets
         (section, title, content_json, sort_order)
         VALUES (?, ?, ?, ?)`,
        c.section,
        c.title,
        c.content_json,
        c.sort_order,
      );
    }
  });

  console.log(
    `[db] seeded: ${words.length} words, ${patterns.length} patterns, ${falseFriends.length} false friends, ${cheatSheets.length} cheat sheets`,
  );
}

export async function getWordsByStage(stage: number): Promise<Word[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<WordRow>(
    'SELECT * FROM words WHERE stage = ? ORDER BY id ASC',
    stage,
  );
  return rows.map(rowToWord);
}

export async function getFalseFriends(): Promise<FalseFriendRow[]> {
  const db = await getDB();
  return db.getAllAsync<FalseFriendRow>(
    'SELECT * FROM false_friends ORDER BY id ASC',
  );
}

function rowToWord(row: WordRow): Word {
  return {
    ...row,
    conjugations: parseConjugations(row.conjugations),
  };
}

function parseConjugations(raw: string | null): Conjugations | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  const out: Conjugations = {};
  if (typeof p.yo === 'string') out.yo = p.yo;
  if (typeof p.tu === 'string') out.tu = p.tu;
  if (typeof p.el === 'string') out.el = p.el;
  return Object.keys(out).length > 0 ? out : null;
}
