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

type CheatSheetVariant = 'present' | 'participle';

type DeckItem =
  | { kind: 'cheatsheet'; variant: CheatSheetVariant }
  | { kind: 'verb'; word: Word };

const isParticipleCategory = (category: string) =>
  category.startsWith('Past participle:');

// Mirrors cheat_sheets.past_participles. Hardcoded so the cheat-sheet card
// doesn't depend on parsing content_json; cheat_sheets table stays the source
// of truth for the future V1 reference UI.
const IRREGULAR_PARTICIPLES: ReadonlyArray<readonly [string, string]> = [
  ['hacer', 'hecho'],
  ['decir', 'dicho'],
  ['escribir', 'escrito'],
  ['ver', 'visto'],
  ['abrir', 'abierto'],
  ['volver', 'vuelto'],
  ['poner', 'puesto'],
  ['romper', 'roto'],
  ['morir', 'muerto'],
  ['resolver', 'resuelto'],
  ['cubrir', 'cubierto'],
  ['descubrir', 'descubierto'],
];

const IRREGULAR_PARTICIPLE_BY_INF: Record<string, string> = Object.fromEntries(
  IRREGULAR_PARTICIPLES.map(([inf, pp]) => [inf, pp])
);

// Returns the past participle for a verb when it sits in a "Past participle:"
// deck (irregular via lookup, regular via suffix swap). Other decks return null
// so the participle line is hidden.
function participleFor(infinitive: string, category: string | null): string | null {
  if (!category?.startsWith('Past participle:')) return null;
  const irregular = IRREGULAR_PARTICIPLE_BY_INF[infinitive];
  if (irregular) return irregular;
  if (infinitive.endsWith('ar')) return infinitive.slice(0, -2) + 'ado';
  if (infinitive.endsWith('er')) return infinitive.slice(0, -2) + 'ido';
  if (infinitive.endsWith('ir')) return infinitive.slice(0, -2) + 'ido';
  return null;
}

export default function Stage7() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const markSeen = useProgress((s) => s.markSeen);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDB();
        const stage7 = await getWordsByStage(7);
        if (!cancelled) setWords(stage7);
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

  const deck = useMemo<DeckItem[]>(() => {
    if (!words || !category) return [];
    const filtered = words.filter((w) => (w.category ?? 'Other') === category);
    if (filtered.length === 0) return [];
    const variant: CheatSheetVariant = isParticipleCategory(category)
      ? 'participle'
      : 'present';
    return [
      { kind: 'cheatsheet', variant },
      ...filtered.map<DeckItem>((w) => ({ kind: 'verb', word: w })),
    ];
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
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView contentContainerStyle={styles.pickerContent}>
          <Text style={styles.pickerTitle}>Pick a category</Text>
          {categories.map((c) => (
            <Pressable
              key={c.name}
              accessibilityRole="button"
              accessibilityLabel={`${c.name}, ${c.count} verbs`}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Pressable
        style={styles.backButton}
        onPress={() => setCategory(null)}
        accessibilityRole="button"
        accessibilityLabel="Back to categories"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backText}>← Categories</Text>
      </Pressable>
      <CardSwiper
        key={category}
        data={deck}
        renderCard={(item) =>
          item.kind === 'cheatsheet' ? (
            <CheatSheetCard variant={item.variant} />
          ) : (
            <VerbCard word={item.word} />
          )
        }
        onCardChange={(index) => {
          const item = deck[index];
          if (item && item.kind === 'verb') {
            markSeen(item.word.stage, item.word.spanish_word);
          }
        }}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function CheatSheetCard({ variant }: { variant: CheatSheetVariant }) {
  if (variant === 'participle') {
    return (
      <View style={styles.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cheatScrollContent}
        >
          <Text style={styles.cheatTitle}>Past participles</Text>
          <Text style={styles.cheatSubtitle}>"I have ___" — he + ado/ido</Text>
          <View style={styles.ruleBlock}>
            <RuleRow family="-ar" rule="drop -ar, add -ado" example="hablar → hablado" />
            <RuleRow family="-er" rule="drop -er, add -ido" example="comer → comido" />
            <RuleRow family="-ir" rule="drop -ir, add -ido" example="vivir → vivido" />
          </View>
          <Text style={styles.subHeader}>IRREGULAR</Text>
          <View style={styles.irregGrid}>
            {IRREGULAR_PARTICIPLES.map(([inf, pp]) => (
              <Text key={inf} style={styles.irregItem}>
                {inf} → <Text style={styles.irregBold}>{pp}</Text>
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cheatTitle}>How verbs work</Text>
      <Text style={styles.cheatSubtitle}>Regular present tense</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, styles.tableLabel]} />
        <Text style={[styles.tableCell, styles.tableHeaderText]}>yo</Text>
        <Text style={[styles.tableCell, styles.tableHeaderText]}>tú</Text>
        <Text style={[styles.tableCell, styles.tableHeaderText]}>él</Text>
      </View>
      <ConjRow family="-AR" yo="-o" tu="-as" el="-a" />
      <ConjRow family="-ER" yo="-o" tu="-es" el="-e" />
      <ConjRow family="-IR" yo="-o" tu="-es" el="-e" />
      <Text style={styles.cheatExample}>
        hablar → <Text style={styles.cheatExampleBold}>hablo, hablas, habla</Text>
      </Text>
    </View>
  );
}

function ConjRow({
  family,
  yo,
  tu,
  el,
}: {
  family: string;
  yo: string;
  tu: string;
  el: string;
}) {
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableLabel]}>{family}</Text>
      <Text style={[styles.tableCell, styles.tableValue]}>{yo}</Text>
      <Text style={[styles.tableCell, styles.tableValue]}>{tu}</Text>
      <Text style={[styles.tableCell, styles.tableValue]}>{el}</Text>
    </View>
  );
}

function RuleRow({
  family,
  rule,
  example,
}: {
  family: string;
  rule: string;
  example: string;
}) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleFamily}>{family}</Text>
      <View style={styles.ruleTextWrap}>
        <Text style={styles.ruleRule}>{rule}</Text>
        <Text style={styles.ruleExample}>{example}</Text>
      </View>
    </View>
  );
}

