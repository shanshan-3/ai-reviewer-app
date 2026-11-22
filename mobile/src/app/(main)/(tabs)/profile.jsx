import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import TopicEstimatesCard from '@/components/topic-estimates-card';
import { getUserReport, getUserStreak } from '@/lib/progress';
import { getOwnProfile } from '@/lib/profile';
import { getLocalAvatarUri, pickAndSaveAvatar, removeLocalAvatar } from '@/lib/avatar';
import { listUserQuizzes } from '@/lib/quizzes';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import IconChartBar from '@tabler/icons-react-native/IconChartBar';
import IconLogout from '@tabler/icons-react-native/IconLogout';
import IconFlame from '@tabler/icons-react-native/IconFlame';
import IconTrophy from '@tabler/icons-react-native/IconTrophy';
import IconCards from '@tabler/icons-react-native/IconCards';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';
import IconCamera from '@tabler/icons-react-native/IconCamera';
import IconTrendingUp from '@tabler/icons-react-native/IconTrendingUp';
import IconBulb from '@tabler/icons-react-native/IconBulb';

export default function ProfilePage() {
    const { session } = useSession();
    const pending = useRef(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [report, setReport] = useState(null);
    const [streakData, setStreakData] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [profile, setProfile] = useState(null);
    const [avatarUri, setAvatarUri] = useState(null);
    const [message, setMessage] = useState('');
    const [cardWidth, setCardWidth] = useState(340);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setMessage('');

        try {
            const [reportRes, quizzesRes, streakRes, profileRes, localAvatar] = await Promise.all([
                getUserReport().catch(() => null),
                listUserQuizzes().catch(() => ({ quizzes: [] })),
                getUserStreak().catch(() => null),
                getOwnProfile().catch(() => null),
                getLocalAvatarUri(session?.user?.id).catch(() => null),
            ]);

            if (reportRes?.report) setReport(reportRes.report);
            if (quizzesRes?.quizzes) setQuizzes(quizzesRes.quizzes);
            if (streakRes?.streak) setStreakData(streakRes.streak);
            if (profileRes) setProfile(profileRes);
            if (localAvatar !== undefined) setAvatarUri(localAvatar);
        } catch {
            setMessage('Could not refresh performance metrics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [session]);

    useFocusEffect(
        useCallback(() => {
            loadData(false);
        }, [loadData])
    );

    const email = session?.user?.email || 'Candidate Account';
    const displayName = profile?.full_name || (email.includes('@') ? email.split('@')[0] : email);
    const initial = displayName.charAt(0).toUpperCase();

    const summary = report?.summary ?? {};
    const estimates = useMemo(() => report?.estimates ?? [], [report?.estimates]);
    const strengths = report?.strengths ?? [];
    const weaknesses = report?.weaknesses ?? [];
    const isEmpty = report?.isEmpty ?? (loading ? false : true);

    const accuracy = summary.overallAccuracy ?? 0;
    const totalAnswers = summary.totalQuestionsAnswered ?? 0;
    const quizzesDone = summary.totalQuizzesCompleted ?? quizzes.filter(q => q.session?.status === 'completed').length;
    const currentStreak = streakData?.currentStreak ?? summary.currentStreak ?? 0;
    const longestStreak = streakData?.longestStreak ?? summary.longestStreak ?? 0;
    const flashcardReviews = summary.totalFlashcardReviews ?? 0;

    // Build client-resilient quiz score trend from completed sessions
    const completedQuizScores = useMemo(() => {
        return (quizzes || [])
            .filter(q => q.session?.status === 'completed' && (q.session?.question_count ?? 0) > 0)
            .map(q => {
                const correct = q.session?.correct_count ?? 0;
                const total = q.session?.question_count ?? 1;
                return Math.round((correct / total) * 100);
            })
            .slice(0, 10)
            .reverse();
    }, [quizzes]);

    const quizScoreTrend = useMemo(() => {
        return report?.quizScoreTrend?.length ? report.quizScoreTrend : completedQuizScores;
    }, [report, completedQuizScores]);

    // Exam Readiness status mapping
    const readinessInfo = useMemo(() => {
        if (totalAnswers === 0) {
            return {
                title: 'Pending',
                desc: 'Take quizzes to calculate your readiness.',
                color: 'text-[#526071]',
                bg: 'bg-[#F1F4F8] border-[#E2E8F0]',
                barColor: 'bg-[#CBD5E1]',
            };
        }
        if (accuracy >= 80) {
            return {
                title: 'Exam Ready',
                desc: 'High accuracy across tested topics.',
                color: 'text-emerald-800',
                bg: 'bg-emerald-50 border-emerald-200/80',
                barColor: 'bg-emerald-600',
            };
        }
        if (accuracy >= 65) {
            return {
                title: 'Progressing Well',
                desc: 'Solid foundation. Practice weaker topics to reach 80%.',
                color: 'text-blue-800',
                bg: 'bg-blue-50 border-blue-200/80',
                barColor: 'bg-blue-600',
            };
        }
        return {
            title: 'Needs Preparation',
            desc: 'Review notes and practice weak topics.',
            color: 'text-amber-800',
            bg: 'bg-amber-50 border-amber-200/80',
            barColor: 'bg-amber-500',
        };
    }, [accuracy, totalAnswers]);

    // Trajectory Line Chart geometry
    const chartWidth = Math.max(cardWidth - 40, 260);
    const chartHeight = 120;
    const padX = 24;
    const padY = 16;
    const innerW = chartWidth - padX * 2;
    const innerH = chartHeight - padY * 2;

    const trendPoints = useMemo(() => {
        return quizScoreTrend.map((score, i) => {
            const x = padX + (quizScoreTrend.length > 1 ? (i / (quizScoreTrend.length - 1)) * innerW : innerW / 2);
            const y = padY + innerH - (Math.min(100, Math.max(0, score)) / 100) * innerH;
            return { x, y, score };
        });
    }, [quizScoreTrend, innerW, innerH, padX, padY]);

    const trendPath = useMemo(() => {
        return trendPoints.length > 1
            ? trendPoints.reduce((acc, pt, i, arr) => {
                  if (i === 0) return `M ${pt.x} ${pt.y}`;
                  const prev = arr[i - 1];
                  const cx = (prev.x + pt.x) / 2;
                  return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
              }, '')
            : '';
    }, [trendPoints]);

    const areaPath = useMemo(() => {
        return trendPoints.length > 1
            ? `${trendPath} L ${trendPoints[trendPoints.length - 1].x} ${chartHeight} L ${trendPoints[0].x} ${chartHeight} Z`
            : '';
    }, [trendPath, trendPoints, chartHeight]);

    function confirmSignOut() {
        if (pending.current) return;
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: handleSignOut,
                },
            ]
        );
    }

    async function handleSignOut() {
        if (pending.current) return;
        pending.current = true;
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            if (error) throw error;
        } catch {
            setMessage('Could not sign out. Please try again.');
        } finally {
            pending.current = false;
            setLoading(false);
        }
    }

    function handleAvatarPress() {
        if (avatarUri) {
            Alert.alert(
                'Profile Picture',
                'Change or remove your profile picture.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove Photo',
                        style: 'destructive',
                        onPress: async () => {
                            await removeLocalAvatar(session?.user?.id);
                            setAvatarUri(null);
                        },
                    },
                    {
                        text: 'Choose New Photo',
                        onPress: handlePickAvatar,
                    },
                ]
            );
        } else {
            handlePickAvatar();
        }
    }

    async function handlePickAvatar() {
        try {
            const uri = await pickAndSaveAvatar(session?.user?.id);
            if (uri) {
                setAvatarUri(uri);
            }
        } catch (err) {
            Alert.alert('Photo Error', err.message || 'Could not select photo.');
        }
    }

    const appVersion = Constants.expoConfig?.version || '1.0.0';

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadData(true)}
                        tintColor="#001428"
                    />
                }
            >
                {/* Candidate Identity & Readiness Header */}
                <View
                    className="overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white p-5 shadow-2xs"
                    style={{ borderCurve: 'continuous' }}
                >
                    <View className="flex-row items-center gap-3.5">
                        {/* Interactive Candidate Avatar */}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Change profile picture"
                            onPress={handleAvatarPress}
                            style={({ pressed }) => [
                                {
                                    width: 64,
                                    height: 64,
                                    transform: [{ scale: pressed ? 0.96 : 1 }],
                                },
                            ]}
                            className="relative"
                        >
                            {avatarUri ? (
                                <Image
                                    source={{ uri: avatarUri }}
                                    style={{ width: 64, height: 64, borderRadius: 32 }}
                                    className="border border-[#E5E9F0] bg-slate-100"
                                />
                            ) : (
                                <View
                                    style={{ width: 64, height: 64, borderRadius: 32 }}
                                    className="items-center justify-center bg-[#001428] shadow-xs"
                                >
                                    <Text className="font-geist-bold text-2xl text-white">
                                        {initial}
                                    </Text>
                                </View>
                            )}
                            <View
                                style={{ width: 22, height: 22, borderRadius: 11 }}
                                className="absolute -bottom-0.5 -right-0.5 items-center justify-center bg-white border border-[#E5E9F0] shadow-2xs"
                            >
                                <IconCamera size={12} color="#001428" strokeWidth={2} />
                            </View>
                        </Pressable>
                        <View className="flex-1 pr-1">
                            <Text numberOfLines={1} className="font-geist-bold text-lg tracking-tight text-[#001428]">
                                {displayName}
                            </Text>
                            <Text numberOfLines={1} className="font-geist text-xs text-[#526071]">
                                {email}
                            </Text>
                        </View>
                    </View>

                    {/* Overall Exam Readiness Meter */}
                    {!isEmpty && (
                        <View className="mt-4 pt-4 border-t border-[#F1F4F8]">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                    Exam Readiness
                                </Text>
                                <View
                                    className={`rounded-full border px-2.5 py-0.5 ${readinessInfo.bg}`}
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className={`font-geist-bold text-[10px] ${readinessInfo.color}`}>
                                        {readinessInfo.title}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-baseline gap-2 mb-2">
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="font-geist-bold text-3xl tracking-tight text-[#001428]"
                                >
                                    {accuracy}%
                                </Text>
                                <Text className="font-geist text-xs text-[#526071]">
                                    accuracy
                                </Text>
                            </View>

                            {/* Readiness Bar */}
                            <View className="h-2 w-full overflow-hidden rounded-full bg-[#E5E9F0]" style={{ borderCurve: 'continuous' }}>
                                <View
                                    className={`h-full rounded-full ${readinessInfo.barColor}`}
                                    style={{ width: `${Math.min(100, Math.max(4, accuracy))}%` }}
                                />
                            </View>
                            <Text className="mt-2 font-geist text-[11px] text-[#526071] leading-4">
                                {readinessInfo.desc}
                            </Text>
                        </View>
                    )}

                    {/* Balanced 4-Metric Practice Strip */}
                    {!isEmpty && (
                        <View className="mt-4 flex-row items-center justify-between divide-x divide-[#F1F3F6] border-t border-[#F1F3F6] pt-3.5">
                            <View className="flex-1 items-center px-1">
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="font-geist-bold text-base text-[#001428]"
                                >
                                    {totalAnswers}
                                </Text>
                                <Text className="font-geist text-[10px] text-[#526071] uppercase tracking-wider">
                                    Solved
                                </Text>
                            </View>

                            <View className="flex-1 items-center px-1">
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="font-geist-bold text-base text-[#001428]"
                                >
                                    {quizzesDone}
                                </Text>
                                <Text className="font-geist text-[10px] text-[#526071] uppercase tracking-wider">
                                    Quizzes
                                </Text>
                            </View>

                            <View className="flex-1 items-center px-1">
                                <View className="flex-row items-center gap-1">
                                    <IconCards size={14} color="#001428" strokeWidth={2} />
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-base text-[#001428]"
                                    >
                                        {flashcardReviews}
                                    </Text>
                                </View>
                                <Text className="font-geist text-[10px] text-[#526071] uppercase tracking-wider">
                                    Cards
                                </Text>
                            </View>

                            <View className="flex-1 items-center px-1">
                                <View className="flex-row items-center gap-1">
                                    <IconFlame
                                        size={14}
                                        color={streakData?.hasStudiedToday ? '#D97706' : '#94A3B8'}
                                        fill={streakData?.hasStudiedToday ? '#FDE68A' : 'none'}
                                        strokeWidth={2}
                                    />
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-base text-[#001428]"
                                    >
                                        {currentStreak}d
                                    </Text>
                                </View>
                                <Text className="font-geist text-[10px] text-[#526071] uppercase tracking-wider">
                                    Streak
                                </Text>
                                {longestStreak > 0 && (
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist text-[9px] text-[#94A3B8]"
                                    >
                                        best {longestStreak}d
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* Empty State */}
                {isEmpty && !loading && (
                    <View
                        className="items-center rounded-2xl border border-[#E5E9F0] bg-white p-6 shadow-2xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View
                            className="mb-3 h-11 w-11 items-center justify-center rounded-xl bg-[#F1F4F8]"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <IconChartBar size={20} color="#001428" strokeWidth={2} />
                        </View>
                        <Text className="font-geist-bold text-base tracking-tight text-[#001428] text-center">
                            No Quiz Data Yet
                        </Text>
                        <Text className="mt-1 font-geist text-xs text-[#526071] text-center leading-5 px-3">
                            Take quizzes to track your accuracy and topic performance.
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Start your first quiz"
                            onPress={() => router.push('/(main)/quizzes/create')}
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed ? 0.98 : 1 }],
                                },
                            ]}
                            className="mt-4 rounded-xl bg-[#001428] px-6 py-2.5 active:opacity-90"
                        >
                            <Text className="font-geist-semibold text-xs text-white">
                                Start Quiz
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* 2. Quiz Score Trajectory Graph */}
                {!isEmpty && (
                    <View
                        onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
                        className="overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white p-4 shadow-2xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-1 pr-2">
                                <View className="flex-row items-center gap-1.5">
                                    <IconTrendingUp size={16} color="#001428" strokeWidth={2} />
                                    <Text className="font-geist-bold text-sm text-[#001428]">
                                        Score Trend
                                    </Text>
                                </View>
                                <Text className="mt-0.5 font-geist text-xs text-[#526071]">
                                    {quizScoreTrend.length > 0
                                        ? `Last ${quizScoreTrend.length} quizzes`
                                        : 'Complete quizzes to view score trends.'}
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
                                        <LinearGradient id="profileScoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
                                    <Path d={areaPath} fill="url(#profileScoreAreaGrad)" />

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
                                        75% passing target
                                    </Text>
                                    <Text className="font-geist-medium text-[10px] text-[#526071]">
                                        {trendPoints.length} completed
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View className="mt-3 rounded-xl border border-dashed border-[#E4E8EE] bg-[#F8F8FF] p-4 items-center justify-center">
                                <IconTrendingUp size={28} color="#94A3B8" />
                                <Text className="mt-2 font-geist-semibold text-xs text-[#001428]">
                                    {quizScoreTrend.length === 1
                                        ? `First Quiz Score: ${quizScoreTrend[0]}%`
                                        : 'Trend Pending'}
                                </Text>
                                <Text className="mt-1 text-center font-geist text-[11px] text-[#526071]">
                                    {quizScoreTrend.length === 1
                                        ? 'Take 1 more quiz to view your score trend.'
                                        : 'Complete at least 2 quizzes to see your trend.'}
                                </Text>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Start Quiz"
                                    onPress={() => router.push('/(main)/quizzes/create')}
                                    className="mt-3 rounded-xl bg-[#001428] px-4 py-2 active:opacity-85"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className="font-geist-medium text-xs text-white">
                                        Start Quiz
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}

                {/* 3. Diagnostic Highlights (Strengths & Focus Areas) */}
                {!isEmpty && (strengths.length > 0 || weaknesses.length > 0) && (
                    <View className="gap-3">
                        <Text className="px-1 font-geist-semibold text-[11px] uppercase tracking-wider text-[#526071]">
                            Highlights
                        </Text>

                        {/* Strengths Card */}
                        {strengths.length > 0 && (
                            <View
                                className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-1.5">
                                        <IconTrophy size={15} color="#059669" strokeWidth={2} />
                                        <Text className="font-geist-semibold text-xs uppercase tracking-wider text-emerald-800">
                                            Strengths (≥80%)
                                        </Text>
                                    </View>
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-xs text-emerald-800"
                                    >
                                        {strengths.length} {strengths.length === 1 ? 'topic' : 'topics'}
                                    </Text>
                                </View>
                                <View className="mt-2.5 gap-2">
                                    {strengths.slice(0, 3).map(topic => (
                                        <View
                                            key={topic.topicId}
                                            className="flex-row items-center justify-between rounded-xl border border-emerald-200/80 bg-white/80 p-2.5"
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
                            </View>
                        )}

                        {/* Priority Focus Areas Card */}
                        {weaknesses.length > 0 && (
                            <View
                                className="rounded-2xl border border-amber-200 bg-white p-4 shadow-2xs"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-1.5">
                                        <IconBulb size={16} color="#D97706" strokeWidth={2} />
                                        <Text className="font-geist-semibold text-xs uppercase tracking-wider text-amber-900">
                                            Focus Areas (&lt;70%)
                                        </Text>
                                    </View>
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-xs text-amber-900"
                                    >
                                        {weaknesses.length} {weaknesses.length === 1 ? 'topic' : 'topics'}
                                    </Text>
                                </View>
                                <View className="mt-2.5 gap-2">
                                    {weaknesses.slice(0, 3).map(topic => (
                                        <View
                                            key={topic.topicId}
                                            className="flex-row items-center justify-between rounded-xl border border-amber-200 bg-amber-50/40 p-2.5"
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
                                            <View className="flex-row items-center gap-2">
                                                <View className="rounded-full bg-amber-100 px-2 py-0.5">
                                                    <Text
                                                        style={{ fontVariant: ['tabular-nums'] }}
                                                        className="font-geist-bold text-xs text-amber-900"
                                                    >
                                                        {topic.accuracy}%
                                                    </Text>
                                                </View>
                                                <Pressable
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Practice weak topic: ${topic.topicName}`}
                                                    onPress={() => router.push({
                                                        pathname: '/(main)/quizzes/create',
                                                        params: { sourceKind: 'topic', topicId: topic.topicId },
                                                    })}
                                                    className="rounded-lg bg-[#001428] px-2.5 py-1"
                                                >
                                                    <Text className="font-geist-semibold text-[10px] text-white">Practice</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* 4. Curriculum Topic Mastery (Full expandable table) */}
                {!isEmpty && estimates.length > 0 && (
                    <View className="gap-2.5">
                        <Text className="px-1 font-geist-semibold text-[11px] uppercase tracking-wider text-[#526071]">
                            Topic Accuracy
                        </Text>

                        <TopicEstimatesCard
                            estimates={estimates}
                            loading={loading}
                            limit={5}
                        />
                    </View>
                )}

                {/* 5. Academic Self-Review Notice */}
                {!isEmpty && (
                    <View
                        className="rounded-2xl border border-slate-200 bg-[#F1F4F8]/70 p-4"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-row items-center gap-1.5">
                            <IconInfoCircle size={15} color="#475569" />
                            <Text className="font-geist-semibold text-xs text-slate-800">
                                Academic Notice
                            </Text>
                        </View>
                        <Text className="mt-1.5 font-geist text-[11px] leading-4 text-[#526071]">
                            {report?.disclaimer ||
                                'Practice scores reflect your self-study activity and do not guarantee official PSU examination results or grades.'}
                        </Text>
                    </View>
                )}

                {/* 6. Account & Settings Inset Group */}
                <View className="gap-2.5">
                    <Text className="px-1 font-geist-semibold text-[11px] uppercase tracking-wider text-[#526071]">
                        Account
                    </Text>

                    <View
                        className="overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white shadow-2xs divide-y divide-[#F1F3F6]"
                        style={{ borderCurve: 'continuous' }}
                    >
                        {/* App Version */}
                        <View className="flex-row items-center justify-between p-3.5">
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-xl bg-[#F1F4F8]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconInfoCircle size={16} color="#526071" strokeWidth={2} />
                                </View>
                                <Text className="font-geist-bold text-xs text-[#001428]">
                                    App Version
                                </Text>
                            </View>
                            <Text
                                style={{ fontVariant: ['tabular-nums'] }}
                                className="font-geist text-xs text-[#94A3B8]"
                            >
                                v{appVersion}
                            </Text>
                        </View>

                        {/* Sign Out (No deceptive chevron: opens an Alert dialog, not a page) */}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Sign out of your account"
                            onPress={confirmSignOut}
                            className="flex-row items-center justify-between p-3.5 active:bg-rose-50/50"
                        >
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-xl bg-rose-50 border border-rose-100"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconLogout size={16} color="#DC2626" strokeWidth={2} />
                                </View>
                                <Text className="font-geist-semibold text-xs text-rose-600">
                                    Sign Out
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                {message ? (
                    <View className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                        <Text className="font-geist text-xs text-rose-700">{message}</Text>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
