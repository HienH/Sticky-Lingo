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
      version: 1,
    },
  ),
);

export const selectSeenCount = (s: ProgressState): number =>
  Object.keys(s.seenKeys).length;
