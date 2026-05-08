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

export default function Stage5() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subsection, setSubsection] = useState<string | null>(null);
  const markSeen = useProgress((s) => s.markSeen);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDB();
        const stage5 = await getWordsByStage(5);
        if (!cancelled) setWords(stage5);
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
                styles.categoryRow,
                pressed && styles.categoryRowPressed,
              ]}
              onPress={() => setSubsection(s.name)}
            >
              <Text style={styles.categoryName}>{sentenceCase(s.name)}</Text>
              <Text style={styles.categoryCount}>{s.count}</Text>
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
        renderCard={(word) => <FlipCard word={word} />}
        onCardChange={(index) => {
          const w = filtered[index];
          if (w) markSeen(w.stage, w.spanish_word);
        }}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
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
      accessibilityRole={hasExample ? 'button' : undefined}
      accessibilityLabel={
        flipped && hasExample
          ? `Example: ${word.example_sentence}. Tap to flip back.`
          : [
              word.category,
              word.spanish_word,
              word.formal_english,
              word.english_meaning,
              hasExample ? 'Tap for example' : null,
            ]
              .filter(Boolean)
              .join('. ')
      }
    >
      <View style={styles.cardContent}>
        {flipped && hasExample ? (
          <>
            <Text style={styles.backLabel}>Example</Text>
            <Text style={styles.example}>{word.example_sentence}</Text>
          </>
        ) : (
          <>
            {word.category ? (
              <Text style={styles.categoryChip}>{word.category}</Text>
            ) : null}
            <Text style={styles.word}>{word.spanish_word}</Text>
            {word.formal_english ? (
              <Text style={styles.formal}>{word.formal_english}</Text>
            ) : null}
            {word.english_meaning ? (
              <Text style={styles.meaning}>{word.english_meaning}</Text>
            ) : null}
          </>
        )}
      </View>
      {hasExample ? (
        <Text style={styles.tapHint}>
          {flipped ? 'tap to flip back' : 'tap for example'}
        </Text>
      ) : null}
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
    backgroundColor: theme.colors.stage5,
  },
  categoryName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  categoryCount: {
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
    padding: theme.spacing.xl,
    ...theme.shadow.cardElevated,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChip: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
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
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textTertiary,
  },
});
