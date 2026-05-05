import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { CardSwiper } from '../components/CardSwiper';
import { theme } from '../theme';

type MockWord = {
  spanish: string;
  emoji: string;
};

const MOCK_WORDS: MockWord[] = [
  { spanish: 'mosquito', emoji: '🦟' },
  { spanish: 'taco', emoji: '🌮' },
  { spanish: 'sol', emoji: '☀️' },
  { spanish: 'gato', emoji: '🐈' },
  { spanish: 'plátano', emoji: '🍌' },
];

export default function Home() {
  return (
    <View style={styles.root}>
      <CardSwiper
        data={MOCK_WORDS}
        renderCard={(word) => (
          <View style={styles.card}>
            <Text style={styles.emoji}>{word.emoji}</Text>
            <Text style={styles.word}>{word.spanish}</Text>
          </View>
        )}
        onCardChange={(index) => {
          console.log('card changed:', index);
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  },
});
