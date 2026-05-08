import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import patternsData from '../data/patterns.json';
import { theme } from '../theme';

type Pattern = {
  english_ending: string;
  spanish_ending: string;
  example: string | null;
  count_estimate: string | null;
  reliability: string | null;
};

type Group = {
  reliability: string;
  patterns: Pattern[];
};

const RELIABILITY_ORDER = ['Very High', 'High'];

export default function CheatSheet() {
  const groups = useMemo<Group[]>(() => {
    const byReliability = new Map<string, Pattern[]>();
    for (const p of patternsData as Pattern[]) {
      const key = p.reliability ?? 'Other';
      const list = byReliability.get(key) ?? [];
      list.push(p);
      byReliability.set(key, list);
    }
    const known = RELIABILITY_ORDER.filter((r) => byReliability.has(r)).map(
      (r) => ({ reliability: r, patterns: byReliability.get(r)! }),
    );
    const extras = Array.from(byReliability.entries())
      .filter(([r]) => !RELIABILITY_ORDER.includes(r))
      .map(([reliability, patterns]) => ({ reliability, patterns }));
    return [...known, ...extras];
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Patterns
        </Text>
        <Text style={styles.subtitle}>
          22 ways English endings become Spanish
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {groups.map((group) => (
          <View key={group.reliability} style={styles.section}>
            <Text style={styles.sectionLabel} accessibilityRole="header">
              {group.reliability} reliability
            </Text>
            {group.patterns.map((p, idx) => (
              <View
                key={`${p.english_ending}-${p.spanish_ending}`}
                style={[
                  styles.row,
                  idx === group.patterns.length - 1 && styles.rowLast,
                ]}
                accessible
                accessibilityLabel={
                  `${p.english_ending} becomes ${p.spanish_ending}` +
                  (p.example ? `, for example ${p.example}` : '') +
                  (p.count_estimate ? `, ${p.count_estimate} words` : '')
                }
              >
                <View style={styles.rowMain}>
                  <View style={styles.endingPair}>
                    <Text style={styles.englishEnding}>{p.english_ending}</Text>
                    <Text style={styles.arrow}>→</Text>
                    <Text style={styles.spanishEnding}>{p.spanish_ending}</Text>
                  </View>
                  {p.count_estimate ? (
                    <View style={styles.countChip}>
                      <Text style={styles.countText}>{p.count_estimate}</Text>
                    </View>
                  ) : null}
                </View>
                {p.example ? (
                  <Text style={styles.example}>{p.example}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.fontFamily.extrabold,
    fontSize: theme.typography.size.xxl,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textTertiary,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  row: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  endingPair: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  englishEnding: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
  },
  arrow: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    color: theme.colors.textTertiary,
    marginHorizontal: theme.spacing.sm,
  },
  spanishEnding: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    color: theme.colors.primary,
  },
  countChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  countText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
  },
  example: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
