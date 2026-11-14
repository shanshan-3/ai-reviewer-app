# 003 — Add Tactile Radio Dot & Press Feedback to Quiz Options

- **Status**: DONE
- **Commit**: 2e63325
- **Severity**: MEDIUM
- **Category**: Feedback
- **Estimated scope**: 1 file (`mobile/src/components/question-card.jsx`), ~25 lines

## Problem

In [`question-card.jsx:115-136`](file:///C:/ai-reviewer-app/mobile/src/components/question-card.jsx#L115-L136), selecting a quiz option snaps the radio dot into view instantly. The selection lacks physical confirmation that the answer was registered.

## Target

1. Animate inner white radio indicator using `ZoomIn.duration(140).easing(Easing.bezier(0.23, 1, 0.32, 1)).reduceMotion(ReduceMotion.System)`.
2. Apply physical spring press scale `transform: [{ scale: pressed && !disabled ? 0.98 : 1 }]` to the option Pressable container.

## Steps

1. Import `Animated`, `ZoomIn`, `Easing`, and `ReduceMotion` from `react-native-reanimated`.
2. Wrap the inner selected dot in `<Animated.View entering={ZoomIn...}>`.
3. Upgrade `Pressable` style prop with responsive pressed function.

## Verification

- `cd mobile && npm run lint` passes with exit code 0.
- Tapping an option displays a snappy, tactile radio selection animation.
