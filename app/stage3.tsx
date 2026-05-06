import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CardSwiper } from '../components/CardSwiper';
import { getWordsByStage, initDB } from '../db/client';
import type { Word } from '../db/schema';
import { useProgress } from '../state/progress';
import { theme } from '../theme';

type DeckItem =
  | { kind: 'word'; word: Word }
  | { kind: 'quiz'; word: Word };

// Lenient accent comparison: lowercase, NFD-decompose, strip combining marks.
// Side effect: ñ → n. Acceptable for V0 ("accept with or without accents");
// learners on US keyboards shouldn't be blocked on the tilde.
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim();

export default function Stage3() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState<string | null>(null);
  const markSeen = useProgress((s) => s.markSeen);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDB();
        const stage3 = await getWordsByStage(3);
        if (!cancelled) setWords(stage3);
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

  const patterns = useMemo(() => {
    if (!words) return [];
    const counts = new Map<string, number>();
    for (const w of words) {
      const key = w.pattern_id ?? 'Other';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [words]);

  const deck = useMemo<DeckItem[]>(() => {
    if (!words || !pattern) return [];
    const filtered = words.filter((w) => (w.pattern_id ?? 'Other') === pattern);
    if (filtered.length === 0) return [];
    const items: DeckItem[] = filtered.map((w) => ({ kind: 'word', word: w }));
    const quizWord = filtered[Math.floor(Math.random() * filtered.length)];
    items.push({ kind: 'quiz', word: quizWord });
    return items;
  }, [words, pattern]);

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

  if (!pattern) {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.pickerContent}>
          <Text style={styles.pickerTitle}>Pick a pattern</Text>
          {patterns.map((p) => (
            <Pressable
              key={p.name}
              style={({ pressed }) => [
                styles.patternRow,
                pressed && styles.patternRowPressed,
              ]}
              onPress={() => setPattern(p.name)}
            >
              <Text style={styles.patternName}>{p.name}</Text>
              <Text style={styles.patternCount}>{p.count}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable style={styles.backButton} onPress={() => setPattern(null)}>
        <Text style={styles.backText}>← Patterns</Text>
      </Pressable>
      <CardSwiper
        key={pattern}
        data={deck}
        renderCard={(item) =>
          item.kind === 'word' ? (
            <WordCard word={item.word} pattern={pattern} />
          ) : (
            <QuizCard word={item.word} pattern={pattern} />
          )
        }
        onCardChange={(index) => {
          const item = deck[index];
          if (item && item.kind === 'word') {
            markSeen(item.word.stage, item.word.spanish_word);
          }
        }}
      />
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

function WordCard({ word, pattern }: { word: Word; pattern: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.patternLabel}>{pattern}</Text>
      <Text style={styles.english}>{word.english_meaning}</Text>
      <Text style={styles.arrow}>↓</Text>
      <Text style={styles.spanish}>{word.spanish_word}</Text>
    </View>
  );
}

type QuizState =
  | { phase: 'input'; value: string }
  | { phase: 'result'; value: string; correct: boolean };

function QuizCard({ word, pattern }: { word: Word; pattern: string }) {
  const [state, setState] = useState<QuizState>({ phase: 'input', value: '' });

  const submit = () => {
    if (state.phase !== 'input') return;
    const trimmed = state.value.trim();
    if (!trimmed) return;
    const correct = norm(trimmed) === norm(word.spanish_word);
    setState({ phase: 'result', value: trimmed, correct });
  };

  const skip = () => {
    setState({ phase: 'result', value: '', correct: false });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.patternLabel}>Quick check · {pattern}</Text>
      <Text style={styles.quizPrompt}>What's the Spanish for</Text>
      <Text style={styles.english}>{word.english_meaning}</Text>

      {state.phase === 'input' ? (
        <>
          <TextInput
            value={state.value}
            onChangeText={(value) => setState({ phase: 'input', value })}
            onSubmitEditing={submit}
            placeholder="type here"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            style={styles.input}
            returnKeyType="done"
          />
          <View style={styles.quizButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={skip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                !state.value.trim() && styles.submitButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={submit}
              disabled={!state.value.trim()}
            >
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text
            style={[
              styles.resultMark,
              state.correct ? styles.resultMarkOk : styles.resultMarkBad,
            ]}
          >
            {state.correct ? '✓' : '✗'}
          </Text>
          {!state.correct ? (
            <>
              {state.value ? (
                <Text style={styles.resultYour}>you typed: {state.value}</Text>
              ) : null}
              <Text style={styles.resultAnswer}>{word.spanish_word}</Text>
            </>
          ) : (
            <Text style={styles.resultAnswer}>{word.spanish_word}</Text>
          )}
        </>
      )}
    </View>
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
  patternRow: {
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
  patternRowPressed: {
    opacity: 0.85,
  },
  patternName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  patternCount: {
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
  patternLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    position: 'absolute',
    top: theme.spacing.lg,
  },
  english: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  arrow: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textTertiary,
    marginVertical: theme.spacing.md,
  },
  spanish: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xxl,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  quizPrompt: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    width: '100%',
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    textAlign: 'center',
  },
  quizButtons: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  skipButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  skipText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.base,
    color: theme.colors.textSecondary,
  },
  submitButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.base,
    color: theme.colors.textOnPrimary,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  resultMark: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xxl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  resultMarkOk: {
    color: theme.colors.success,
  },
  resultMarkBad: {
    color: theme.colors.error,
  },
  resultYour: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs,
  },
  resultAnswer: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xl,
    color: theme.colors.textPrimary,
  },
});
