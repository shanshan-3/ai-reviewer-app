import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
    Easing,
    FadeInDown,
    FadeOutUp,
    LinearTransition,
    ReduceMotion,
} from 'react-native-reanimated';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconX from '@tabler/icons-react-native/IconX';
import IconChevronDown from '@tabler/icons-react-native/IconChevronDown';
import IconChevronUp from '@tabler/icons-react-native/IconChevronUp';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import IconFlame from '@tabler/icons-react-native/IconFlame';
import { getStudySessionResults } from '@/lib/quizzes';

import { THEME } from '@/lib/theme';

const DIFFICULTY_CONFIG = {
    easy: { label: 'Easy', bg: 'bg-[#ECFDF5]', text: 'text-[#065F46]', border: 'border-[#A7F3D0]' },
    medium: { label: 'Medium', bg: 'bg-[#EFF6FF]', text: 'text-[#1E40AF]', border: 'border-[#BFDBFE]' },
    hard: { label: 'Hard', bg: 'bg-[#FAF5FF]', text: 'text-[#6B21A8]', border: 'border-[#E9D5FF]' },
};

export default function ResultsPage() {
    const { sessionId } = useLocalSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'incorrect'
    const [expandedIds, setExpandedIds] = useState(new Set());

    useEffect(() => {
        async function fetchResults() {
            setLoading(true);
            setError(null);
            try {
                const res = await getStudySessionResults(sessionId);
                setResults(res);
                // expand first question by default
                if (res.answers?.[0]?.questionId) {
                    setExpandedIds(new Set([res.answers[0].questionId]));
                }
            } catch (err) {
                setError(err.message || 'Could not load quiz results.');
            } finally {
                setLoading(false);
            }
        }
        if (sessionId) fetchResults();
    }, [sessionId]);

    // Handle Android system back press to return to dashboard cleanly
    useEffect(() => {
        const onBackPress = () => {
            router.replace('/(main)/(tabs)/dashboard');
            return true;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [router]);

    function toggleExpand(id) {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color={THEME.primary} />
                <Text className="mt-3 font-geist text-sm text-muted-foreground">Compiling quiz results...</Text>
            </SafeAreaView>
        );
    }

    if (error || !results) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-background p-6">
                <Text className="text-center font-geist-semibold text-lg text-foreground">Could not load results</Text>
                <Text className="mt-2 text-center font-geist text-sm text-muted-foreground">{error}</Text>
                <Pressable
                    onPress={() => router.replace('/(main)/(tabs)/dashboard')}
                    className="mt-6 rounded-2xl bg-secondary px-5 py-3"
                >
                    <Text className="font-geist-medium text-sm text-foreground">Back to Dashboard</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const answers = results.answers ?? [];
    const correctCount = results.correctCount ?? 0;
    const totalCount = results.questionCount ?? answers.length;
    const incorrectCount = totalCount - correctCount;
    const accuracyPercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    const filteredAnswers = answers.filter(a => {
        if (filter === 'correct') return a.correct;
        if (filter === 'incorrect') return !a.correct;
        return true;
    });

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            {/* Header */}
            <View className="flex-row items-center border-b border-[#E4E8EE] bg-white px-4 py-3">
                <Pressable
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Return to Dashboard"
                    onPress={() => router.replace('/(main)/(tabs)/dashboard')}
                    className="mr-3 h-10 w-10 items-center justify-center rounded-full active:bg-[#F1F4F8]"
                >
                    <IconArrowLeft size={22} color="#001428" />
                </Pressable>
                <Text className="font-geist-semibold text-lg text-[#001428]">Quiz Results</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}>
                {/* Score Summary Card */}
                <View className="overflow-hidden rounded-3xl border border-[#E4E8EE] bg-white p-6">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="font-geist text-xs uppercase tracking-wider text-[#526071]">
                                Final Score
                            </Text>
                            <Text className="font-geist-bold text-4xl text-[#001428]">
                                {correctCount} <Text className="text-2xl font-normal text-[#526071]">/ {totalCount}</Text>
                            </Text>
                        </View>

                        <View className="items-end">
                            <View className="rounded-2xl bg-[#F1F4F8] px-4 py-2">
                                <Text className="font-geist-bold text-xl text-[#001428]">{accuracyPercent}%</Text>
                            </View>
                            <Text className="mt-1 font-geist text-xs capitalize text-[#526071]">
                                {results.startingDifficulty || 'medium'} difficulty
                            </Text>
                        </View>
                    </View>

                    <Text className="mt-4 font-geist text-xs leading-5 text-[#526071]">
                        {accuracyPercent >= 80
                            ? 'Excellent performance! You demonstrated solid mastery of these questions.'
                            : accuracyPercent >= 60
                            ? 'Good effort. Review explanations below to strengthen your understanding.'
                            : 'Review the detailed explanations and module excerpts below to improve your score.'}
                    </Text>

                    {/* Streak Milestone Pill */}
                    <View
                        className="mt-4 flex-row items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="h-7 w-7 items-center justify-center rounded-lg bg-amber-100/90">
                            <IconFlame size={16} color="#D97706" fill="#FDE68A" strokeWidth={2} />
                        </View>
                        <View className="flex-1">
                            <Text className="font-geist-semibold text-xs text-amber-900">
                                Daily Study Goal Completed
                            </Text>
                            <Text className="font-geist text-[11px] text-amber-800/85">
                                This quiz session qualifies toward your daily study streak.
                            </Text>
                        </View>
                    </View>
                </View>


                {/* Filter Tabs */}
                <View className="flex-row rounded-xl bg-[#F1F4F8] p-1">
                    {[
                        { id: 'all', label: `All (${answers.length})` },
                        { id: 'correct', label: `Correct (${correctCount})` },
                        { id: 'incorrect', label: `Incorrect (${incorrectCount})` },
                    ].map(tab => (
                        <Pressable
                            key={tab.id}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: filter === tab.id }}
                            onPress={() => setFilter(tab.id)}
                            className={`flex-1 items-center justify-center rounded-lg py-2 ${
                                filter === tab.id ? 'bg-white' : ''
                            }`}
                        >
                            <Text
                                className={`font-geist-medium text-xs ${
                                    filter === tab.id ? 'text-[#001428]' : 'text-[#526071]'
                                }`}
                            >
                                {tab.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Question Breakdown List */}
                <View className="gap-3">
                    {filteredAnswers.length === 0 ? (
                        <View className="items-center justify-center rounded-2xl border border-dashed border-[#E4E8EE] bg-white p-8">
                            <Text className="font-geist text-sm text-[#526071]">No questions in this filter.</Text>
                        </View>
                    ) : (
                        filteredAnswers.map((item, idx) => {
                            const isExpanded = expandedIds.has(item.questionId);
                            const selectedOption = item.options?.find(o => o.id === item.selectedOptionId);
                            const correctOption = item.options?.find(o => o.id === item.correctOptionId);

                            return (
                                <Animated.View
                                    key={item.questionId}
                                    layout={LinearTransition.duration(200).easing(Easing.bezier(0.23, 1, 0.32, 1)).reduceMotion(ReduceMotion.System)}
                                    className="overflow-hidden rounded-2xl border border-[#E4E8EE] bg-white"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    {/* Card Header Accordion Trigger */}
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityState={{ expanded: isExpanded }}
                                        onPress={() => toggleExpand(item.questionId)}
                                        className="flex-row items-center justify-between p-4 active:opacity-80"
                                    >
                                        <View className="flex-1 flex-row items-start gap-3 pr-2">
                                            {/* Correct / Incorrect Icon Badge */}
                                            <View
                                                className="mt-0.5 h-6 w-6 items-center justify-center rounded-full"
                                                style={{
                                                    backgroundColor: item.correct
                                                        ? 'rgba(16, 185, 129, 0.15)'
                                                        : 'rgba(239, 68, 68, 0.15)',
                                                }}
                                            >
                                                {item.correct ? (
                                                    <IconCheck size={14} color="#10b981" />
                                                ) : (
                                                    <IconX size={14} color="#ef4444" />
                                                )}
                                            </View>

                                            <View className="flex-1">
                                                <View className="flex-row items-center gap-2">
                                                    <Text className="font-geist text-xs text-[#526071]">
                                                        Question {idx + 1}
                                                    </Text>
                                                    {item.difficulty && (
                                                        <View className={`rounded-full border px-2 py-0.5 ${DIFFICULTY_CONFIG[item.difficulty]?.bg || 'bg-[#F1F4F8]'} ${DIFFICULTY_CONFIG[item.difficulty]?.border || 'border-[#E4E8EE]'}`}>
                                                            <Text className={`font-geist-semibold text-[10px] capitalize ${DIFFICULTY_CONFIG[item.difficulty]?.text || 'text-[#526071]'}`}>
                                                                {item.difficulty}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text numberOfLines={isExpanded ? undefined : 2} className="mt-0.5 font-geist-medium text-sm text-[#001428]">
                                                    {item.prompt}
                                                </Text>
                                            </View>
                                        </View>

                                        {isExpanded ? (
                                            <IconChevronUp size={20} color="#526071" />
                                        ) : (
                                            <IconChevronDown size={20} color="#526071" />
                                        )}
                                    </Pressable>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <Animated.View
                                            entering={FadeInDown.duration(160).easing(Easing.bezier(0.23, 1, 0.32, 1)).reduceMotion(ReduceMotion.System)}
                                            exiting={FadeOutUp.duration(120).easing(Easing.bezier(0.23, 1, 0.32, 1)).reduceMotion(ReduceMotion.System)}
                                            className="border-t border-[#E4E8EE] bg-[#F1F4F8] p-4 gap-3"
                                        >
                                            {/* Code Snippet if present */}
                                            {item.code?.text && (
                                                <View className="overflow-hidden rounded-xl bg-[#001428] p-3">
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                        <Text className="font-mono text-xs text-white">
                                                            {item.code.text}
                                                        </Text>
                                                    </ScrollView>
                                                </View>
                                            )}

                                            {/* Selected vs Correct Option */}
                                            <View className="gap-2">
                                                <View className="flex-row items-start gap-2">
                                                    <Text className="font-geist-semibold text-xs text-[#526071]">Your Answer:</Text>
                                                    <Text className={`flex-1 font-geist text-xs ${item.correct ? 'text-emerald-600' : 'text-[#DC2626]'}`}>
                                                        {selectedOption ? `${selectedOption.id.toUpperCase()}. ${selectedOption.text}` : 'None'}
                                                    </Text>
                                                </View>

                                                {!item.correct && (
                                                    <View className="flex-row items-start gap-2">
                                                        <Text className="font-geist-semibold text-xs text-[#526071]">Correct Answer:</Text>
                                                        <Text className="flex-1 font-geist text-xs text-emerald-600">
                                                            {correctOption ? `${correctOption.id.toUpperCase()}. ${correctOption.text}` : ''}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* AI Explanation Box */}
                                            {item.explanation ? (
                                                <View className="rounded-xl bg-white p-3 border border-[#E4E8EE]">
                                                    <View className="mb-1 flex-row items-center gap-1.5">
                                                        <IconSparkles size={14} color="#001428" />
                                                        <Text className="font-geist-semibold text-xs text-[#001428]">Explanation</Text>
                                                    </View>
                                                    <Text className="font-geist text-xs leading-5 text-[#526071]">
                                                        {item.explanation}
                                                    </Text>
                                                </View>
                                            ) : null}

                                            {/* Module Citations if present */}
                                            {item.sources && item.sources.length > 0 && (
                                                <View className="gap-1.5">
                                                    <Text className="font-geist-semibold text-[11px] uppercase tracking-wider text-[#526071]">
                                                        Module Reference
                                                    </Text>
                                                    {item.sources.map((src, sIdx) => (
                                                        <View key={sIdx} className="rounded-xl border border-[#E4E8EE] bg-white p-2.5">
                                                            {src.reference?.page && (
                                                                <Text className="mb-1 font-geist-semibold text-[11px] text-[#001428]">
                                                                    Page {src.reference.page}
                                                                </Text>
                                                            )}
                                                            <Text className="font-geist italic text-xs leading-4 text-[#526071]">
                                                                {`"${src.excerpt}"`}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </Animated.View>
                                    )}
                                </Animated.View>
                            );
                        })
                    )}
                </View>

                {/* Bottom Actions */}
                <View className="gap-3 pt-4">
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Back to Dashboard"
                        onPress={() => router.replace('/(main)/(tabs)/dashboard')}
                        className="items-center justify-center rounded-2xl bg-[#001428] py-4 active:opacity-90"
                    >
                        <Text className="font-geist-semibold text-base text-white">Back to Dashboard</Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Practice Another Quiz"
                        onPress={() => router.replace('/(main)/quizzes/create')}
                        className="items-center justify-center rounded-2xl bg-[#F1F4F8] py-3.5 active:opacity-80"
                    >
                        <Text className="font-geist-medium text-sm text-[#001428]">Practice Another Quiz</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
