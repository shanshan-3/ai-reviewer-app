import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import IconPlus from '@tabler/icons-react-native/IconPlus';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconArrowRight from '@tabler/icons-react-native/IconArrowRight';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import { deleteQuiz, listUserQuizzes } from '@/lib/quizzes';
import { getTopicRecommendations } from '@/lib/progress';
import { useToast } from '@/providers/toast-provider';
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

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const data = await listUserQuizzes();
            setQuizzes(data.quizzes ?? []);
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
        const title = item.sourceTitle || (item.session?.status === 'active' ? 'Quiz in progress' : 'General Practice');
        Alert.alert(
            'Delete Quiz?',
            `Permanently delete "${title}"? Its questions, answers, and score history will be removed. This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingId(item.id);
                        try {
                            await deleteQuiz(item.id);
                            setQuizzes(prev => prev.filter(q => q.id !== item.id));
                            showToast('Quiz deleted');
                        } catch (err) {
                            Alert.alert('Could not delete quiz', err.message || 'Please try again.');
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    }

    const activeItem = quizzes.find(q => q.session?.status === 'active');
    const completedItems = quizzes.filter(q => q.session?.status === 'completed');

    const avgScore = completedItems.length > 0
        ? Math.round(
            completedItems.reduce((acc, item) => acc + (item.session.correctCount / item.questionCount) * 100, 0) /
            completedItems.length
        )
        : null;

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
                        <Text accessibilityRole="header" numberOfLines={1} className="font-geist-bold text-2xl tracking-tight text-[#001428]">
                            Test Your Mastery
                        </Text>
                        <Text className="mt-0.5 font-geist text-xs text-[#526071]">
                            Generate targeted AI quizzes from your modules and topics
                        </Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Create New Quiz"
                        accessibilityHint="Opens quiz creator to generate a new practice test"
                        onPress={() => router.push('/(main)/quizzes/create')}
                        className="flex-row items-center gap-1.5 rounded-full bg-[#001428] px-4 py-2.5 shadow-sm active:scale-95 active:opacity-90"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <IconPlus size={18} color="white" />
                        <Text className="font-geist-semibold text-sm text-white">New Quiz</Text>
                    </Pressable>
                </View>

                {/* KPI Summary Strip */}
                {(completedItems.length > 0 || activeItem) && (
                    <View
                        className="flex-row items-center divide-x divide-[#E4E8EE] rounded-2xl border border-[#E4E8EE] bg-white py-3 shadow-sm"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-1 items-center px-1">
                            <Text numberOfLines={1} className="font-geist-bold text-xl text-[#001428]">
                                {quizzes.length}
                            </Text>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                Total
                            </Text>
                        </View>
                        <View className="flex-1 items-center px-1">
                            <Text
                                numberOfLines={1}
                                className={`font-geist-bold text-xl ${
                                    avgScore !== null && avgScore >= 75 ? 'text-emerald-700' : 'text-[#001428]'
                                }`}
                            >
                                {avgScore !== null ? `${avgScore}%` : '--'}
                            </Text>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                Avg Score
                            </Text>
                        </View>
                        <View className="flex-1 items-center px-1">
                            <View className="flex-row items-center gap-1">
                                <Text numberOfLines={1} className="font-geist-bold text-xl text-[#001428]">
                                    {completedItems.length}
                                </Text>
                                {activeItem && (
                                    <View className="h-2 w-2 rounded-full bg-emerald-500" />
                                )}
                            </View>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                Completed
                            </Text>
                        </View>
                    </View>
                )}

                {/* Error Banner */}
                {error && (
                    <View key="error-banner" className="rounded-2xl border border-[#DC2626] bg-white p-4">
                        <Text className="font-geist text-sm text-[#DC2626]">{error}</Text>
                    </View>
                )}

                {/* Loading State */}
                {loading && !refreshing ? (
                    <View key="loading-state" className="flex-1 items-center justify-center py-12">
                        <ActivityIndicator size="large" color="#001428" />
                    </View>
                ) : (
                    <View key="content-state" className="gap-5">
                        {/* Active / In-Progress Quiz Card (Compact Apple-style Capsule) */}
                        {activeItem && (() => {
                            const activeProgress = Math.round((activeItem.session.answeredCount / activeItem.questionCount) * 100);
                            const isDeleting = deletingId === activeItem.id;
                            return (
                                <View className="gap-2">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                            Continue Practice
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
                                                accessibilityLabel={`Resume active quiz for ${activeItem.sourceTitle || 'Quiz in progress'}, ${activeProgress}% complete`}
                                                accessibilityHint="Navigates to the active quiz session"
                                                disabled={Boolean(deletingId)}
                                                onPress={() => router.push(`/(main)/quizzes/${activeItem.session.id}`)}
                                                className="min-w-0 flex-1 pr-3 active:opacity-70"
                                            >
                                                <View className="flex-row items-center gap-1.5">
                                                    <View className="h-2 w-2 rounded-full bg-emerald-500" />
                                                    <Text className="font-geist-semibold text-[11px] uppercase tracking-wider text-emerald-700">
                                                        In Progress • {activeProgress}%
                                                    </Text>
                                                </View>
                                                <Text numberOfLines={1} className="mt-1 font-geist-bold text-sm text-[#001428]">
                                                    {activeItem.sourceTitle || 'Quiz in progress'}
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
                                                    style={{ borderCurve: 'continuous' }}
                                                >
                                                    {isDeleting ? (
                                                        <ActivityIndicator size="small" color="#DC2626" />
                                                    ) : (
                                                        <IconTrash size={16} color="#94A3B8" />
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

                        {/* Weak-Topic Recommendation Card (Restored Layout with Refined Color Palette) */}
                        {recommendations.length > 0 && (() => {
                            const topRec = recommendations[0];
                            return (
                                <View
                                    className="overflow-hidden rounded-3xl border border-[#001428]/15 bg-white p-5 shadow-sm gap-3"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <View className="flex-row items-center justify-between">
                                        <Text className="font-geist-bold text-sm text-[#001428]">
                                            {topRec.accuracy}% Accuracy <Text className="font-geist text-xs text-[#526071] font-normal">• {topRec.sampleCount} questions</Text>
                                        </Text>
                                        <View className="flex-row items-center gap-1.5">
                                            <View className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            <Text className="font-geist-semibold text-xs text-[#526071]">
                                                Needs Practice
                                            </Text>
                                        </View>
                                    </View>

                                    <View>
                                        <Text numberOfLines={1} className="font-geist-bold text-base text-[#001428]">
                                            {topRec.topicName}
                                        </Text>
                                        <Text numberOfLines={2} className="mt-1 font-geist text-xs leading-5 text-[#526071]">
                                            {topRec.reason}
                                        </Text>
                                    </View>

                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={`Practice recommended topic ${topRec.topicName}`}
                                        onPress={() => router.push({
                                            pathname: '/(main)/quizzes/create',
                                            params: { sourceKind: 'topic', topicId: topRec.topicId },
                                        })}
                                        className="flex-row items-center justify-center gap-2 rounded-2xl bg-[#001428] py-3.5 shadow-sm active:scale-[0.98] active:opacity-90"
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        <Text className="font-geist-semibold text-xs text-white">Practice This Topic</Text>
                                        <IconArrowRight size={16} color="white" />
                                    </Pressable>
                                </View>
                            );
                        })()}

                        {/* Recent Completed Quizzes */}
                        <View className="gap-3">
                            <View className="flex-row items-center justify-between">
                                <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                    Recent Practice
                                </Text>
                                {completedItems.length > 0 && (
                                    <Text className="font-geist text-xs text-[#526071]">
                                        {completedItems.length} {completedItems.length === 1 ? 'quiz' : 'quizzes'}
                                    </Text>
                                )}
                            </View>

                            {completedItems.length === 0 && !activeItem ? (
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
                                        Test your knowledge with AI-generated quizzes tailored to your BSIT modules or curriculum topics.
                                    </Text>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Create First Quiz"
                                        onPress={() => router.push('/(main)/quizzes/create')}
                                        className="mt-5 flex-row items-center gap-2 rounded-2xl bg-[#001428] px-5 py-3 shadow-sm active:scale-95 active:opacity-90"
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        <IconPlus size={18} color="white" />
                                        <Text className="font-geist-semibold text-xs text-white">Create First Quiz</Text>
                                    </Pressable>
                                </View>
                            ) : completedItems.length === 0 ? (
                                <Text className="font-geist text-sm text-[#526071]">No completed quizzes yet.</Text>
                            ) : (
                                completedItems.map(item => {
                                    const percent = Math.round((item.session.correctCount / item.questionCount) * 100);
                                    const isDeleting = deletingId === item.id;
                                    const isHigh = percent >= 80;
                                    const isMid = percent >= 50;
                                    const badgeBg = isHigh ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
                                        : isMid ? 'bg-amber-50 border-amber-200/80 text-amber-800'
                                        : 'bg-slate-100 border-slate-200 text-slate-700';

                                    return (
                                        <View
                                            key={item.id}
                                            className={`flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white p-4 shadow-sm ${
                                                isDeleting ? 'opacity-50' : ''
                                            }`}
                                            style={{ borderCurve: 'continuous' }}
                                        >
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`View results for ${item.sourceTitle || 'General Practice'}`}
                                                accessibilityHint="Opens detailed score and question review."
                                                disabled={Boolean(deletingId)}
                                                onPress={() => router.push(`/(main)/quizzes/${item.session.id}/results`)}
                                                className="min-w-0 flex-1 pr-3 active:opacity-70"
                                            >
                                                <Text numberOfLines={1} className="font-geist-semibold text-base text-[#001428]">
                                                    {item.sourceTitle || 'General Practice'}
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
                                            </Pressable>

                                            <View className="flex-row items-center gap-2.5">
                                                <Pressable
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`View score: ${item.session.correctCount} of ${item.questionCount}`}
                                                    disabled={Boolean(deletingId)}
                                                    onPress={() => router.push(`/(main)/quizzes/${item.session.id}/results`)}
                                                    className="flex-row items-center gap-2 active:opacity-70"
                                                >
                                                    <View className={`items-end rounded-xl border px-2.5 py-1 ${badgeBg}`}>
                                                        <Text className="font-geist-bold text-xs">
                                                            {item.session.correctCount}/{item.questionCount}
                                                        </Text>
                                                        <Text className="font-geist text-[10px]">
                                                            {percent}%
                                                        </Text>
                                                    </View>
                                                    <IconChevronRight size={18} color="#94A3B8" />
                                                </Pressable>

                                                <Pressable
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Delete quiz: ${item.sourceTitle || 'General Practice'}`}
                                                    accessibilityHint="Opens confirmation dialog to delete this quiz record."
                                                    accessibilityState={{ busy: isDeleting }}
                                                    disabled={Boolean(deletingId)}
                                                    hitSlop={10}
                                                    onPress={() => confirmDelete(item)}
                                                    className="h-9 w-9 items-center justify-center rounded-xl active:bg-[#FEF2F2]"
                                                    style={{ borderCurve: 'continuous' }}
                                                >
                                                    {isDeleting ? (
                                                        <ActivityIndicator size="small" color="#DC2626" />
                                                    ) : (
                                                        <IconTrash size={16} color="#94A3B8" />
                                                    )}
                                                </Pressable>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
