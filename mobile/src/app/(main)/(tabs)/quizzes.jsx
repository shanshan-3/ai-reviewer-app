import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import IconPlus from '@tabler/icons-react-native/IconPlus';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconArrowRight from '@tabler/icons-react-native/IconArrowRight';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import IconBulb from '@tabler/icons-react-native/IconBulb';
import { deleteQuiz, listUserQuizzes } from '@/lib/quizzes';
import { getTopicRecommendations } from '@/lib/progress';
import { useToast } from '@/providers/toast-provider';
import CardSkeletonList, { RecommendedFocusSkeleton } from '@/components/card-skeleton';
import { useAnimatedCount } from '@/hooks/use-animated-count';
import { THEME } from '@/lib/theme';

export default function QuizzesPage() {
    const router = useRouter();
    const showToast = useToast();
    const [quizzes, setQuizzes] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);
    const hasLoaded = useRef(false);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else if (!hasLoaded.current) {
            setLoading(true);
        }
        setError(null);
        try {
            const data = await listUserQuizzes();
            setQuizzes(data.quizzes ?? []);
            hasLoaded.current = true;
        } catch (err) {
            setError(err.message || 'Could not load quizzes.');
        }

        try {
            const recData = await getTopicRecommendations();
            setRecommendations(recData.recommendations ?? []);
        } catch {
            // Non-blocking recommendations fetch
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    function confirmDelete(item) {
        if (deletingId) return;
        Alert.alert(
            'Delete Quiz?',
            'This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleDeleteQuiz(item.id),
                },
            ]
        );
    }

    async function handleDeleteQuiz(targetId) {
        if (!targetId || deletingId) return;
        setDeletingId(targetId);
        try {
            await deleteQuiz(targetId);
            setQuizzes(prev => prev.filter(q => q.id !== targetId));
            showToast('Quiz deleted');
        } catch (err) {
            showToast(err.message || 'Could not delete quiz');
        } finally {
            setDeletingId(null);
        }
    }

    const activeItem = quizzes.find(q => q.session?.status === 'active');
    const completedItems = quizzes.filter(q => q.session?.status === 'completed');

    const avgScore = completedItems.length > 0
        ? Math.round(
            completedItems.reduce((acc, item) => acc + (item.session.correctCount / item.questionCount) * 100, 0) /
            completedItems.length
        )
        : null;

    const totalQuizzesCount = useAnimatedCount(quizzes.length);
    const completedQuizzesCount = useAnimatedCount(completedItems.length);

    function formatModality(type) {
        if (type === 'true_false') return 'True or False';
        if (type === 'coding_syntax') return 'Coding Syntax';
        return 'Multiple Choice';
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[THEME.primary]} />}
            >
                {/* Header CTA */}
                <View className="flex-row items-center justify-between">
                    <View className="min-w-0 flex-1 pr-3">
                        <Text accessibilityRole="header" numberOfLines={1} className="font-geist-bold text-lg tracking-tight text-[#001428]">
                            Practice Tests
                        </Text>
                        <Text className="mt-0.5 font-geist text-xs text-[#526071]">
                            Tests generated from your modules and topics
                        </Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Create New Quiz"
                        accessibilityHint="Opens quiz creator to generate a new practice test"
                        onPress={() => router.push('/(main)/quizzes/create')}
                        className="flex-row items-center gap-1.5 rounded-full bg-[#001428] px-4 py-2.5 shadow-sm active:scale-[0.98] active:opacity-90"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <IconPlus size={18} color="white" />
                        <Text className="font-geist-semibold text-sm text-white">New Quiz</Text>
                    </Pressable>
                </View>

                {/* KPI Summary Strip */}
                <View
                    className="flex-row items-center divide-x divide-[#E4E8EE] rounded-2xl border border-[#E4E8EE] bg-white py-3 shadow-sm"
                    style={{ borderCurve: 'continuous' }}
                >
                    <View className="flex-1 items-center px-1">
                        <Text numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }} className="font-geist-bold text-xl text-[#001428]">
                            {totalQuizzesCount}
                        </Text>
                        <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                            Total
                        </Text>
                    </View>
                    <View className="flex-1 items-center px-1">
                        <Text
                            numberOfLines={1}
                            style={{ fontVariant: ['tabular-nums'] }}
                            className={`font-geist-bold text-xl ${
                                avgScore !== null && avgScore >= 60 ? 'text-emerald-700' : 'text-[#001428]'
                            }`}
                        >
                            {avgScore !== null ? `${avgScore}%` : '--'}
                        </Text>
                        <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                            Avg Score
                        </Text>
                    </View>
                    <View className="flex-1 items-center px-1">
                        <Text numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }} className="font-geist-bold text-xl text-[#001428]">
                            {completedQuizzesCount}
                        </Text>
                        <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                            Completed
                        </Text>
                    </View>
                </View>

                {/* Error Banner */}
                {error && (
                    <View key="error-banner" className="rounded-2xl border border-[#DC2626] bg-white p-4">
                        <Text className="font-geist text-sm text-[#DC2626]">{error}</Text>
                    </View>
                )}

                <View key="content-state" className="gap-5">
                    {/* Active / In-Progress Quiz Card (Compact Apple-style Capsule) */}
                        {/* Active / In-Progress Quiz Card (Compact Apple-style Capsule) */}
                        {activeItem && (() => {
                            const activeProgress = Math.round((activeItem.session.answeredCount / activeItem.questionCount) * 100);
                            const isDeleting = deletingId === activeItem.id;
                            return (
                                <View className="gap-2">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                            In Progress
                                        </Text>
                                    </View>
                                    <View
                                        className={`overflow-hidden rounded-2xl border border-[#001428]/15 bg-white shadow-xs ${
                                            isDeleting ? 'opacity-50' : ''
                                        }`}
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        <View className="flex-row items-center justify-between p-3.5">
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Resume active quiz for ${activeItem.sourceTitle || 'IT Topic Practice'}, ${activeProgress}% complete`}
                                                accessibilityHint="Navigates to the active quiz session"
                                                disabled={Boolean(deletingId)}
                                                onPress={() => router.push(`/(main)/quizzes/${activeItem.session.id}`)}
                                                className="min-w-0 flex-1 pr-3 active:opacity-70"
                                            >
                                                <Text className="font-geist-semibold text-[11px] uppercase tracking-wider text-emerald-700">
                                                    In Progress ({activeProgress}%)
                                                </Text>
                                                <Text numberOfLines={1} className="mt-1 font-geist-bold text-sm text-[#001428]">

                                                    {activeItem.sourceTitle || 'IT Topic Practice'}
                                                </Text>
                                                <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
                                                    <Text numberOfLines={1} className="font-geist text-[11px] text-[#526071]">
                                                        {formatModality(activeItem.questionType)} • {activeItem.session.answeredCount} of {activeItem.questionCount}
                                                    </Text>
                                                    <View className="rounded-full bg-[#F1F4F8] px-2 py-0.5">
                                                        <Text className="font-geist-medium text-[10px] capitalize text-[#526071]">
                                                            {activeItem.startingDifficulty}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </Pressable>

                                            <View className="flex-row items-center gap-2">
                                                <Pressable
                                                    accessibilityRole="button"
                                                    accessibilityLabel="Discard active quiz"
                                                    accessibilityHint="Permanently discards this quiz in progress."
                                                    accessibilityState={{ busy: isDeleting }}
                                                    disabled={Boolean(deletingId)}
                                                    hitSlop={10}
                                                    onPress={() => confirmDelete(activeItem)}
                                                    className="h-8 w-8 items-center justify-center rounded-xl active:bg-[#FEF2F2]"
                                                    style={({ pressed }) => [
                                                        {
                                                            borderCurve: 'continuous',
                                                            transform: [{ scale: pressed && !Boolean(deletingId) ? 0.92 : 1 }],
                                                        },
                                                    ]}
                                                >
                                                    {isDeleting ? (
                                                        <ActivityIndicator size="small" color="#DC2626" />
                                                    ) : (
                                                        <IconTrash size={16} color="#DC2626" strokeWidth={1.8} />
                                                    )}
                                                </Pressable>

                                                <Pressable
                                                    accessibilityRole="button"
                                                    accessibilityLabel="Resume quiz"
                                                    accessibilityHint="Navigates to the active quiz session"
                                                    disabled={Boolean(deletingId)}
                                                    onPress={() => router.push(`/(main)/quizzes/${activeItem.session.id}`)}
                                                    className="flex-row items-center gap-1.5 rounded-full bg-[#001428] px-3 py-2 shadow-xs active:scale-95 active:opacity-90"
                                                    style={{ borderCurve: 'continuous' }}
                                                >
                                                    <Text className="font-geist-semibold text-xs text-white">Resume</Text>
                                                    <IconArrowRight size={13} color="white" />
                                                </Pressable>
                                            </View>
                                        </View>

                                        {/* Hairline Progress Bar */}
                                        <View className="h-1 w-full bg-[#E2E8F0]">
                                            <View
                                                className="h-full bg-[#001428]"
                                                style={{ width: `${activeProgress}%` }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            );
                        })()}

                        {/* Weak-Topic Recommendation Capsule (Compact Inline Action) */}
                        {loading && !refreshing ? (
                            <RecommendedFocusSkeleton />
                        ) : recommendations.length > 0 ? (() => {
                            const topRec = recommendations[0];
                            return (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Practice recommended topic ${topRec.topicName}, ${topRec.accuracy}% accuracy`}
                                    accessibilityHint="Opens quiz creator with this topic pre-selected"
                                    onPress={() => router.push({
                                        pathname: '/(main)/quizzes/create',
                                        params: { sourceKind: 'topic', topicId: topRec.topicId },
                                    })}
                                    style={({ pressed }) => [
                                        {
                                            borderCurve: 'continuous',
                                            transform: [{ scale: pressed ? 0.985 : 1 }],
                                        },
                                    ]}
                                    className="overflow-hidden rounded-2xl border border-[#001428]/15 bg-white p-3.5 shadow-xs active:opacity-95"
                                >
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-3 flex-1 pr-3">
                                            <View
                                                className="h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80"
                                                style={{ borderCurve: 'continuous' }}
                                            >
                                                <IconBulb size={20} color="#D97706" strokeWidth={2} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="font-geist-semibold text-[11px] uppercase tracking-wider text-amber-800">
                                                    Recommended Focus
                                                </Text>
                                                <Text numberOfLines={1} className="mt-0.5 font-geist-bold text-sm text-[#001428]">
                                                    {topRec.topicName}
                                                </Text>
                                                <Text numberOfLines={1} className="mt-0.5 font-geist text-[11px] text-[#526071]">
                                                    {topRec.accuracy}% accuracy • {topRec.sampleCount} questions
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center gap-1.5 rounded-full bg-[#001428] px-3.5 py-2 shadow-xs">
                                            <Text className="font-geist-semibold text-xs text-white">Practice</Text>
                                            <IconArrowRight size={13} color="white" />
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })() : null}

                        {/* Recent Completed Quizzes */}
                        <View className="gap-3">
                            <View className="flex-row items-center justify-between">
                                <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                    Recent Quizzes
                                </Text>
                                {completedItems.length > 0 && (
                                    <Text className="font-geist text-xs text-[#526071]">
                                        {completedItems.length} {completedItems.length === 1 ? 'quiz' : 'quizzes'}
                                    </Text>
                                )}
                            </View>

                            {loading && !refreshing ? (
                                <CardSkeletonList count={3} type="quiz" />
                            ) : completedItems.length === 0 && !activeItem ? (
                                <View
                                    className="items-center justify-center rounded-3xl border border-[#E4E8EE] bg-white p-8 text-center shadow-sm"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F4F8]">
                                        <IconSparkles size={32} color="#001428" />
                                    </View>
                                    <Text className="font-geist-bold text-xl text-[#001428]">
                                        No quizzes yet
                                    </Text>
                                    <Text className="mt-2 max-w-xs text-center font-geist text-xs leading-5 text-[#526071]">
                                        Generate practice quizzes from your modules or curriculum topics.
                                    </Text>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Create Quiz"
                                        onPress={() => router.push('/(main)/quizzes/create')}
                                        className="mt-5 flex-row items-center gap-2 rounded-2xl bg-[#001428] px-5 py-3 shadow-sm active:scale-[0.98] active:opacity-90"
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        <IconPlus size={18} color="white" />
                                        <Text className="font-geist-semibold text-xs text-white">Create Quiz</Text>
                                    </Pressable>
                                </View>
                            ) : completedItems.length === 0 ? (
                                <View
                                    className="items-center justify-center rounded-2xl border border-[#E4E8EE] bg-white p-5 text-center shadow-2xs"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <View
                                        className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-[#F1F4F8]"
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        <IconSparkles size={18} color="#001428" />
                                    </View>
                                    <Text className="font-geist-bold text-sm text-[#001428]">
                                        No Completed Quizzes Yet
                                    </Text>
                                    <Text className="mt-1 text-center font-geist text-xs text-[#526071] max-w-xs leading-5">
                                        Finish your in-progress quiz above to see your score, accuracy rate, and question review here.
                                    </Text>
                                </View>
                            ) : (
                                completedItems.map(item => {
                                    const percent = Math.round((item.session.correctCount / item.questionCount) * 100);
                                    const isDeleting = deletingId === item.id;
                                    const isHigh = percent >= 60;
                                    const isMid = percent >= 50;
                                    const percentColor = isHigh ? 'text-emerald-700' : isMid ? 'text-amber-700' : 'text-[#526071]';

                                    return (
                                        <View
                                            key={item.id}
                                            className={`flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white p-3.5 shadow-2xs ${
                                                isDeleting ? 'opacity-50' : ''
                                            }`}
                                            style={{ borderCurve: 'continuous' }}
                                        >
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`View results for ${item.sourceTitle || 'IT Topic Practice'}, score ${item.session.correctCount} of ${item.questionCount}, ${percent}%`}
                                                accessibilityHint="Opens detailed score and question review."
                                                disabled={Boolean(deletingId)}
                                                onPress={() => router.push(`/(main)/quizzes/${item.session.id}/results`)}
                                                style={({ pressed }) => [
                                                    {
                                                        transform: [{ scale: pressed && !Boolean(deletingId) ? 0.985 : 1 }],
                                                    },
                                                ]}
                                                className="min-w-0 flex-1 flex-row items-center justify-between pr-2 active:opacity-75"
                                            >
                                                <View className="min-w-0 flex-1 pr-3">
                                                    <Text numberOfLines={1} className="font-geist-semibold text-base text-[#001428]">
                                                        {item.sourceTitle || 'IT Topic Practice'}
                                                    </Text>
                                                    <View className="mt-1 flex-row flex-wrap items-center gap-2">
                                                        <Text className="font-geist text-xs text-[#526071]">
                                                            {formatModality(item.questionType)} • {item.questionCount} Questions
                                                        </Text>
                                                        <View className="rounded-full bg-[#F1F4F8] px-2 py-0.5">
                                                            <Text className="font-geist-medium text-[10px] capitalize text-[#526071]">
                                                                {item.startingDifficulty}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>

                                                <View className="flex-row items-center gap-1.5">
                                                    <View className="items-end">
                                                        <Text
                                                            style={{ fontVariant: ['tabular-nums'] }}
                                                            className={`font-geist-bold text-base leading-tight ${percentColor}`}
                                                        >
                                                            {percent}%
                                                        </Text>
                                                        <Text
                                                            style={{ fontVariant: ['tabular-nums'] }}
                                                            className="mt-0.5 font-geist text-[11px] text-[#526071]"
                                                        >
                                                            {item.session.correctCount}/{item.questionCount}
                                                        </Text>
                                                    </View>
                                                    <IconChevronRight size={18} color="#94A3B8" />
                                                </View>
                                            </Pressable>

                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Delete quiz: ${item.sourceTitle || 'IT Topic Practice'}`}
                                                accessibilityHint="Opens confirmation dialog to delete this quiz record."
                                                accessibilityState={{ busy: isDeleting }}
                                                disabled={Boolean(deletingId)}
                                                hitSlop={10}
                                                onPress={() => confirmDelete(item)}
                                                className="h-9 w-9 items-center justify-center rounded-xl active:bg-[#FEF2F2]"
                                                style={({ pressed }) => [
                                                    {
                                                        borderCurve: 'continuous',
                                                        transform: [{ scale: pressed && !Boolean(deletingId) ? 0.92 : 1 }],
                                                    },
                                                ]}
                                            >
                                                {isDeleting ? (
                                                    <ActivityIndicator size="small" color="#DC2626" />
                                                ) : (
                                                    <IconTrash size={16} color="#DC2626" strokeWidth={1.8} />
                                                )}
                                            </Pressable>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>
            </ScrollView>
        </SafeAreaView>
    );
}
