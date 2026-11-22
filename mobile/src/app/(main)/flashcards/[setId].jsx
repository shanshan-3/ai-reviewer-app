/* eslint-disable react-hooks/immutability */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
    Easing,
    ReduceMotion,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import IconRotate from '@tabler/icons-react-native/IconRotate';
import IconFlame from '@tabler/icons-react-native/IconFlame';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconChevronLeft from '@tabler/icons-react-native/IconChevronLeft';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconX from '@tabler/icons-react-native/IconX';
import IconBook from '@tabler/icons-react-native/IconBook';
import { getFlashcardDeck, recordFlashcardReview } from '@/lib/flashcards';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export default function FlashcardStudyPage() {
    const router = useRouter();
    const { setId } = useLocalSearchParams();

    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [viewedBacks, setViewedBacks] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Completion state
    const [isCompleted, setIsCompleted] = useState(false);
    const [recordingReview, setRecordingReview] = useState(false);
    const [reviewRecorded, setReviewRecorded] = useState(false);

    // Direction and transition lock tracking for tactile card transitions
    const direction = useRef('none');
    const isTransitioning = useRef(false);
    const transitionTimer = useRef(null);

    // Reanimated 3D flip & stage animations
    const spin = useSharedValue(0);
    const cardTranslateX = useSharedValue(0);
    const cardScale = useSharedValue(1);
    const cardOpacity = useSharedValue(1);
    const progressWidth = useSharedValue(0);

    // Clear any pending transition timers on unmount
    useEffect(() => {
        return () => {
            if (transitionTimer.current) {
                clearTimeout(transitionTimer.current);
            }
        };
    }, []);

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(spin.value, [0, 180], [0, 180]);
        const scaleValue = interpolate(spin.value, [0, 90, 180], [1, 0.96, 1]);
        return {
            transform: [
                { perspective: 1200 },
                { rotateY: `${rotateValue}deg` },
                { scale: scaleValue },
            ],
            backfaceVisibility: 'hidden',
            opacity: spin.value > 90 ? 0 : 1,
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(spin.value, [0, 180], [180, 360]);
        const scaleValue = interpolate(spin.value, [0, 90, 180], [1, 0.96, 1]);
        return {
            transform: [
                { perspective: 1200 },
                { rotateY: `${rotateValue}deg` },
                { scale: scaleValue },
            ],
            backfaceVisibility: 'hidden',
            opacity: spin.value < 90 ? 0 : 1,
        };
    });

    const stageAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: cardTranslateX.value },
            { scale: cardScale.value },
        ],
        opacity: cardOpacity.value,
    }));

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    useEffect(() => {
        async function loadDeck() {
            setLoading(true);
            setError(null);
            try {
                const data = await getFlashcardDeck(setId);
                setDeck(data.set);
                setCards(data.set?.cards ?? []);
            } catch (err) {
                setError(err.message || 'Could not load flashcard deck.');
            } finally {
                setLoading(false);
            }
        }
        loadDeck();
    }, [setId]);

    // Animate smooth card advancement & entry
    useEffect(() => {
        if (direction.current === 'next') {
            cardTranslateX.value = 28;
            cardScale.value = 0.98;
            cardOpacity.value = 0;
        } else if (direction.current === 'prev') {
            cardTranslateX.value = -28;
            cardScale.value = 0.98;
            cardOpacity.value = 0;
        } else if (direction.current === 'shuffle') {
            cardTranslateX.value = 0;
            cardScale.value = 0.94;
            cardOpacity.value = 0;
        }

        cardTranslateX.value = withSpring(0, {
            duration: 300,
            dampingRatio: 0.85,
            reduceMotion: ReduceMotion.System,
        });
        cardScale.value = withSpring(1, {
            duration: 300,
            dampingRatio: 0.85,
            reduceMotion: ReduceMotion.System,
        });
        cardOpacity.value = withTiming(1, {
            duration: 190,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
        });
    }, [currentIndex, cardTranslateX, cardScale, cardOpacity]);

    // Animate progress bar across steps
    useEffect(() => {
        const total = cards.length;
        const percent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
        progressWidth.value = withTiming(percent, {
            duration: 260,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
        });
    }, [currentIndex, cards.length, progressWidth]);

    const handleFlip = useCallback(() => {
        setIsFlipped(prev => {
            const next = !prev;
            spin.value = withSpring(next ? 180 : 0, {
                duration: 380,
                dampingRatio: 0.85,
                reduceMotion: ReduceMotion.System,
            });
            if (next) {
                setViewedBacks(current => new Set(current).add(currentIndex));
            }
            return next;
        });
    }, [currentIndex, spin]);

    function handleNext() {
        if (currentIndex < cards.length - 1) {
            if (isTransitioning.current) return;
            isTransitioning.current = true;
            direction.current = 'next';

            // Smoothly slide out current card while maintaining its current face (no flashing to term)
            cardTranslateX.value = withTiming(-28, { duration: 110, easing: EASE_OUT });
            cardOpacity.value = withTiming(0, { duration: 110, easing: EASE_OUT });

            transitionTimer.current = setTimeout(() => {
                spin.value = 0;
                setIsFlipped(false);
                setCurrentIndex(prev => prev + 1);
                isTransitioning.current = false;
            }, 110);
        } else {
            finishStudy();
        }
    }

    function handlePrev() {
        if (currentIndex > 0) {
            if (isTransitioning.current) return;
            isTransitioning.current = true;
            direction.current = 'prev';

            // Smoothly slide out current card to the right
            cardTranslateX.value = withTiming(28, { duration: 110, easing: EASE_OUT });
            cardOpacity.value = withTiming(0, { duration: 110, easing: EASE_OUT });

            transitionTimer.current = setTimeout(() => {
                spin.value = 0;
                setIsFlipped(false);
                setCurrentIndex(prev => prev - 1);
                isTransitioning.current = false;
            }, 110);
        }
    }

    async function finishStudy() {
        setIsCompleted(true);
        const totalCards = cards.length;
        const allBacksViewed = viewedBacks.size >= totalCards;

        if (allBacksViewed && totalCards > 0 && !reviewRecorded) {
            setRecordingReview(true);
            try {
                await recordFlashcardReview(setId, totalCards);
                setReviewRecorded(true);
            } catch {
                // Non-blocking review logging failure
            } finally {
                setRecordingReview(false);
            }
        }
    }

    function handleRestart() {
        if (isTransitioning.current) return;
        isTransitioning.current = true;
        direction.current = 'shuffle';

        cardOpacity.value = withTiming(0, { duration: 100, easing: EASE_OUT });
        cardScale.value = withTiming(0.95, { duration: 100, easing: EASE_OUT });

        transitionTimer.current = setTimeout(() => {
            spin.value = 0;
            setCurrentIndex(0);
            setIsFlipped(false);
            setViewedBacks(new Set());
            setIsCompleted(false);
            isTransitioning.current = false;
        }, 100);
    }

    function handleShuffle() {
        if (isTransitioning.current) return;
        isTransitioning.current = true;
        direction.current = 'shuffle';

        cardOpacity.value = withTiming(0, { duration: 100, easing: EASE_OUT });
        cardScale.value = withTiming(0.95, { duration: 100, easing: EASE_OUT });

        transitionTimer.current = setTimeout(() => {
            spin.value = 0;
            const shuffled = [...cards].sort(() => Math.random() - 0.5);
            setCards(shuffled);
            setCurrentIndex(0);
            setIsFlipped(false);
            setViewedBacks(new Set());
            isTransitioning.current = false;
        }, 100);
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center gap-3">
                <ActivityIndicator size="small" color="#001428" />
                <Text className="font-geist text-xs text-[#526071]">Loading...</Text>
            </SafeAreaView>
        );
    }

    if (error || !deck) {
        return (
            <SafeAreaView className="flex-1 bg-background p-6 items-center justify-center gap-4">
                <Text className="font-geist-bold text-base text-[#001428]">
                    {error || 'Deck not found'}
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    className="rounded-full bg-[#001428] px-5 py-2.5 active:opacity-80"
                    style={{ borderCurve: 'continuous' }}
                >
                    <Text className="font-geist-semibold text-xs text-white">Back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const currentCard = cards[currentIndex];
    const totalCards = cards.length;
    const allBacksViewed = viewedBacks.size >= totalCards;

    // Completion View
    if (isCompleted) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
                {/* Header */}
                <View className="flex-row items-center border-b border-[#F1F3F6] bg-white px-5 py-3.5">
                    <Pressable
                        hitSlop={10}
                        onPress={() => router.back()}
                        className="h-9 w-9 items-center justify-center rounded-xl bg-[#F1F4F8] active:bg-[#E2E8F0]"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <IconX size={18} color="#001428" />
                    </Pressable>
                    <Text className="ml-3 font-geist-bold text-base text-[#001428]">
                        Complete
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 24, alignItems: 'center', gap: 20, paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        className="mt-6 h-20 w-20 items-center justify-center rounded-3xl bg-[#001428]"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <IconCheck size={36} color="#FFFFFF" strokeWidth={2.5} />
                    </View>

                    <View className="items-center gap-1">
                        <Text className="font-geist-bold text-2xl text-[#001428] tracking-tight">
                            Deck Complete
                        </Text>
                        <Text className="text-center font-geist text-xs text-[#526071] max-w-xs">
                            {`${totalCards} terms reviewed in "${deck.title}".`}
                        </Text>
                    </View>

                    {/* Streak Milestone Pill */}
                    {allBacksViewed ? (
                        <View
                            className="w-full flex-row items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-100/90">
                                <IconFlame size={18} color="#D97706" fill="#FDE68A" strokeWidth={2} />
                            </View>
                            <View className="flex-1">
                                <Text className="font-geist-semibold text-xs text-amber-900">
                                    Daily Study Goal Completed
                                </Text>
                                <Text className="font-geist text-[11px] text-amber-800/85">
                                    {recordingReview
                                        ? 'Saving streak progress…'
                                        : 'This flashcard study session qualifies toward your daily study streak.'}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View
                            className="w-full flex-row items-center gap-2.5 rounded-2xl border border-[#E5E9F0] bg-white p-3.5"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#F1F4F8]">
                                <IconFlame size={18} color="#526071" strokeWidth={2} />
                            </View>
                            <View className="flex-1">
                                <Text className="font-geist-semibold text-xs text-[#001428]">
                                    Study Streak Incomplete
                                </Text>
                                <Text className="font-geist text-[11px] text-[#526071]">
                                    {`Review all card backs to qualify for today's streak (${viewedBacks.size}/${totalCards} cards viewed).`}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Actions */}
                    <View className="w-full gap-3 mt-4">
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Study again"
                            onPress={handleRestart}
                            className="w-full items-center justify-center rounded-2xl bg-[#001428] py-3.5"
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed ? 0.98 : 1 }],
                                },
                            ]}
                        >
                            <Text className="font-geist-semibold text-sm text-white">Study Again</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Done"
                            onPress={() => router.back()}
                            className="w-full items-center justify-center rounded-2xl bg-[#F1F4F8] py-3.5"
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed ? 0.98 : 1 }],
                                    backgroundColor: pressed ? '#E2E8F0' : '#F1F4F8',
                                },
                            ]}
                        >
                            <Text className="font-geist-semibold text-sm text-[#001428]">
                                Done
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-[#F1F3F6] bg-white px-5 py-3">
                <Pressable
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Exit study session"
                    onPress={() => router.back()}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-[#F1F4F8] active:bg-[#E2E8F0]"
                    style={({ pressed }) => [
                        {
                            borderCurve: 'continuous',
                            transform: [{ scale: pressed ? 0.94 : 1 }],
                        },
                    ]}
                >
                    <IconX size={18} color="#001428" strokeWidth={2} />
                </Pressable>

                <View className="items-center max-w-[200px]">
                    <Text numberOfLines={1} className="font-geist-bold text-sm text-[#001428]">
                        {deck.title}
                    </Text>
                    <Text
                        style={{ fontVariant: ['tabular-nums'] }}
                        className="font-geist text-[11px] text-[#526071] mt-0.5"
                    >
                        {currentIndex + 1} of {totalCards}
                    </Text>
                </View>

                <Pressable
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Shuffle cards"
                    onPress={handleShuffle}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-[#F1F4F8] active:bg-[#E2E8F0]"
                    style={({ pressed }) => [
                        {
                            borderCurve: 'continuous',
                            transform: [{ scale: pressed ? 0.94 : 1 }],
                        },
                    ]}
                >
                    <IconRotate size={16} color="#001428" strokeWidth={2} />
                </Pressable>
            </View>

            {/* Progress Bar (Animated) */}
            <View className="h-1 w-full bg-[#EAECEF] overflow-hidden">
                <Animated.View
                    className="h-full bg-[#001428] rounded-full"
                    style={[{ borderCurve: 'continuous' }, progressAnimatedStyle]}
                />
            </View>

            {/* 3D Card Stage with Horizontal Advancement Spring */}
            <View className="flex-1 px-5 py-4 justify-center">
                <Animated.View
                    style={[{ width: '100%', minHeight: 440, justifyContent: 'center' }, stageAnimatedStyle]}
                >
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Flashcard: ${currentCard?.term || ''}. ${isFlipped ? 'Definition' : 'Term'}. Tap to flip.`}
                        onPress={handleFlip}
                        className="w-full min-h-[440px] relative justify-center"
                        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
                    >
                        {/* Front (Term) */}
                        <Animated.View
                            style={[{ borderCurve: 'continuous' }, frontAnimatedStyle]}
                            className="w-full min-h-[440px] rounded-3xl border border-[#E5E9F0] bg-white p-7 justify-between"
                        >
                            <View className="flex-row items-center justify-between">
                                <View
                                    className="rounded-full bg-[#F1F4F8] px-2.5 py-0.5"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className="font-geist-bold text-[10px] uppercase tracking-wider text-[#526071]">
                                        Term
                                    </Text>
                                </View>
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="font-geist text-[11px] text-[#94A3B8]"
                                >
                                    {currentIndex + 1} / {totalCards}
                                </Text>
                            </View>

                            {/* Center Term */}
                            <View className="py-12 items-center justify-center px-4">
                                <Text className="text-center font-geist-bold text-2xl text-[#001428] tracking-tight leading-snug">
                                    {currentCard?.term}
                                </Text>
                            </View>

                            {/* Bottom Flip Cue */}
                            <View className="items-center border-t border-[#F1F3F6] pt-3">
                                <View className="flex-row items-center gap-1.5 rounded-full bg-[#F1F4F8] px-3.5 py-1.5">
                                    <IconRotate size={12} color="#526071" strokeWidth={2} />
                                    <Text className="font-geist-medium text-[11px] text-[#526071]">
                                        Tap card to flip
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Back (Definition) */}
                        <Animated.View
                            style={[{ borderCurve: 'continuous', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backAnimatedStyle]}
                            className="w-full min-h-[440px] rounded-3xl border border-[#E5E9F0] bg-white p-7 justify-between"
                        >
                            <View className="flex-row items-center justify-between">
                                <View
                                    className="rounded-full bg-emerald-50 px-2.5 py-0.5 border border-emerald-100"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className="font-geist-bold text-[10px] uppercase tracking-wider text-emerald-800">
                                        Definition
                                    </Text>
                                </View>
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="font-geist text-[11px] text-[#94A3B8]"
                                >
                                    {currentIndex + 1} / {totalCards}
                                </Text>
                            </View>

                            {/* Center Definition */}
                            <View className="py-6 items-center justify-center">
                                <View className="gap-3.5 w-full">
                                    <Text className="text-center font-geist text-base leading-relaxed text-[#001428]">
                                        {currentCard?.definition}
                                    </Text>

                                    {currentCard?.sourceExcerpt && (
                                        <View
                                            className="rounded-2xl border border-[#E5E9F0] bg-[#F8F9FC] p-3.5 gap-1.5"
                                            style={{ borderCurve: 'continuous' }}
                                        >
                                            <View className="flex-row items-center gap-1.5">
                                                <IconBook size={12} color="#526071" strokeWidth={2} />
                                                <Text className="font-geist-semibold text-[9px] uppercase tracking-wider text-[#526071]">
                                                    Source
                                                </Text>
                                            </View>
                                            <Text
                                                numberOfLines={3}
                                                className="font-geist text-xs italic text-[#526071] leading-snug"
                                            >
                                                {`"${currentCard.sourceExcerpt}"`}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Bottom Flip Cue */}
                            <View className="items-center border-t border-[#F1F3F6] pt-3">
                                <View className="flex-row items-center gap-1.5 rounded-full bg-[#F1F4F8] px-3.5 py-1.5">
                                    <IconRotate size={12} color="#526071" strokeWidth={2} />
                                    <Text className="font-geist-medium text-[11px] text-[#526071]">
                                        Tap card to flip
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                    </Pressable>
                </Animated.View>
            </View>

            {/* Bottom Toolbar */}
            <View className="flex-row items-center justify-between border-t border-[#F1F3F6] bg-white px-5 py-3.5">
                <Pressable
                    disabled={currentIndex === 0}
                    accessibilityRole="button"
                    accessibilityLabel="Previous card"
                    onPress={handlePrev}
                    className={`h-11 w-11 items-center justify-center rounded-2xl bg-[#F1F4F8] ${
                        currentIndex === 0 ? 'opacity-30' : 'active:bg-[#E2E8F0]'
                    }`}
                    style={({ pressed }) => [
                        {
                            borderCurve: 'continuous',
                            transform: [{ scale: pressed && currentIndex > 0 ? 0.94 : 1 }],
                        },
                    ]}
                >
                    <IconChevronLeft size={20} color="#001428" strokeWidth={2.2} />
                </Pressable>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Flip card to view ${isFlipped ? 'term' : 'definition'}`}
                    onPress={handleFlip}
                    className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 border ${
                        viewedBacks.has(currentIndex)
                            ? 'bg-emerald-50 border-emerald-100'
                            : 'bg-[#F1F4F8] border-transparent'
                    }`}
                    style={({ pressed }) => [
                        {
                            borderCurve: 'continuous',
                            transform: [{ scale: pressed ? 0.96 : 1 }],
                        },
                    ]}
                >
                    <IconCheck
                        size={13}
                        color={viewedBacks.has(currentIndex) ? '#059669' : '#94A3B8'}
                        strokeWidth={2.5}
                    />
                    <Text
                        className={`font-geist-semibold text-xs ${
                            viewedBacks.has(currentIndex) ? 'text-emerald-800' : 'text-[#526071]'
                        }`}
                    >
                        {viewedBacks.has(currentIndex) ? 'Reviewed' : 'Reviewing'}
                    </Text>
                </Pressable>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={currentIndex === totalCards - 1 ? 'Finish deck' : 'Next card'}
                    onPress={handleNext}
                    className="h-11 flex-row items-center gap-1.5 rounded-2xl bg-[#001428] px-5 active:opacity-90"
                    style={({ pressed }) => [
                        {
                            borderCurve: 'continuous',
                            transform: [{ scale: pressed ? 0.96 : 1 }],
                        },
                    ]}
                >
                    <Text className="font-geist-semibold text-xs text-white">
                        {currentIndex === totalCards - 1 ? 'Finish' : 'Next'}
                    </Text>
                    {currentIndex === totalCards - 1 ? (
                        <IconCheck size={16} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                        <IconChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
