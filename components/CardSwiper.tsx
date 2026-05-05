import { ReactNode, useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_DISTANCE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_VELOCITY_THRESHOLD = 500;
const OFF_SCREEN_DURATION = 200;

type Props<T> = {
  data: T[];
  renderCard: (item: T, index: number) => ReactNode;
  onCardChange?: (index: number) => void;
};

export function CardSwiper<T>({ data, renderCard, onCardChange }: Props<T>) {
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);

  const commitIndex = useCallback(
    (next: number) => {
      setIndex(next);
      onCardChange?.(next);
    },
    [onCardChange]
  );

  const total = data.length;
  const lastIndex = total - 1;

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const passedDistance =
        Math.abs(e.translationX) > SWIPE_DISTANCE_THRESHOLD;
      const passedVelocity =
        Math.abs(e.velocityX) > SWIPE_VELOCITY_THRESHOLD;

      if (!passedDistance && !passedVelocity) {
        translateX.value = withSpring(0);
        return;
      }

      const swipingRight = e.translationX > 0;
      const nextIndex = swipingRight ? index + 1 : index - 1;

      if (nextIndex < 0 || nextIndex > lastIndex) {
        translateX.value = withSpring(0);
        return;
      }

      const offScreen = swipingRight ? SCREEN_WIDTH : -SCREEN_WIDTH;
      translateX.value = withTiming(
        offScreen,
        { duration: OFF_SCREEN_DURATION },
        (finished) => {
          if (finished) {
            translateX.value = 0;
            runOnJS(commitIndex)(nextIndex);
          }
        }
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (total === 0) {
    return null;
  }

  const safeIndex = Math.min(index, lastIndex);

  return (
    <View style={styles.container}>
      <View style={styles.counter} pointerEvents="none">
        <Text style={styles.counterText}>
          {safeIndex + 1} / {total}
        </Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardWrap, animatedStyle]}>
          {renderCard(data[safeIndex], safeIndex)}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  counter: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  counterText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
  },
  cardWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
