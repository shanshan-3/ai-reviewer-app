/* eslint-disable react-hooks/immutability */
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
    Easing,
    ReduceMotion,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';
import IconRotate from '@tabler/icons-react-native/IconRotate';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconChevronLeft from '@tabler/icons-react-native/IconChevronLeft';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import { getFlashcardDeck, recordFlashcardReview } from '@/lib/flashcards';

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

    // Reanimated 3D flip animation
    const spin = useSharedValue(0);

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(spin.value, [0, 180], [0, 180]);
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateValue}deg` },
            ],
            backfaceVisibility: 'hidden',
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(spin.value, [0, 180], [180, 360]);
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateValue}deg` },
            ],
            backfaceVisibility: 'hidden',
        };
    });

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

    const handleFlip = useCallback(() => {
        setIsFlipped(prev => {
            const next = !prev;
            spin.value = withTiming(next ? 180 : 0, {
                duration: 300,
                easing: Easing.bezier(0.23, 1, 0.32, 1),
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
            spin.value = 0;
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        } else {
            finishStudy();
        }
    }

    function handlePrev() {
        if (currentIndex > 0) {
            spin.value = 0;
            setIsFlipped(false);
            setCurrentIndex(prev => prev - 1);
        }
    }

    async function finishStudy() {
        setIsCompleted(true);
        // Requirement: Only qualifying full-set review qualifies for study streak
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
        spin.value = 0;
        setCurrentIndex(0);
        setIsFlipped(false);
        setViewedBacks(new Set());
        setIsCompleted(false);
    }

    function handleShuffle() {
        spin.value = 0;
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        setViewedBacks(new Set());
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-[#F8F8FF] items-center justify-center gap-3">
                <ActivityIndicator size="small" color="#001428" />
                <Text className="font-geist text-xs text-[#526071]">Loading flashcard deck...</Text>
            </SafeAreaView>
        );
    }

    if (error || !deck) {
        return (
            <SafeAreaView className="flex-1 bg-[#F8F8FF] p-6 items-center justify-center gap-4">
                <Text className="font-geist-semibold text-base text-[#001428]">
                    {error || 'Deck not found'}
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    className="rounded-full bg-[#001428] px-5 py-2.5 active:opacity-80"
                >
                    <Text className="font-geist-medium text-xs text-white">Go Back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const currentCard = cards[currentIndex];
    const totalCards = cards.length;
    const progressPercent = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;
    const allBacksViewed = viewedBacks.size >= totalCards;

    // Completion View
    if (isCompleted) {
        return (
            <SafeAreaView className="flex-1 bg-[#F8F8FF]" edges={['top', 'left', 'right']}>
                <View className="flex-row items-center border-b border-[#E4E8EE] bg-white px-5 py-3.5">
                    <Pressable
                        hitSlop={10}
                        onPress={() => router.back()}
                        className="rounded-full p-1 active:bg-[#F1F4F8]"
                    >
                        <IconArrowLeft size={22} color="#001428" />
                    </Pressable>
                    <Text className="ml-2 font-geist-semibold text-lg text-[#001428]">
                        Review Complete
                    </Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center', gap: 20 }}>
                    <View className="mt-8 h-20 w-20 items-center justify-center rounded-full bg-[#F1F4F8]">
                        <IconCheck size={36} color="#001428" />
                    </View>

                    <View className="items-center gap-1">
                        <Text className="font-geist-semibold text-2xl text-[#001428]">
                            Deck Completed!
                        </Text>
                        <Text className="text-center font-geist text-sm text-[#526071]">
                            {`You reviewed all ${totalCards} technical terms in "${deck.title}".`}
                        </Text>
                    </View>

                    {/* Streak Qualification Card */}
                    <View
                        className="w-full rounded-2xl border border-[#E4E8EE] bg-white p-4 gap-2"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-row items-center gap-2">
                            <IconSparkles size={18} color="#001428" />
                            <Text className="font-geist-semibold text-sm text-[#001428]">
                                Study Day Qualification
                            </Text>
                        </View>
                        {recordingReview ? (
                            <View className="flex-row items-center gap-2 py-1">
                                <ActivityIndicator size="small" color="#001428" />
                                <Text className="font-geist text-xs text-[#526071]">Recording study session...</Text>
                            </View>
                        ) : allBacksViewed ? (
                            <Text className="font-geist text-xs leading-5 text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                                ✓ Full-deck review verified: all card backs were inspected. This session qualifies toward your study streak!
                            </Text>
                        ) : (
                            <Text className="font-geist text-xs leading-5 text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                                Notice: Only full reviews where every card back is viewed qualify for study streaks. ({viewedBacks.size}/{totalCards} backs viewed).
                            </Text>
                        )}
                    </View>

                    {/* Actions */}
                    <View className="w-full gap-3 mt-4">
                        <Pressable
                            onPress={handleRestart}
                            className="w-full items-center justify-center rounded-2xl bg-[#001428] py-4 active:opacity-90"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <Text className="font-geist-semibold text-sm text-white">Restart Deck</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => router.back()}
                            className="w-full items-center justify-center rounded-2xl border border-[#E4E8EE] bg-white py-4 active:bg-[#F1F4F8]"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <Text className="font-geist-semibold text-sm text-[#001428]">
                                Back to Flashcards
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F8F8FF]" edges={['top', 'left', 'right']}>
            {/* Top Navigation */}
            <View className="flex-row items-center justify-between border-b border-[#E4E8EE] bg-white px-5 py-3.5">
                <Pressable
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={() => router.back()}
                    className="rounded-full p-1 active:bg-[#F1F4F8]"
                >
                    <IconArrowLeft size={22} color="#001428" />
                </Pressable>

                <View className="items-center">
                    <Text numberOfLines={1} className="max-w-[200px] font-geist-semibold text-sm text-[#001428]">
                        {deck.title}
                    </Text>
                    <Text className="font-geist text-[11px] text-[#526071]">
                        Card {currentIndex + 1} of {totalCards}
                    </Text>
                </View>

                <Pressable
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Shuffle cards"
                    onPress={handleShuffle}
                    className="rounded-full p-1.5 active:bg-[#F1F4F8]"
                >
                    <IconRotate size={18} color="#001428" />
                </Pressable>
            </View>

            {/* Progress Bar */}
            <View className="h-1 w-full bg-[#E4E8EE]">
                <View
                    className="h-full bg-[#001428]"
                    style={{ width: `${progressPercent}%` }}
                />
            </View>

            {/* Main Interactive Flashcard View */}
            <View className="flex-1 p-6 justify-center">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Flashcard: ${currentCard?.term || ''}. ${isFlipped ? 'Showing definition' : 'Showing term'}. Tap to flip card.`}
                    onPress={handleFlip}
                    className="w-full min-h-[360px] relative justify-center active:opacity-95"
                >
                    {/* Front Face (Term) */}
                    <Animated.View
                        style={[{ borderCurve: 'continuous' }, frontAnimatedStyle]}
                        className="w-full min-h-[360px] rounded-3xl border border-[#E4E8EE] bg-white p-6 shadow-sm justify-between"
                    >
                        {/* Card Side Pill */}
                        <View className="flex-row items-center justify-between">
                            <View className="rounded-full bg-[#F1F4F8] px-3 py-1">
                                <Text className="font-geist-semibold text-[10px] uppercase tracking-wider text-[#001428]">
                                    Front • Term
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                                <IconRotate size={14} color="#9CA3AF" />
                                <Text className="font-geist text-[11px] text-[#9CA3AF]">Tap to flip</Text>
                            </View>
                        </View>

                        {/* Card Content Area */}
                        <View className="py-8 items-center justify-center">
                            <Text className="text-center font-geist-semibold text-2xl text-[#001428]">
                                {currentCard?.term}
                            </Text>
                        </View>

                        {/* Card Bottom Hint */}
                        <View className="items-center border-t border-[#F1F4F8] pt-3">
                            <Text className="font-geist text-[11px] text-[#526071]">
                                Tap card to reveal definition
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Back Face (Definition & Source) */}
                    <Animated.View
                        style={[{ borderCurve: 'continuous', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backAnimatedStyle]}
                        className="w-full min-h-[360px] rounded-3xl border border-[#E4E8EE] bg-white p-6 shadow-sm justify-between"
                    >
                        {/* Card Side Pill */}
                        <View className="flex-row items-center justify-between">
                            <View className="rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200">
                                <Text className="font-geist-semibold text-[10px] uppercase tracking-wider text-emerald-900">
                                    Back • Definition
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                                <IconRotate size={14} color="#9CA3AF" />
                                <Text className="font-geist text-[11px] text-[#9CA3AF]">Tap to flip</Text>
                            </View>
                        </View>

                        {/* Card Content Area */}
                        <View className="py-8 items-center justify-center">
                            <View className="gap-4 w-full">
                                <Text className="text-center font-geist text-base leading-6 text-[#001428]">
                                    {currentCard?.definition}
                                </Text>

                                {currentCard?.sourceExcerpt && (
                                    <View className="rounded-xl border border-[#E4E8EE] bg-[#F8F8FF] p-3 gap-1">
                                        <View className="flex-row items-center gap-1">
                                            <IconFileText size={12} color="#526071" />
                                            <Text className="font-geist-medium text-[10px] uppercase text-[#526071]">
                                                Source Reference
                                            </Text>
                                        </View>
                                        <Text
                                            numberOfLines={3}
                                            className="font-geist text-xs italic text-[#526071]"
                                        >
                                            {`"${currentCard.sourceExcerpt}"`}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Card Bottom Hint */}
                        <View className="items-center border-t border-[#F1F4F8] pt-3">
                            <Text className="font-geist text-[11px] text-[#526071]">
                                Tap card again to view term
                            </Text>
                        </View>
                    </Animated.View>
                </Pressable>
            </View>

            {/* Bottom Navigation Toolbar */}
            <View className="flex-row items-center justify-between border-t border-[#E4E8EE] bg-white px-6 py-4">
                <Pressable
                    disabled={currentIndex === 0}
                    accessibilityRole="button"
                    accessibilityLabel="Previous card"
                    onPress={handlePrev}
                    className={`min-h-[48px] flex-row items-center gap-1 rounded-2xl border border-[#E4E8EE] px-4 py-3 active:bg-[#F1F4F8] ${
                        currentIndex === 0 ? 'opacity-30' : ''
                    }`}
                    style={{ borderCurve: 'continuous' }}
                >
                    <IconChevronLeft size={18} color="#001428" />
                    <Text className="font-geist-medium text-xs text-[#001428]">Previous</Text>
                </Pressable>

                <View className="items-center">
                    <Text className="font-geist-semibold text-xs text-[#001428]">
                        {viewedBacks.has(currentIndex) ? '✓ Viewed' : 'Unviewed'}
                    </Text>
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={currentIndex === totalCards - 1 ? 'Finish deck' : 'Next card'}
                    onPress={handleNext}
                    className="min-h-[48px] flex-row items-center gap-1 rounded-2xl bg-[#001428] px-5 py-3 active:opacity-90"
                    style={{ borderCurve: 'continuous' }}
                >
                    <Text className="font-geist-medium text-xs text-white">
                        {currentIndex === totalCards - 1 ? 'Finish' : 'Next'}
                    </Text>
                    {currentIndex === totalCards - 1 ? (
                        <IconCheck size={16} color="#FFFFFF" />
                    ) : (
                        <IconChevronRight size={16} color="#FFFFFF" />
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
