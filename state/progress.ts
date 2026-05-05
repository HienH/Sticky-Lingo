import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ProgressState = {
  seenIds: Record<number, true>;
  markSeen: (id: number) => void;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      seenIds: {},
      markSeen: (id) => {
        if (get().seenIds[id]) return;
        set((s) => ({ seenIds: { ...s.seenIds, [id]: true } }));
      },
    }),
    {
      name: 'sticky-lingo-progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const selectSeenCount = (s: ProgressState): number =>
  Object.keys(s.seenIds).length;
