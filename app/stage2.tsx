import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CardSwiper } from '../components/CardSwiper';
import { getWordsByStage, initDB } from '../db/client';
import type { Word } from '../db/schema';
import { useProgress } from '../state/progress';
import { theme } from '../theme';

export default function Stage2() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const markSeen = useProgress((s) => s.markSeen);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDB();
        const stage2 = await getWordsByStage(2);
        if (!cancelled) setWords(stage2);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load words');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    if (!words) return [];
    const counts = new Map<string, number>();
    for (const w of words) {
      const key = w.category ?? 'Other';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [words]);

  const filtered = useMemo(() => {
    if (!words || !category) return [];
    return words.filter((w) => (w.category ?? 'Other') === category);
  }, [words, category]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!words) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.pickerContent}>
          <Text style={styles.pickerTitle}>Pick a category</Text>
          {categories.map((c) => (
            <Pressable
              key={c.name}
              style={({ pressed }) => [
                styles.categoryRow,
                pressed && styles.categoryRowPressed,
              ]}
              onPress={() => setCategory(c.name)}
            >
              <Text style={styles.categoryName}>{c.name}</Text>
              <Text style={styles.categoryCount}>{c.count}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Pressable style={styles.backButton} onPress={() => setCategory(null)}>
        <Text style={styles.backText}>← Categories</Text>
      </Pressable>
      <CardSwiper
        key={category}
        data={filtered}
        renderCard={(word) => <FlipCard word={word} />}
        onCardChange={(index) => {
          const w = filtered[index];
          if (w) markSeen(w.stage, w.spanish_word);
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
}

function FlipCard({ word }: { word: Word }) {
  const [flipped, setFlipped] = useState(false);
  const hasExample = !!word.example_sentence;
  return (
    <Pressable
      style={styles.card}
      onPress={() => setFlipped((f) => !f)}
      disabled={!hasExample}
    >
      {flipped && hasExample ? (
        <>
          <Text style={styles.backLabel}>Example</Text>
          <Text style={styles.example}>{word.example_sentence}</Text>
          <Text style={styles.tapHint}>tap to flip back</Text>
        </>
      ) : (
        <>
          <Text style={styles.word}>{word.spanish_word}</Text>
          {word.formal_english ? (
            <Text style={styles.formal}>{word.formal_english}</Text>
          ) : null}
          {word.english_meaning ? (
            <Text style={styles.meaning}>{word.english_meaning}</Text>
          ) : null}
          {hasExample ? (
            <Text style={styles.tapHint}>tap for example</Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.base,
    color: theme.colors.error,
    paddingHorizontal: theme.spacing.lg,
    textAlign: 'center',
  },
  pickerContent: {
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  pickerTitle: {
    fontFamily: theme.typography.fontFamily.extrabold,
    fontSize: theme.typography.size.xl,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  categoryRowPressed: {
    backgroundColor: theme.colors.stage2,
  },
  categoryName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textPrimary,
  },
  categoryCount: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.base,
    color: theme.colors.textSecondary,
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.xl,
    left: theme.spacing.lg,
    zIndex: 10,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  backText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
  },
  card: {
    width: '100%',
    aspectRatio: 0.7,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    ...theme.shadow.cardElevated,
  },
  word: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xxl,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  formal: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  meaning: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.base,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    lineHeight:
      theme.typography.size.base * theme.typography.lineHeight.normal,
  },
  backLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.lg,
  },
  example: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight:
      theme.typography.size.lg * theme.typography.lineHeight.normal,
  },
  tapHint: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textTertiary,
  },
});
