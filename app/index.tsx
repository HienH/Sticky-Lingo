import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import wordsData from '../data/words.json';
import { selectSeenCount, useProgress } from '../state/progress';
import { theme } from '../theme';

type StageTile = {
  stage: number;
  title: string;
  subtitle: string;
  accent: string;
  route: '/stage1' | '/stage2' | '/stage3' | '/stage4' | null;
};

export default function Home() {
  const router = useRouter();
  const seenCount = useProgress(selectSeenCount);

  const { totalWords, stageCounts } = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const w of wordsData) counts[w.stage] = (counts[w.stage] ?? 0) + 1;
    return { totalWords: wordsData.length, stageCounts: counts };
  }, []);

  const tiles: StageTile[] = [
    {
      stage: 1,
      title: 'Easy Words',
      subtitle: `${stageCounts[1] ?? 0} cognates you already know`,
      accent: theme.colors.stage1,
      route: '/stage1',
    },
    {
      stage: 2,
      title: 'Formal English',
      subtitle: `${stageCounts[2] ?? 0} fancy words`,
      accent: theme.colors.stage2,
      route: '/stage2',
    },
    {
      stage: 3,
      title: 'Patterns',
      subtitle: `${stageCounts[3] ?? 0} words across 22 rules`,
      accent: theme.colors.stage3,
      route: '/stage3',
    },
    {
      stage: 4,
      title: 'Verbs',
      subtitle: `${stageCounts[4] ?? 0} verbs`,
      accent: theme.colors.stage4,
      route: '/stage4',
    },
    {
      stage: 5,
      title: 'Coming Soon',
      subtitle: '',
      accent: theme.colors.stage5,
      route: null,
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={styles.title}
            accessibilityRole="header"
          >
            Sticky Lingo
          </Text>
          <Text style={styles.tagline}>
            You already know more Spanish than you think
          </Text>
        </View>
        <View
          style={styles.counter}
          accessible
          accessibilityLabel={`${seenCount} of ${totalWords} words seen`}
        >
          <Text style={styles.counterValue}>{seenCount}</Text>
          <Text style={styles.counterTotal}>/ {totalWords}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.tilesContent}>
        {tiles.map((t) => {
          const disabled = t.route === null;
          const route = t.route;
          return (
            <Pressable
              key={t.stage}
              disabled={disabled}
              onPress={() => {
                if (route) router.push(route);
              }}
              accessibilityRole="button"
              accessibilityLabel={
                disabled
                  ? `Stage ${t.stage}: ${t.title} (coming soon)`
                  : `Stage ${t.stage}: ${t.title}. ${t.subtitle}`
              }
              accessibilityState={{ disabled }}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: t.accent },
                pressed && !disabled && styles.tilePressed,
                disabled && styles.tileDisabled,
              ]}
            >
              <View style={styles.tileTextWrap}>
                <Text style={styles.tileStage}>STAGE {t.stage}</Text>
                <Text style={styles.tileTitle}>{t.title}</Text>
                {t.subtitle ? (
                  <Text style={styles.tileSubtitle}>{t.subtitle}</Text>
                ) : null}
              </View>
              {!disabled ? <Text style={styles.tileArrow}>→</Text> : null}
            </Pressable>
          );
        })}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.fontFamily.extrabold,
    fontSize: theme.typography.size.xxl,
    color: theme.colors.textPrimary,
  },
  tagline: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  counter: {
    alignItems: 'flex-end',
    paddingTop: theme.spacing.xs,
  },
  counterValue: {
    fontFamily: theme.typography.fontFamily.extrabold,
    fontSize: theme.typography.size.xl,
    color: theme.colors.primary,
  },
  counterTotal: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textTertiary,
  },
  tilesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  tilePressed: {
    opacity: 0.85,
  },
  tileDisabled: {
    opacity: 0.6,
  },
  tileTextWrap: {
    flex: 1,
  },
  tileStage: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textTertiary,
    letterSpacing: 1,
  },
  tileTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  tileSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  tileArrow: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
  },
});
