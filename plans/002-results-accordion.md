# 002 — Add Smooth Accordion Expansion to Quiz Results Explanations

- **Status**: DONE
- **Commit**: 2e63325
- **Severity**: MEDIUM
- **Category**: Preventing a jarring change
- **Estimated scope**: 1 file (`mobile/src/app/(main)/quizzes/[sessionId]/results.jsx`), ~20 lines

## Problem

In [`results.jsx:270`](file:///C:/ai-reviewer-app/mobile/src/app/(main)/quizzes/[sessionId]/results.jsx#L270), clicking a question in the breakdown list abruptly pops the explanation details container into view (`{isExpanded && <View>}`). The sudden layout shift jars the reading flow.

## Target

Apply Reanimated layout and entrance animations:
1. Wrap the question card in `<Animated.View layout={LinearTransition.duration(200).easing(Easing.bezier(0.23, 1, 0.32, 1)).reduceMotion(ReduceMotion.System)}>`.
2. Wrap the expanded details in `<Animated.View entering={FadeInDown.duration(160).easing(Easing.bezier(0.23, 1, 0.32, 1)).reduceMotion(ReduceMotion.System)} exiting={FadeOutUp.duration(120).easing(Easing.bezier(0.23, 1, 0.32, 1)).reduceMotion(ReduceMotion.System)}>`.
3. Respect `ReduceMotion.System` for users with motion sensitivity.

## Steps

1. Import `Animated`, `LinearTransition`, `FadeInDown`, `FadeOutUp`, `Easing`, and `ReduceMotion` from `react-native-reanimated`.
2. Replace static outer `<View>` with `<Animated.View layout={...}>`.
3. Replace `{isExpanded && <View ...>}` with `<Animated.View entering={...} exiting={...}>`.

## Verification

- `cd mobile && npm run lint` passes with exit code 0.
- Expanding a question animates height smoothly in ~200ms without visual hitching.
