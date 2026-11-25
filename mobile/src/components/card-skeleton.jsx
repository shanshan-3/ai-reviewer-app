import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

/**
 * Reusable animated pulse skeleton building block.
 * Uses a standard View for NativeWind styling and an inner Animated.View for the opacity loop.
 *
 * @param {{
 *   className?: string,
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>,
 * }} props
 */
export function SkeletonItem({ className = '', style }) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View className={`overflow-hidden bg-[#E4E8EE] ${className}`}>
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            opacity,
            backgroundColor: '#CBD5E1',
          },
          style,
        ]}
      />
    </View>
  );
}

/**
 * Geometry-matching skeleton for Quiz items in QuizzesPage.
 */
export function QuizCardSkeleton() {
  return (
    <View
      accessibilityLabel="Loading quiz"
      accessibilityState={{ busy: true }}
      className="gap-2.5 rounded-2xl border border-[#E4E8EE] bg-white p-3.5 shadow-2xs"
      style={{ borderCurve: 'continuous' }}
    >
      <View className="flex-row items-center justify-between">
        <SkeletonItem className="h-3 w-20 rounded-md" />
        <SkeletonItem className="h-5 w-16 rounded-full" />
      </View>
      <SkeletonItem className="h-4 w-3/4 rounded-md" />
      <View className="flex-row items-center gap-2 pt-0.5">
        <SkeletonItem className="h-3 w-32 rounded-md" />
        <SkeletonItem className="h-3 w-12 rounded-full" />
      </View>
    </View>
  );
}

/**
 * Geometry-matching skeleton for the Recommended Focus capsule in QuizzesPage.
 */
export function RecommendedFocusSkeleton() {
  return (
    <View
      accessibilityLabel="Loading recommended topic"
      accessibilityState={{ busy: true }}
      className="flex-row items-center justify-between overflow-hidden rounded-2xl border border-[#001428]/15 bg-white p-3.5 shadow-xs"
      style={{ borderCurve: 'continuous' }}
    >
      <View className="flex-row items-center gap-3 flex-1 pr-3">
        <SkeletonItem className="h-10 w-10 rounded-xl" />
        <View className="flex-1 gap-1.5">
          <SkeletonItem className="h-3 w-28 rounded-md" />
          <SkeletonItem className="h-4 w-40 rounded-md" />
          <SkeletonItem className="h-2.5 w-24 rounded-md" />
        </View>
      </View>
      <SkeletonItem className="h-8 w-20 rounded-full" />
    </View>
  );
}

/**
 * Geometry-matching skeleton for Flashcard Decks in FlashcardsPage.
 */
export function DeckCardSkeleton() {
  return (
    <View
      accessibilityLabel="Loading deck"
      accessibilityState={{ busy: true }}
      className="gap-2.5 rounded-2xl border border-[#E4E8EE] bg-white p-4 shadow-2xs"
      style={{ borderCurve: 'continuous' }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <SkeletonItem className="h-4 w-4 rounded-md" />
          <SkeletonItem className="h-3 w-24 rounded-md" />
        </View>
        <SkeletonItem className="h-3 w-16 rounded-md" />
      </View>
      <SkeletonItem className="h-5 w-2/3 rounded-md" />
      <View className="flex-row items-center justify-between pt-1">
        <SkeletonItem className="h-3.5 w-28 rounded-md" />
        <SkeletonItem className="h-6 w-16 rounded-full" />
      </View>
    </View>
  );
}

/**
 * Geometry-matching skeleton for Materials/Modules in DashboardPage.
 */
export function ModuleCardSkeleton() {
  return (
    <View
      accessibilityLabel="Loading module"
      accessibilityState={{ busy: true }}
      className="flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white p-3.5 shadow-2xs"
      style={{ borderCurve: 'continuous' }}
    >
      <View className="min-w-0 flex-1 pr-3 gap-2">
        <SkeletonItem className="h-4 w-1/2 rounded-md" />
        <View className="flex-row items-center gap-2">
          <SkeletonItem className="h-2 w-2 rounded-full" />
          <SkeletonItem className="h-2.5 w-14 rounded-md" />
          <SkeletonItem className="h-2.5 w-24 rounded-md" />
        </View>
      </View>
      <SkeletonItem className="h-5 w-5 rounded-md" />
    </View>
  );
}

/**
 * Stacked pulse skeleton list.
 *
 * @param {{ count?: number, type?: 'quiz' | 'deck' | 'module', className?: string }} props
 */
export default function CardSkeletonList({ count = 3, type = 'quiz', className = '' }) {
  const Component = type === 'deck' ? DeckCardSkeleton : type === 'module' ? ModuleCardSkeleton : QuizCardSkeleton;

  return (
    <View className={`gap-3 ${className}`} accessibilityLiveRegion="polite">
      {Array.from({ length: count }).map((_, index) => (
        <Component key={index} />
      ))}
    </View>
  );
}
