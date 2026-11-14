import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';
import IconRotate from '@tabler/icons-react-native/IconRotate';
import IconFlame from '@tabler/icons-react-native/IconFlame';
import IconCircleCheck from '@tabler/icons-react-native/IconCircleCheck';
import IconAlertTriangle from '@tabler/icons-react-native/IconAlertTriangle';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';
import IconAward from '@tabler/icons-react-native/IconAward';
import IconTarget from '@tabler/icons-react-native/IconTarget';
import IconBooks from '@tabler/icons-react-native/IconBooks';
import IconCards from '@tabler/icons-react-native/IconCards';
import IconArrowRight from '@tabler/icons-react-native/IconArrowRight';
import { getUserReport } from '@/lib/progress';

export default function PerformanceReportPage() {
    const router = useRouter();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadReport = useCallback((isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        setError(null);
        getUserReport()
            .then(data => {
                setReport(data.report);
            })
            .catch(err => {
                setError(err.message || 'Could not load your performance report.');
            })
            .finally(() => {
                setLoading(false);
                setRefreshing(false);
            });
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadReport(false);
        }, [loadReport])
    );

    const summary = report?.summary ?? {};
    const estimates = report?.estimates ?? [];
    const strengths = report?.strengths ?? [];
    const weaknesses = report?.weaknesses ?? [];
    const isEmpty = report?.isEmpty ?? false;
    const hasSparseData = report?.hasSparseData ?? false;

    return (
        <SafeAreaView className="flex-1 bg-[#F8F8FF]" edges={['top', 'left', 'right']}>
            {/* Navigation Header */}
            <View className="flex-row items-center justify-between border-b border-[#E4E8EE] bg-white px-4 py-3">
                <Pressable
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={() => router.back()}
                    className="h-10 w-10 items-center justify-center rounded-xl bg-[#F1F4F8] active:opacity-75"
                    style={{ borderCurve: 'continuous' }}
                >
                    <IconArrowLeft size={20} color="#001428" />
                </Pressable>

                <View className="items-center">
                    <Text className="font-geist-bold text-base text-[#001428]">
                        Performance Report
                    </Text>
                </View>

                <Pressable
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Refresh report"
                    onPress={() => loadReport(true)}
                    disabled={refreshing || loading}
                    className="h-10 w-10 items-center justify-center rounded-xl bg-[#F1F4F8] active:opacity-75"
                    style={{ borderCurve: 'continuous' }}
                >
                    <IconRotate size={18} color="#001428" />
                </Pressable>
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 items-center justify-center p-6">
                    <ActivityIndicator size="large" color="#001428" />
                    <Text className="mt-3 font-geist text-sm text-[#526071]">
                        Compiling practice metrics...
                    </Text>
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center p-6">
                    <View
                        className="w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 p-5 text-center shadow-2xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="items-center">
                            <IconAlertTriangle size={32} color="#DC2626" />
                            <Text className="mt-2 font-geist-bold text-base text-red-900">
                                Could Not Load Report
                            </Text>
                            <Text className="mt-1 text-center font-geist text-xs text-red-700">
                                {error}
                            </Text>
                            <Pressable
                                onPress={() => loadReport(false)}
                                className="mt-4 rounded-xl bg-red-600 px-4 py-2"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <Text className="font-geist-semibold text-xs text-white">
                                    Retry
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadReport(true)}
                            tintColor="#001428"
                        />
                    }
                >
                    {/* Overall Score & Activity Card */}
                    <View
                        className="overflow-hidden rounded-2xl border border-[#E4E8EE] bg-white p-5 shadow-2xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                    Overall Practice Accuracy
                                </Text>
                                <View className="mt-1 flex-row items-baseline gap-2">
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-4xl text-[#001428]"
                                    >
                                        {summary.overallAccuracy ?? 0}%
                                    </Text>
                                    <Text className="font-geist text-xs text-[#526071]">
                                        across {summary.totalQuestionsAnswered ?? 0} answers
                                    </Text>
                                </View>
                            </View>

                            <View
                                className="h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <IconFlame
                                    size={28}
                                    color="#D97706"
                                    fill={summary.currentStreak > 0 ? '#FDE68A' : 'none'}
                                />
                            </View>
                        </View>

                        {/* 4-Column Activity Grid */}
                        <View
                            className="mt-5 grid grid-cols-2 flex-row flex-wrap divide-x divide-y divide-[#E4E8EE] rounded-xl border border-[#E4E8EE] bg-[#F8F8FF]"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <View className="w-1/2 p-3">
                                <View className="flex-row items-center gap-1.5">
                                    <IconBooks size={14} color="#64748B" />
                                    <Text className="font-geist text-[11px] text-[#526071]">Quizzes Done</Text>
                                </View>
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="mt-1 font-geist-bold text-lg text-[#001428]"
                                >
                                    {summary.totalQuizzesCompleted ?? 0}
                                </Text>
                            </View>

                            <View className="w-1/2 p-3">
                                <View className="flex-row items-center gap-1.5">
                                    <IconCards size={14} color="#64748B" />
                                    <Text className="font-geist text-[11px] text-[#526071]">Deck Reviews</Text>
                                </View>
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="mt-1 font-geist-bold text-lg text-[#001428]"
                                >
                                    {summary.totalFlashcardReviews ?? 0}
                                </Text>
                            </View>

                            <View className="w-1/2 p-3">
                                <View className="flex-row items-center gap-1.5">
                                    <IconFlame size={14} color="#D97706" />
                                    <Text className="font-geist text-[11px] text-[#526071]">Current Streak</Text>
                                </View>
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="mt-1 font-geist-bold text-lg text-[#001428]"
                                >
                                    {summary.currentStreak ?? 0} {summary.currentStreak === 1 ? 'day' : 'days'}
                                </Text>
                            </View>

                            <View className="w-1/2 p-3">
                                <View className="flex-row items-center gap-1.5">
                                    <IconAward size={14} color="#64748B" />
                                    <Text className="font-geist text-[11px] text-[#526071]">Best Streak</Text>
                                </View>
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="mt-1 font-geist-bold text-lg text-[#001428]"
                                >
                                    {summary.longestStreak ?? 0} {summary.longestStreak === 1 ? 'day' : 'days'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Empty State */}
                    {isEmpty ? (
                        <View
                            className="items-center rounded-2xl border border-dashed border-[#E4E8EE] bg-white p-6 text-center"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <IconTarget size={36} color="#94A3B8" />
                            <Text className="mt-3 font-geist-bold text-base text-[#001428]">
                                No Study Activity Yet
                            </Text>
                            <Text className="mt-1.5 text-center font-geist text-xs leading-5 text-[#526071]">
                                Complete a quiz or finish a flashcard deck to start generating your personal mastery diagnostics and strength assessments.
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Start a practice quiz"
                                onPress={() => router.push('/(main)/quizzes/create')}
                                className="mt-4 flex-row items-center gap-1.5 rounded-xl bg-[#001428] px-4 py-2.5 shadow-xs active:opacity-85"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <Text className="font-geist-medium text-xs text-white">
                                    Generate First Quiz
                                </Text>
                                <IconArrowRight size={14} color="#FFFFFF" />
                            </Pressable>
                        </View>
                    ) : (
                        <>
                            {/* Strengths & Focus Areas Section */}
                            <View className="gap-3">
                                <Text className="font-geist-bold text-sm text-[#001428]">
                                    Skill Diagnostic Highlights
                                </Text>

                                {hasSparseData && (
                                    <View
                                        className="flex-row items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5"
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        <IconInfoCircle size={16} color="#2563EB" style={{ marginTop: 1 }} />
                                        <Text className="flex-1 font-geist text-xs leading-4 text-blue-900">
                                            Practice history is currently building. Each topic requires at least 5 answered questions to produce an authoritative estimate.
                                        </Text>
                                    </View>
                                )}

                                {/* Strengths Card */}
                                <View
                                    className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <View className="flex-row items-center gap-2">
                                        <IconCircleCheck size={18} color="#059669" strokeWidth={2.5} />
                                        <Text className="font-geist-bold text-sm text-emerald-950">
                                            Demonstrated Strengths (≥80%)
                                        </Text>
                                    </View>

                                    {strengths.length > 0 ? (
                                        <View className="mt-3 gap-2">
                                            {strengths.map(topic => (
                                                <View
                                                    key={topic.topicId}
                                                    className="flex-row items-center justify-between rounded-xl border border-emerald-200 bg-white p-2.5"
                                                    style={{ borderCurve: 'continuous' }}
                                                >
                                                    <View className="flex-1 pr-2">
                                                        <Text className="font-geist-semibold text-xs text-[#001428]" numberOfLines={1}>
                                                            {topic.topicName}
                                                        </Text>
                                                        <Text className="font-geist text-[10px] text-[#526071]">
                                                            {topic.subjectName} • {topic.sampleCount} questions
                                                        </Text>
                                                    </View>
                                                    <View className="rounded-full bg-emerald-100 px-2 py-0.5">
                                                        <Text
                                                            style={{ fontVariant: ['tabular-nums'] }}
                                                            className="font-geist-bold text-xs text-emerald-900"
                                                        >
                                                            {topic.accuracy}%
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text className="mt-2 font-geist text-xs text-[#526071]">
                                            No topics have reached the 80% mastery threshold yet. Continue answering quizzes to unlock strength badges.
                                        </Text>
                                    )}
                                </View>

                                {/* Focus Areas / Weaknesses Card */}
                                <View
                                    className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <View className="flex-row items-center gap-2">
                                        <IconTarget size={18} color="#D97706" strokeWidth={2.5} />
                                        <Text className="font-geist-bold text-sm text-amber-950">
                                            Recommended Focus Areas (&lt;70%)
                                        </Text>
                                    </View>

                                    {weaknesses.length > 0 ? (
                                        <View className="mt-3 gap-2">
                                            {weaknesses.map(topic => (
                                                <View
                                                    key={topic.topicId}
                                                    className="flex-row items-center justify-between rounded-xl border border-amber-200 bg-white p-2.5"
                                                    style={{ borderCurve: 'continuous' }}
                                                >
                                                    <View className="flex-1 pr-2">
                                                        <Text className="font-geist-semibold text-xs text-[#001428]" numberOfLines={1}>
                                                            {topic.topicName}
                                                        </Text>
                                                        <Text className="font-geist text-[10px] text-[#526071]">
                                                            {topic.subjectName} • {topic.sampleCount} questions
                                                        </Text>
                                                    </View>
                                                    <View className="rounded-full bg-amber-100 px-2 py-0.5">
                                                        <Text
                                                            style={{ fontVariant: ['tabular-nums'] }}
                                                            className="font-geist-bold text-xs text-amber-900"
                                                        >
                                                            {topic.accuracy}%
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text className="mt-2 font-geist text-xs text-[#526071]">
                                            Great job! None of your evaluated topics are currently falling below the 70% threshold.
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Topic Practice Estimates Breakdown */}
                            <View className="gap-2.5">
                                <View>
                                    <Text className="font-geist-bold text-sm text-[#001428]">
                                        Topic Practice Estimates
                                    </Text>
                                    <Text className="font-geist text-xs text-[#526071]">
                                        Percentage correct across the latest 20 first-submission answers per topic.
                                    </Text>
                                </View>

                                <View className="gap-2">
                                    {estimates.map(item => {
                                        const isEligible = item.eligible;
                                        const accuracy = item.accuracy;
                                        const statusLabel = !isEligible
                                            ? 'Insufficient Data (<5)'
                                            : accuracy >= 80
                                            ? 'Mastered'
                                            : accuracy >= 60
                                            ? 'Proficient'
                                            : 'Needs Practice';

                                        const badgeStyle = !isEligible
                                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                                            : accuracy >= 80
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : accuracy >= 60
                                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                                            : 'bg-amber-50 text-amber-900 border-amber-200';

                                        const progressColor = !isEligible
                                            ? 'bg-slate-300'
                                            : accuracy >= 80
                                            ? 'bg-emerald-500'
                                            : accuracy >= 60
                                            ? 'bg-blue-500'
                                            : 'bg-amber-500';

                                        return (
                                            <View
                                                key={item.topicId}
                                                className="rounded-2xl border border-[#E4E8EE] bg-white p-3.5 shadow-2xs"
                                                style={{ borderCurve: 'continuous' }}
                                            >
                                                <View className="flex-row items-start justify-between gap-2">
                                                    <View className="flex-1">
                                                        <Text className="font-geist-semibold text-xs text-[#001428]" numberOfLines={1}>
                                                            {item.topicName}
                                                        </Text>
                                                        <Text className="font-geist text-[11px] text-[#526071]">
                                                            {item.subjectName}
                                                        </Text>
                                                    </View>

                                                    <View className={`rounded-full border px-2 py-0.5 ${badgeStyle}`}>
                                                        <Text className="font-geist-semibold text-[10px]">
                                                            {statusLabel}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Progress Bar & Numerical Receipt */}
                                                <View className="mt-3 gap-1">
                                                    <View className="h-2 w-full overflow-hidden rounded-full bg-[#F1F4F8]">
                                                        <View
                                                            className={`h-full ${progressColor}`}
                                                            style={{ width: `${isEligible ? accuracy : (item.sampleCount / 5) * 100}%` }}
                                                        />
                                                    </View>
                                                    <View className="flex-row items-center justify-between">
                                                        <Text className="font-geist text-[10px] text-[#526071]">
                                                            {isEligible
                                                                ? `${item.correctCount}/${item.sampleCount} correct`
                                                                : `${item.sampleCount} of 5 minimum answers`}
                                                        </Text>
                                                        <Text
                                                            style={{ fontVariant: ['tabular-nums'] }}
                                                            className="font-geist-bold text-xs text-[#001428]"
                                                        >
                                                            {isEligible ? `${accuracy}%` : 'Pending Data'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </>
                    )}

                    {/* Official Curriculum Disclaimer */}
                    <View
                        className="rounded-2xl border border-slate-200 bg-[#F1F4F8]/70 p-4"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-row items-center gap-1.5">
                            <IconInfoCircle size={15} color="#475569" />
                            <Text className="font-geist-semibold text-xs text-slate-800">
                                Independent Self-Review Notice
                            </Text>
                        </View>
                        <Text className="mt-1.5 font-geist text-[11px] leading-4 text-[#526071]">
                            {report?.disclaimer ||
                                'Subject mastery estimates are practice indicators based on your self-study activity. They do not certify official PSU curriculum examination readiness or course grade equivalency.'}
                        </Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