function VerbCard({ word }: { word: Word }) {
  const family = word.verb_family ? word.verb_family.toUpperCase() : null;
  const participle = participleFor(word.spanish_word, word.category);
  return (
    <View style={styles.card}>
      {family ? (
        <View style={styles.familyPill}>
          <Text style={styles.familyPillText}>{family} VERB</Text>
        </View>
      ) : null}
      <View style={styles.verbContent}>
        <Text
          style={[
            styles.verbInfinitive,
            participle ? styles.verbInfinitiveSecondary : null,
          ]}
        >
          {word.spanish_word}
        </Text>
        {participle ? (
          <>
            <Text style={styles.verbArrow}>↓</Text>
            <Text style={styles.verbParticiple}>{participle}</Text>
          </>
        ) : null}
        {word.english_meaning ? (
          <Text style={styles.verbMeaning}>{word.english_meaning}</Text>
        ) : null}
        {word.example_sentence ? (
          <Text style={styles.verbExample}>{word.example_sentence}</Text>
        ) : null}
      </View>
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
    backgroundColor: theme.colors.stage7,
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
  // --- Cheat sheet card ---
  cheatTitle: {
    fontFamily: theme.typography.fontFamily.extrabold,
    fontSize: theme.typography.size.xl,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  cheatSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    marginBottom: theme.spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  tableLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.base,
    color: theme.colors.textPrimary,
  },
  tableHeaderText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableValue: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    color: theme.colors.primary,
  },
  cheatExample: {
    marginTop: 'auto',
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  cheatExampleBold: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  // --- Past-participle variant ---
  ruleBlock: {
    marginBottom: theme.spacing.lg,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  ruleFamily: {
    paddingRight: theme.spacing.base,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.base,
    color: theme.colors.textPrimary,
  },
  ruleTextWrap: {
    flex: 1,
  },
  ruleRule: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textPrimary,
  },
  ruleExample: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  subHeader: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  irregGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  irregItem: {
    width: '48%',
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    paddingVertical: theme.spacing.xs,
  },
  irregBold: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  // --- Verb card ---
  familyPill: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.stage7,
    borderRadius: theme.radius.full,
  },
  familyPillText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textPrimary,
    letterSpacing: 1,
  },
  verbContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verbInfinitive: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xxl,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  verbInfinitiveSecondary: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textSecondary,
  },
  verbArrow: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textTertiary,
    marginVertical: theme.spacing.sm,
  },
  verbParticiple: {
    fontFamily: theme.typography.fontFamily.extrabold,
    fontSize: theme.typography.size.xxl,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  verbMeaning: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: theme.typography.size.md * theme.typography.lineHeight.normal,
  },
  verbExample: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    lineHeight: theme.typography.size.sm * theme.typography.lineHeight.normal,
  },
  cheatScrollContent: {
    flexGrow: 1,
  },
});
