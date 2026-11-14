import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
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
import IconTrendingUp from '@tabler/icons-react-native/IconTrendingUp';
import { getUserReport, getUserStreak } from '@/lib/progress';
import { listUserQuizzes } from '@/lib/quizzes';

export default function PerformanceReportPage() {
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();
    const [cardWidth, setCardWidth] = useState(Math.min(windowWidth - 32, 680));
    const [report, setReport] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [streakData, setStreakData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        setError(null);

        try {
            const [reportRes, quizzesRes, streakRes] = await Promise.all([
                getUserReport().catch(() => null),
                listUserQuizzes().catch(() => ({ quizzes: [] })),
                getUserStreak().catch(() => null),
            ]);

            if (reportRes?.report) {
                setReport(reportRes.report);
            }
            setQuizzes(quizzesRes?.quizzes || []);
            if (streakRes?.streak) {
                setStreakData(streakRes.streak);
            }
        } catch (err) {
            setError(err.message || 'Could not load your performance metrics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData(false);
        }, [loadData])
    );

    const summary = report?.summary ?? {};
    const estimates = report?.estimates ?? [];
    const strengths = report?.strengths ?? [];
    const weaknesses = report?.weaknesses ?? [];
    const hasSparseData = report?.hasSparseData ?? false;
    const accuracy = summary.overallAccuracy ?? 0;
    const currentStreak = streakData?.currentStreak ?? summary.currentStreak ?? 0;
    const longestStreak = streakData?.longestStreak ?? summary.longestStreak ?? 0;
    const totalAnswers = summary.totalQuestionsAnswered ?? 0;
    const quizzesDone = summary.totalQuizzesCompleted ?? quizzes.filter(q => q.session?.status === 'completed').length;
    const deckReviews = summary.totalFlashcardReviews ?? 0;

    // Build client-resilient quiz score trend from completed sessions
    const completedQuizScores = (quizzes || [])
        .filter(q => q.session?.status === 'completed' && (q.session?.question_count ?? 0) > 0)
        .map(q => {
            const correct = q.session?.correct_count ?? 0;
            const total = q.session?.question_count ?? 1;
            return Math.round((correct / total) * 100);
        })
        .slice(0, 10)
        .reverse();

    const quizScoreTrend = report?.quizScoreTrend?.length
        ? report.quizScoreTrend
        : completedQuizScores;

    const eligibleCount = estimates.filter(e => e.eligible).length;
    const proficientCount = Math.max(0, eligibleCount - strengths.length - weaknesses.length);

    // Circular Mastery Gauge calculations
    const gaugeRadius = 54;
    const strokeWidth = 11;
    const circumference = 2 * Math.PI * gaugeRadius;
    const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, accuracy))) / 100;
    const gaugeColor = accuracy >= 80 ? '#059669' : accuracy >= 60 ? '#001428' : '#D97706';

    // Trajectory Line Chart geometry
    const chartWidth = Math.max(cardWidth - 40, 260);
    const chartHeight = 120;
    const padX = 24;
    const padY = 16;
    const innerW = chartWidth - padX * 2;
    const innerH = chartHeight - padY * 2;

    const trendPoints = quizScoreTrend.map((score, i) => {
        const x = padX + (quizScoreTrend.length > 1 ? (i / (quizScoreTrend.length - 1)) * innerW : innerW / 2);
        const y = padY + innerH - (Math.min(100, Math.max(0, score)) / 100) * innerH;
        return { x, y, score };
    });

    const trendPath = trendPoints.length > 1
        ? trendPoints.reduce((acc, pt, i, arr) => {
              if (i === 0) return `M ${pt.x} ${pt.y}`;
              const prev = arr[i - 1];
              const cx = (prev.x + pt.x) / 2;
              return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
          }, '')
        : '';

    const areaPath = trendPoints.length > 1
        ? `${trendPath} L ${trendPoints[trendPoints.length - 1].x} ${chartHeight} L ${trendPoints[0].x} ${chartHeight} Z`
        : '';

    return (
        <SafeAreaView className="flex-1 bg-[#F8F8FF]" edges={['top', 'left', 'right']}>
            {/* Header */}
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
                    onPress={() => loadData(true)}
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
                                onPress={() => loadData(false)}
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
                            onRefresh={() => loadData(true)}
                            tintColor="#001428"
                        />
                    }
                >
                    {/* 1. Overall Mastery Card with Native SVG Circular Gauge */}
                    <View
                        onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
                        className="overflow-hidden rounded-2xl border border-[#E4E8EE] bg-white p-4 shadow-2xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-row items-center justify-between pb-3 border-b border-[#F1F4F8]">
                            <View>
                                <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                    Overall Practice Mastery
                                </Text>
                                <Text className="mt-0.5 font-geist text-xs text-[#526071]">
                                    Across {totalAnswers} recorded answers
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
                                <IconFlame
                                    size={14}
                                    color="#D97706"
                                    fill={currentStreak > 0 ? '#FDE68A' : 'none'}
                                />
                                <Text className="font-geist-bold text-xs text-amber-900">
                                    {currentStreak}d Streak
                                </Text>
                            </View>
                        </View>

                        {/* Circular Gauge and Legend */}
                        <View className="flex-row items-center justify-between pt-3">
                            {/* SVG Radial Gauge */}
                            <View className="relative items-center justify-center" style={{ width: 140, height: 140 }}>
                                <Svg width={140} height={140} viewBox="0 0 140 140">
                                    {/* Track */}
                                    <Circle
                                        cx={70}
                                        cy={70}
                                        r={gaugeRadius}
                                        stroke="#F1F4F8"
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    {/* Progress Ring */}
                                    <Circle
                                        cx={70}
                                        cy={70}
                                        r={gaugeRadius}
                                        stroke={gaugeColor}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={`${circumference}`}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        fill="none"
                                        transform="rotate(-90 70 70)"
                                    />
                                </Svg>
                                <View className="absolute inset-0 items-center justify-center">
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-3xl text-[#001428]"
                                    >
                                        {accuracy}%
                                    </Text>
                                    <Text className="font-geist text-[10px] text-[#526071]">
                                        Accuracy
                                    </Text>
                                </View>
                            </View>

                            {/* Readiness breakdown */}
                            <View className="flex-1 justify-center pl-3">
                                <Text className="font-geist-bold text-base text-[#001428]">
                                    Topic Readiness
                                </Text>
                                <Text className="mt-0.5 font-geist text-[11px] leading-4 text-[#526071]">
                                    {eligibleCount > 0
                                        ? `${eligibleCount} evaluated topics meeting 5-answer threshold`
                                        : 'Answer 5 questions per topic to establish mastery indicators'}
                                </Text>

                                <View className="mt-2.5 gap-1.5">
                                    <View className="flex-row items-center justify-between rounded-lg bg-emerald-50/70 px-2.5 py-1">
                                        <View className="flex-row items-center gap-1.5">
                                            <View className="h-2 w-2 rounded-full bg-emerald-600" />
                                            <Text className="font-geist-medium text-[11px] text-emerald-950">Mastered (≥80%)</Text>
                                        </View>
                                        <Text style={{ fontVariant: ['tabular-nums'] }} className="font-geist-bold text-[11px] text-emerald-950">
                                            {strengths.length}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center justify-between rounded-lg bg-[#F1F4F8] px-2.5 py-1">
                                        <View className="flex-row items-center gap-1.5">
                                            <View className="h-2 w-2 rounded-full bg-[#001428]" />
                                            <Text className="font-geist-medium text-[11px] text-[#001428]">Proficient (60–79%)</Text>
                                        </View>
                                        <Text style={{ fontVariant: ['tabular-nums'] }} className="font-geist-bold text-[11px] text-[#001428]">
                                            {proficientCount}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center justify-between rounded-lg bg-amber-50/70 px-2.5 py-1">
                                        <View className="flex-row items-center gap-1.5">
                                            <View className="h-2 w-2 rounded-full bg-amber-600" />
                                            <Text className="font-geist-medium text-[11px] text-amber-950">Needs Review (&lt;70%)</Text>
                                        </View>
                                        <Text style={{ fontVariant: ['tabular-nums'] }} className="font-geist-bold text-[11px] text-amber-950">
                                            {weaknesses.length}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* 4-Stat Activity Grid */}
                        <View
                            className="mt-4 grid grid-cols-2 flex-row flex-wrap divide-x divide-y divide-[#E4E8EE] rounded-xl border border-[#E4E8EE] bg-[#F8F8FF]"
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
                                    {quizzesDone}
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
                                    {deckReviews}
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
                                    {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
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
                                    {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* 2. Quiz Score Trajectory Graph */}
                    <View
                        className="overflow-hidden rounded-2xl border border-[#E4E8EE] bg-white p-4 shadow-2xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-1 pr-2">
                                <View className="flex-row items-center gap-1.5">
                                    <IconTrendingUp size={16} color="#001428" />
                                    <Text className="font-geist-bold text-sm text-[#001428]">
                                        Quiz Score Trajectory
                                    </Text>
                                </View>
                                <Text className="mt-0.5 font-geist text-xs text-[#526071]">
                                    {quizScoreTrend.length > 0
                                        ? `Performance across your latest ${quizScoreTrend.length} quiz sessions`
                                        : 'Complete practice quizzes to establish your score curve'}
                                </Text>
                            </View>

                            {quizScoreTrend.length > 0 && (
                                <View className="rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-200">
                                    <Text className="font-geist-bold text-xs text-blue-900">
                                        {quizScoreTrend[quizScoreTrend.length - 1]}% Latest
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Spline Graph Display */}
                        {quizScoreTrend.length >= 2 ? (
                            <View className="mt-3 items-center">
                                <Svg width={chartWidth} height={chartHeight}>
                                    <Defs>
                                        <LinearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="0" stopColor="#001428" stopOpacity="0.22" />
                                            <Stop offset="1" stopColor="#001428" stopOpacity="0.0" />
                                        </LinearGradient>
                                    </Defs>

                                    {/* 75% Passing Threshold Line */}
                                    <Path
                                        d={`M ${padX} ${padY + innerH * 0.25} L ${chartWidth - padX} ${padY + innerH * 0.25}`}
                                        stroke="#94A3B8"
                                        strokeDasharray="4 4"
                                        strokeWidth="1"
                                    />

                                    {/* Gradient Area Fill */}
                                    <Path d={areaPath} fill="url(#scoreAreaGrad)" />

                                    {/* Score Spline Curve */}
                                    <Path
                                        d={trendPath}
                                        fill="none"
                                        stroke="#001428"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />

                                    {/* Interactive Score Dots */}
                                    {trendPoints.map((pt, idx) => (
                                        <Circle
                                            key={`pt-${idx}`}
                                            cx={pt.x}
                                            cy={pt.y}
                                            r={4}
                                            fill="#FFFFFF"
                                            stroke="#001428"
                                            strokeWidth="2"
                                        />
                                    ))}
                                </Svg>

                                {/* Benchmark Subtitle */}
                                <View className="w-full flex-row items-center justify-between mt-2 px-1">
                                    <Text className="font-geist text-[10px] text-[#94A3B8]">
                                        Dashed line: 75% Passing Target
                                    </Text>
                                    <Text className="font-geist-medium text-[10px] text-[#526071]">
                                        {trendPoints.length} Completed Sessions
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View className="mt-3 rounded-xl border border-dashed border-[#E4E8EE] bg-[#F8F8FF] p-4 items-center justify-center">
                                <IconTarget size={28} color="#94A3B8" />
                                <Text className="mt-2 font-geist-semibold text-xs text-[#001428]">
                                    {quizScoreTrend.length === 1
                                        ? `First Quiz Score: ${quizScoreTrend[0]}%`
                                        : 'Score Curve Pending'}
                                </Text>
                                <Text className="mt-1 text-center font-geist text-[11px] text-[#526071]">
                                    {quizScoreTrend.length === 1
                                        ? 'Complete 1 more quiz to render your comparative trajectory line.'
                                        : 'Take quizzes from course modules to begin plotting your performance curve.'}
                                </Text>
                                <Pressable
                                    onPress={() => router.push('/(main)/quizzes/create')}
                                    className="mt-3 flex-row items-center gap-1 rounded-xl bg-[#001428] px-3.5 py-2 active:opacity-85"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className="font-geist-medium text-xs text-white">
                                        Start Quiz
                                    </Text>
                                    <IconArrowRight size={13} color="#FFFFFF" />
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* 4. Strengths & Weaknesses Diagnostics */}
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

                        {/* Weaknesses Card */}
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

                    {/* 5. Topic Practice Estimates */}
                    <View className="gap-2.5">
                        <View>
                            <Text className="font-geist-bold text-sm text-[#001428]">
                                Topic Practice Estimates
                            </Text>
                            <Text className="font-geist text-xs text-[#526071]">
                                Percentage correct across the latest 20 first-submission answers per topic.
                            </Text>
                        </View>

                        {estimates.length > 0 ? (
                            <View className="gap-2">
                                {estimates.map(item => {
                                    const isEligible = item.eligible;
                                    const itemAcc = item.accuracy;
                                    const statusLabel = !isEligible
                                        ? 'Insufficient Data (<5)'
                                        : itemAcc >= 80
                                        ? 'Mastered'
                                        : itemAcc >= 60
                                        ? 'Proficient'
                                        : 'Needs Practice';

                                    const badgeStyle = !isEligible
                                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                                        : itemAcc >= 80
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : itemAcc >= 60
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : 'bg-amber-50 text-amber-900 border-amber-200';

                                    const progressColor = !isEligible
                                        ? 'bg-slate-300'
                                        : itemAcc >= 80
                                        ? 'bg-emerald-500'
                                        : itemAcc >= 60
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

                                            <View className="mt-3 gap-1">
                                                <View className="h-2 w-full overflow-hidden rounded-full bg-[#F1F4F8]">
                                                    <View
                                                        className={`h-full ${progressColor}`}
                                                        style={{ width: `${isEligible ? itemAcc : (item.sampleCount / 5) * 100}%` }}
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
                                                        {isEligible ? `${itemAcc}%` : 'Pending Data'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View className="rounded-2xl border border-dashed border-[#E4E8EE] bg-white p-5 items-center justify-center">
                                <Text className="font-geist text-xs text-[#526071]">
                                    No topic attempts recorded yet. Answer quizzes to populate accuracy benchmarks.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Curriculum Disclaimer */}
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
