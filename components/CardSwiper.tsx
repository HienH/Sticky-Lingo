import { ReactNode, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

type Props<T> = {
  data: T[];
  renderCard: (item: T, index: number) => ReactNode;
  onCardChange?: (index: number) => void;
};

export function CardSwiper<T>({ data, renderCard, onCardChange }: Props<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const translateX = useSharedValue(0);
  const indexSV = useSharedValue(0);
  const lastIndexSV = useSharedValue(data.length - 1);

  useEffect(() => {
    indexSV.value = index;
  }, [index, indexSV]);

  useEffect(() => {
    lastIndexSV.value = data.length - 1;
  }, [data.length, lastIndexSV]);

  // Hold the outgoing card off-screen until React commits the new index,
  // then snap to 0 so the new card appears at center. Avoids a one-frame
  // flash of the previous card at translateX = 0.
  useLayoutEffect(() => {
    translateX.value = 0;
  }, [index, translateX]);

  const commitIndex = useCallback(
    (next: number) => {
      setIndex(next);
      onCardChange?.(next);
    },
    [onCardChange]
  );

  const distanceThreshold = screenWidth * theme.gesture.swipeDistanceRatio;
  const velocityThreshold = theme.gesture.swipeVelocityThreshold;
  const offScreenDuration = theme.gesture.offScreenDuration;

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const passedDistance = Math.abs(e.translationX) > distanceThreshold;
      const passedVelocity = Math.abs(e.velocityX) > velocityThreshold;

      if (!passedDistance && !passedVelocity) {
        translateX.value = withSpring(0);
        return;
      }

      const swipingRight = e.translationX > 0;
      const currentIndex = indexSV.value;
      const lastIndex = lastIndexSV.value;
      const nextIndex = swipingRight ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex < 0 || nextIndex > lastIndex) {
        translateX.value = withSpring(0);
        return;
      }

      const target = swipingRight ? screenWidth : -screenWidth;
      translateX.value = withTiming(
        target,
        { duration: offScreenDuration },
        (finished) => {
          if (finished) {
            runOnJS(commitIndex)(nextIndex);
          }
        }
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (data.length === 0) return null;

  const safeIndex = Math.max(0, Math.min(index, data.length - 1));

  return (
    <View style={styles.container}>
      <View style={styles.counter} pointerEvents="none">
        <Text style={styles.counterText}>
          {safeIndex + 1} / {data.length}
        </Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardWrap, animatedStyle]}>
          {/* key per index forces remount so per-card state (Stage 2 flip,
              Stage 3 typing) doesn't leak across swipes */}
          <View key={safeIndex} style={styles.cardSlot}>
            {renderCard(data[safeIndex], safeIndex)}
          </View>
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
  cardSlot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
