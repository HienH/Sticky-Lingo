import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardSwiper } from '../../components/CardSwiper';
import { getFalseFriends, initDB } from '../../db/client';
import type { FalseFriendRow } from '../../db/schema';
import { useProgress } from '../../state/progress';
import { theme } from '../../theme';

const STAGE = 8;

export default function Stage8() {
  const [items, setItems] = useState<FalseFriendRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const markSeen = useProgress((s) => s.markSeen);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDB();
        const data = await getFalseFriends();
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load false friends');
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

  if (!items) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <CardSwiper
        data={items}
        renderCard={(item) => <FalseFriendCard item={item} />}
        onCardChange={(index) => {
          const it = items[index];
          if (it) markSeen(STAGE, it.spanish_word);
        }}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function FalseFriendCard({ item }: { item: FalseFriendRow }) {
  return (
    <View style={styles.card}>
      <ScrollView
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.warningLabel}>Watch out</Text>
        <Text style={styles.spanish}>{item.spanish_word}</Text>

        {item.looks_like ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Looks like</Text>
            <Text style={styles.looksLike}>{item.looks_like}</Text>
          </View>
        ) : null}

        {item.actually_means ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Actually means</Text>
            <Text style={styles.meaning}>{item.actually_means}</Text>
          </View>
        ) : null}

        {item.real_spanish && item.looks_like ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              For "{item.looks_like}" use
            </Text>
            <Text style={styles.realSpanish}>{item.real_spanish}</Text>
          </View>
        ) : null}

        {item.example_sentence ? (
          <Text style={styles.example}>{item.example_sentence}</Text>
        ) : null}
      </ScrollView>
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
  card: {
    width: '100%',
    aspectRatio: 0.7,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadow.cardElevated,
  },
  cardContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  warningLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xs,
    color: theme.colors.error,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  spanish: {
    fontFamily: theme.typography.fontFamily.extrabold,
    fontSize: theme.typography.size.xxl,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  row: {
    marginBottom: theme.spacing.md,
  },
  rowLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  looksLike: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
    color: theme.colors.error,
  },
  meaning: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
  },
  realSpanish: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    color: theme.colors.success,
  },
  example: {
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: theme.typography.size.sm * theme.typography.lineHeight.normal,
  },
});
