import * as SQLite from 'expo-sqlite';
import {
  CREATE_WORDS_STAGE_INDEX,
  CREATE_WORDS_TABLE,
  Conjugations,
  Word,
  WordRow,
} from './schema';

const DB_NAME = 'stickylingo.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initDB(): Promise<void> {
  const db = await getDB();
  await db.execAsync(CREATE_WORDS_TABLE);
  await db.execAsync(CREATE_WORDS_STAGE_INDEX);
}

export async function getWordsByStage(stage: number): Promise<Word[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<WordRow>(
    'SELECT * FROM words WHERE stage = ? ORDER BY id ASC',
    stage,
  );
  return rows.map(rowToWord);
}

function rowToWord(row: WordRow): Word {
  return {
    ...row,
    conjugations: parseConjugations(row.conjugations),
  };
}

function parseConjugations(raw: string | null): Conjugations | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as Conjugations;
    }
    return null;
  } catch {
    return null;
  }
}
