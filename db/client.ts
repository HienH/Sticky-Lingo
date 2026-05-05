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
  } catch (err) {
    console.error('[db] initDB failed', err);
    throw err;
  }
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
