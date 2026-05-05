export const CREATE_WORDS_TABLE = `
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spanish_word TEXT NOT NULL,
  english_meaning TEXT,
  formal_english TEXT,
  example_sentence TEXT,
  emoji TEXT,
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
  pattern_id: string | null;
  verb_family: string | null;
  conjugations: string | null;
  category: string | null;
  stage: number;
};

export type Word = Omit<WordRow, 'conjugations'> & {
  conjugations: Conjugations | null;
};
