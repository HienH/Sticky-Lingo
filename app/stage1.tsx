import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardSwiper } from '../components/CardSwiper';
import { getWordsByStage, initDB } from '../db/client';
import type { Word } from '../db/schema';
import { useProgress } from '../state/progress';
import { theme } from '../theme';

export default function Stage1() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <CardSwiper
        data={words}
        renderCard={(word) => (
          <View style={styles.card}>
            {word.emoji ? (
              <Text style={styles.emoji}>{word.emoji}</Text>
            ) : null}
            <Text style={[styles.word, !word.emoji && styles.wordNoEmoji]}>
              {word.spanish_word}
            </Text>
            {word.memory_hook ? (
              <Text style={styles.hook}>{word.memory_hook}</Text>
            ) : null}
          </View>
        )}
        onCardChange={(index) => {
          const w = words[index];
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
  hook: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    lineHeight: theme.typography.size.md * theme.typography.lineHeight.normal,
  },
});
