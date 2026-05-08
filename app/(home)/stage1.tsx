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
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardSwiper } from '../../components/CardSwiper';
import { getWordsByStage, initDB } from '../../db/client';
import type { Word } from '../../db/schema';
import { useProgress } from '../../state/progress';
import { theme } from '../../theme';
import { sentenceCase } from '../../utils/format';

export default function Stage1() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subsection, setSubsection] = useState<string | null>(null);
  const markSeen = useProgress((s) => s.markSeen);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDB();
        const stage1 = await getWordsByStage(1);
        if (!cancelled) setWords(stage1);
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

  const subsections = useMemo(() => {
    if (!words) return [];
    const counts = new Map<string, number>();
    for (const w of words) {
      const key = w.subsection ?? 'Other';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [words]);

  const filtered = useMemo(() => {
    if (!words || !subsection) return [];
    return words.filter((w) => (w.subsection ?? 'Other') === subsection);
  }, [words, subsection]);

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

  if (!subsection) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView contentContainerStyle={styles.pickerContent}>
          <Text style={styles.pickerTitle}>Pick a category</Text>
          {subsections.map((s) => (
            <Pressable
              key={s.name}
              accessibilityRole="button"
              accessibilityLabel={`${sentenceCase(s.name)}, ${s.count} words`}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
              onPress={() => setSubsection(s.name)}
            >
              <Text style={styles.rowName}>{sentenceCase(s.name)}</Text>
              <Text style={styles.rowCount}>{s.count}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Pressable
        style={styles.backButton}
        onPress={() => setSubsection(null)}
        accessibilityRole="button"
        accessibilityLabel="Back to categories"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backText}>← Categories</Text>
      </Pressable>
      <CardSwiper
        key={subsection}
        data={filtered}
        renderCard={(word) => (
          <View style={styles.card}>
            {word.emoji ? (
              <Text style={styles.emoji}>{word.emoji}</Text>
            ) : null}
            <Text style={[styles.word, !word.emoji && styles.wordNoEmoji]}>
              {word.spanish_word}
            </Text>
            {word.english_meaning ? (
              <Text style={styles.meaning}>{word.english_meaning}</Text>
            ) : null}
            {word.memory_hook ? (
              <Text style={styles.hook}>{word.memory_hook}</Text>
            ) : null}
          </View>
        )}
        onCardChange={(index) => {
          const w = filtered[index];
          if (w) markSeen(w.stage, w.spanish_word);
        }}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
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
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  pickerTitle: {
    fontFamily: theme.typography.fontFamily.extrabold,
    fontSize: theme.typography.size.xl,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  row: {
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
  rowPressed: {
    backgroundColor: theme.colors.stage1,
  },
  rowName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  rowCount: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.base,
    color: theme.colors.textSecondary,
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.sm,
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
  emoji: {
    fontSize: theme.typography.size.display * 1.5,
    marginBottom: theme.spacing.lg,
  },
  word: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.display,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  wordNoEmoji: {
    fontSize: theme.typography.size.display * 1.1,
  },
  meaning: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  hook: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    lineHeight: theme.typography.size.md * theme.typography.lineHeight.normal,
  },
});
