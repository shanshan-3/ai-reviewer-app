import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import IconPlus from '@tabler/icons-react-native/IconPlus';
import IconHelp from '@tabler/icons-react-native/IconHelp';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconPlayerPlay from '@tabler/icons-react-native/IconPlayerPlay';
import { listUserQuizzes } from '@/lib/quizzes';
import { THEME } from '@/lib/theme';

export default function QuizzesPage() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    const activeItem = quizzes.find(q => q.session?.status === 'active');
    const completedItems = quizzes.filter(q => q.session?.status === 'completed');

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
                    <View>
                        <Text className="font-geist-bold text-2xl text-[#001428]">Quizzes</Text>
                        <Text className="font-geist text-xs text-[#526071]">Practice and test your knowledge</Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Create New Quiz"
                        onPress={() => router.push('/(main)/quizzes/create')}
                        className="flex-row items-center gap-1.5 rounded-full bg-[#001428] px-4 py-2.5 active:opacity-90"
                    >
                        <IconPlus size={18} color="white" />
                        <Text className="font-geist-semibold text-sm text-white">New Quiz</Text>
                    </Pressable>
                </View>

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
                        {/* Active / In-Progress Quiz Card */}
                        {activeItem && (
                            <View className="overflow-hidden rounded-3xl border border-[#001428] bg-[#F1F4F8] p-5">
                                <View className="mb-2 flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-2">
                                        <View className="h-2.5 w-2.5 rounded-full bg-[#001428]" />
                                        <Text className="font-geist-medium text-xs uppercase tracking-wider text-[#001428]">
                                            In Progress
                                        </Text>
                                    </View>
                                    <Text className="font-geist text-xs text-[#526071]">
                                        {activeItem.session.answeredCount} of {activeItem.questionCount} answered
                                    </Text>
                                </View>

                                <Text numberOfLines={1} className="mb-1 font-geist-semibold text-lg text-[#001428]">
                                    {activeItem.sourceTitle || 'Quiz in progress'}
                                </Text>
                                <Text className="mb-4 font-geist text-xs text-[#526071]">
                                    {formatModality(activeItem.questionType)} • {activeItem.startingDifficulty}
                                </Text>

                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Resume Active Quiz"
                                    onPress={() => router.push(`/(main)/quizzes/${activeItem.session.id}`)}
                                    className="flex-row items-center justify-center gap-2 rounded-2xl bg-[#001428] py-3 active:opacity-90"
                                >
                                    <IconPlayerPlay size={18} color="white" />
                                    <Text className="font-geist-semibold text-sm text-white">Resume Quiz</Text>
                                </Pressable>
                            </View>
                        )}

                        {/* Recent Completed Quizzes */}
                        <View className="gap-3">
                            <Text className="font-geist-medium text-xs uppercase tracking-wider text-[#526071]">
                                Recent Practice
                            </Text>

                            {completedItems.length === 0 && !activeItem ? (
                                <View className="items-center justify-center rounded-3xl border border-dashed border-[#E4E8EE] bg-white py-12 px-6">
                                    <IconHelp size={40} color="#526071" />
                                    <Text className="mt-3 font-geist-semibold text-base text-[#001428]">
                                        No quizzes yet
                                    </Text>
                                    <Text className="mt-1 text-center font-geist text-xs leading-5 text-[#526071]">
                                        Generate your first quiz from a school module or IT topic to start testing your knowledge.
                                    </Text>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Create Quiz"
                                        onPress={() => router.push('/(main)/quizzes/create')}
                                        className="mt-4 rounded-xl bg-[#F1F4F8] px-4 py-2 active:opacity-80"
                                    >
                                        <Text className="font-geist-medium text-xs text-[#001428]">Get Started</Text>
                                    </Pressable>
                                </View>
                            ) : completedItems.length === 0 ? (
                                <Text className="font-geist text-sm text-[#526071]">No completed quizzes yet.</Text>
                            ) : (
                                completedItems.map(item => {
                                    const percent = Math.round((item.session.correctCount / item.questionCount) * 100);
                                    return (
                                        <Pressable
                                            key={item.id}
                                            accessibilityRole="button"
                                            accessibilityLabel={`View results for ${item.sourceTitle || 'Quiz'}`}
                                            onPress={() => router.push(`/(main)/quizzes/${item.session.id}/results`)}
                                            className="flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white p-4 active:bg-[#F1F4F8]"
                                            style={{ borderCurve: 'continuous' }}
                                        >
                                            <View className="flex-1 pr-3">
                                                <Text numberOfLines={1} className="font-geist-medium text-sm text-[#001428]">
                                                    {item.sourceTitle || 'General Practice'}
                                                </Text>
                                                <Text className="font-geist text-xs text-[#526071]">
                                                    {formatModality(item.questionType)} • {item.questionCount} Questions
                                                </Text>
                                            </View>

                                            <View className="flex-row items-center gap-3">
                                                <View className="items-end">
                                                    <Text className="font-geist-bold text-sm text-[#001428]">
                                                        {item.session.correctCount}/{item.questionCount}
                                                    </Text>
                                                    <Text className="font-geist text-[11px] text-[#526071]">
                                                        {percent}%
                                                    </Text>
                                                </View>
                                                <IconChevronRight size={18} color="#526071" />
                                            </View>
                                        </Pressable>
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
