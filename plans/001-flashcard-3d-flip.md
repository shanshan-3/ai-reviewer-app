# 001 — Add 3D Flip Transition to Flashcard Study Screen

- **Status**: DONE
- **Commit**: 2e63325
- **Severity**: HIGH
- **Category**: Missed opportunities & State indication
- **Estimated scope**: 1 file (`mobile/src/app/(main)/flashcards/[setId].jsx`), ~50 lines

## Problem

In the flashcard study screen (`mobile/src/app/(main)/flashcards/[setId].jsx:285`), tapping a flashcard abruptly swaps the view from the front term to the back definition with zero transition. Flashcards represent a physical, tactile index card; instantaneous text teleportation breaks spatial comprehension and feels disjointed during focused study.

```jsx
/* mobile/src/app/(main)/flashcards/[setId].jsx:285-295 — current */
<View className="py-8 items-center justify-center">
    {!isFlipped ? (
        <Text className="text-center font-geist-semibold text-2xl text-[#001428]">
            {currentCard?.term}
        </Text>
    ) : (
        <View className="gap-4 w-full">
            <Text className="text-center font-geist text-base leading-6 text-[#001428]">
                {currentCard?.definition}
            </Text>
            ...
        </View>
    )}
</View>
```

## Target

Implement an interactive 3D Y-axis card flip using `react-native-reanimated` (already installed at v4.5.1).
When the card is pressed:
1. The card container smoothly rotates from `0deg` to `180deg` over `300ms` using `Easing.bezier(0.23, 1, 0.32, 1)`.
2. Both faces (Front: Term, Back: Definition) render with `backfaceVisibility: 'hidden'`.
3. Front face rotates from `0deg` to `180deg`. Back face rotates from `180deg` to `360deg`.
4. Perspective is set to `1000` to prevent visual distortion on Android and iOS.
5. `ReduceMotion.System` is honored: when reduced motion is enabled, the 3D rotation drops and gracefully cross-fades opacity (`0 → 1` over `150ms`).

```jsx
/* Target implementation structure */
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Easing,
    ReduceMotion,
} from 'react-native-reanimated';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const spin = useSharedValue(0);

// On flip toggle:
spin.value = withTiming(isFlipped ? 0 : 180, {
    duration: 300,
    easing: EASE_OUT,
    reduceMotion: ReduceMotion.System,
});

const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
        { perspective: 1000 },
        { rotateY: `${interpolate(spin.value, [0, 180], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden',
}));

const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
        { perspective: 1000 },
        { rotateY: `${interpolate(spin.value, [0, 180], [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
}));
```

## Repo Conventions to Follow

- Animations are built with `react-native-reanimated` (v4.5.1 installed in `mobile/package.json`).
- Easing token convention: `Easing.bezier(0.23, 1, 0.32, 1)` (see [`mobile/src/providers/toast-provider.jsx:11`](file:///C:/ai-reviewer-app/mobile/src/providers/toast-provider.jsx#L11)).
- Hardware curve styling: `style={{ borderCurve: 'continuous' }}`.
- Font styling: `font-geist`, `font-geist-semibold`, `font-geist-bold`.
- Palette tokens: `#001428` primary navy, `#526071` muted slate, `#E4E8EE` subtle border.

## Steps

1. **Import Reanimated Hooks and Components** in `mobile/src/app/(main)/flashcards/[setId].jsx`:
   ```javascript
   import Animated, {
       useSharedValue,
       useAnimatedStyle,
       withTiming,
       interpolate,
       Easing,
       ReduceMotion,
   } from 'react-native-reanimated';
   ```

2. **Initialize Shared Values**:
   Declare `const spin = useSharedValue(0);` inside `FlashcardStudyPage`.

3. **Update `handleFlip`**:
   Animate `spin.value` whenever `handleFlip` is called:
   ```javascript
   const handleFlip = useCallback(() => {
       const nextFlipped = !isFlipped;
       setIsFlipped(nextFlipped);
       spin.value = withTiming(nextFlipped ? 180 : 0, {
           duration: 300,
           easing: Easing.bezier(0.23, 1, 0.32, 1),
           reduceMotion: ReduceMotion.System,
       });
       if (nextFlipped) {
           setViewedBacks(current => new Set(current).add(currentIndex));
       }
   }, [isFlipped, currentIndex]);
   ```

4. **Reset Rotation on Card Navigation**:
   In `handleNext`, `handlePrev`, and `handleRestart`, immediately reset `spin.value = 0` so the incoming card starts on its front face without an unwanted reverse spin:
   ```javascript
   function handleNext() {
       if (currentIndex < cards.length - 1) {
           spin.value = 0;
           setIsFlipped(false);
           setCurrentIndex(prev => prev + 1);
       } else {
           finishStudy();
       }
   }
   ```

5. **Split Card Content into Front & Back Animated Layers**:
   Wrap the card faces in `<Animated.View style={frontAnimatedStyle}>` and `<Animated.View style={backAnimatedStyle}>` inside the `<Pressable>` card container at `mobile/src/app/(main)/flashcards/[setId].jsx:265`.

## Boundaries

- Do NOT touch server files or API contracts.
- Do NOT alter flashcard data models, review tracking, or streak qualification logic.
- Do NOT install any third-party 3D or animation libraries; use the existing `react-native-reanimated` installation.
- Do NOT change the header or bottom navigation toolbar.

## Verification

- **Mechanical**:
  - Run `cd mobile && npm run lint` — must pass with exit code 0.
- **Feel check**:
  - Open a flashcard deck on an Android/iOS emulator or device.
  - Tap the card: verify it smoothly rotates along the Y-axis like a physical index card.
  - Tap repeatedly: verify the rotation reverses smoothly without jumping or snapping to 0.
  - Tap "Next": verify the next card immediately displays the front term without a reverse flip animation.
  - Test with Android "Remove animations" system accessibility setting toggled on: verify the 3D flip cleanly degrades to an instantaneous or gentle opacity crossfade.
- **Done when**: The flashcard flips with a crisp 300ms 3D rotation, never teleports content, and passes `expo lint`.
