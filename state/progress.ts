import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ProgressState = {
  seenKeys: Record<string, true>;
  markSeen: (stage: number, spanishWord: string) => void;
};

const keyOf = (stage: number, spanishWord: string) => `${stage}:${spanishWord}`;

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      seenKeys: {},
      markSeen: (stage, spanishWord) => {
        const k = keyOf(stage, spanishWord);
        if (get().seenKeys[k]) return;
        set((s) => ({ seenKeys: { ...s.seenKeys, [k]: true } }));
      },
    }),
    {
      name: 'sticky-lingo-progress',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      // v1 → v2: stage numbering changed from 1–4 (sheets merged) to 1–8
      // (one stage per sheet). Old `${stage}:${word}` keys are now ambiguous,
      // so reset the seen set on first launch after upgrade.
      migrate: (state: unknown, fromVersion: number): ProgressState => {
        const prev = (state ?? {}) as Partial<ProgressState>;
        if (fromVersion < 2) {
          return { ...(prev as ProgressState), seenKeys: {} };
        }
        return prev as ProgressState;
      },
    },
  ),
);

export const selectSeenCount = (s: ProgressState): number =>
  Object.keys(s.seenKeys).length;
