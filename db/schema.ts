export const CREATE_WORDS_TABLE = `
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spanish_word TEXT NOT NULL,
  english_meaning TEXT,
  formal_english TEXT,
  example_sentence TEXT,
  emoji TEXT,
  memory_hook TEXT,
  pattern_id TEXT,
  verb_family TEXT,
  conjugations TEXT,
  category TEXT,
  stage INTEGER NOT NULL,
  UNIQUE (spanish_word, stage)
);
`;

export const CREATE_WORDS_STAGE_INDEX = `
CREATE INDEX IF NOT EXISTS idx_words_stage ON words (stage);
`;

export const CREATE_PATTERNS_TABLE = `
CREATE TABLE IF NOT EXISTS patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english_ending TEXT NOT NULL,
  spanish_ending TEXT NOT NULL,
  example TEXT,
  count_estimate TEXT,
  reliability TEXT,
  UNIQUE (english_ending, spanish_ending)
);
`;

export const CREATE_FALSE_FRIENDS_TABLE = `
CREATE TABLE IF NOT EXISTS false_friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spanish_word TEXT NOT NULL UNIQUE,
  looks_like TEXT,
  actually_means TEXT,
  real_spanish TEXT,
  example_sentence TEXT
);
`;

export const CREATE_CHEAT_SHEETS_TABLE = `
CREATE TABLE IF NOT EXISTS cheat_sheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);
`;

export const CREATE_CHEAT_SHEETS_SORT_INDEX = `
CREATE INDEX IF NOT EXISTS idx_cheat_sheets_sort ON cheat_sheets (sort_order);
`;

export type Conjugations = {
  yo?: string;
  tu?: string;
  el?: string;
};

export type WordRow = {
  id: number;
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
  stage: number;
};

export type Word = Omit<WordRow, 'conjugations'> & {
  conjugations: Conjugations | null;
};

export type PatternRow = {
  id: number;
  english_ending: string;
  spanish_ending: string;
  example: string | null;
  count_estimate: string | null;
  reliability: string | null;
};

export type FalseFriendRow = {
  id: number;
  spanish_word: string;
  looks_like: string | null;
  actually_means: string | null;
  real_spanish: string | null;
  example_sentence: string | null;
};

export type CheatSheetContent = {
  column_headers: string[] | null;
  rows: (string | null)[][];
  sub_headers: string[] | null;
  footnotes: string[] | null;
};

export type CheatSheetRow = {
  id: number;
  section: string;
  title: string;
  content_json: string;
  sort_order: number;
};

export type CheatSheet = Omit<CheatSheetRow, 'content_json'> & {
  content: CheatSheetContent;
};
