import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import TopicEstimatesCard from '@/components/topic-estimates-card';
import { getUserReport, getUserStreak } from '@/lib/progress';
import { getOwnProfile } from '@/lib/profile';
import { getLocalAvatarUri, pickAndSaveAvatar, removeLocalAvatar } from '@/lib/avatar';
import { listUserQuizzes } from '@/lib/quizzes';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import IconChartBar from '@tabler/icons-react-native/IconChartBar';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconLogout from '@tabler/icons-react-native/IconLogout';
import IconFlame from '@tabler/icons-react-native/IconFlame';
import IconTrophy from '@tabler/icons-react-native/IconTrophy';
import IconAlertTriangle from '@tabler/icons-react-native/IconAlertTriangle';
import IconCards from '@tabler/icons-react-native/IconCards';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';
import IconTarget from '@tabler/icons-react-native/IconTarget';
import IconCamera from '@tabler/icons-react-native/IconCamera';

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

    // Exam Readiness status mapping
    const readinessInfo = useMemo(() => {
        if (totalAnswers === 0) {
            return {
                title: 'Assessment Pending',
                desc: 'Complete quizzes to calculate your examination readiness.',
                color: 'text-[#526071]',
                bg: 'bg-[#F1F4F8] border-[#E2E8F0]',
                barColor: 'bg-[#CBD5E1]',
            };
        }
        if (accuracy >= 80) {
            return {
                title: 'Exam Ready',
                desc: 'Strong performance across assessed curriculum topics.',
                color: 'text-emerald-800',
                bg: 'bg-emerald-50 border-emerald-200/80',
                barColor: 'bg-emerald-600',
            };
        }
        if (accuracy >= 65) {
            return {
                title: 'Progressing Well',
                desc: 'Solid foundation. Review weaker topics to reach 80% accuracy.',
                color: 'text-blue-800',
                bg: 'bg-blue-50 border-blue-200/80',
                barColor: 'bg-blue-600',
            };
        }
        return {
            title: 'Needs Preparation',
            desc: 'Review lecture notes and practice weaker topics.',
            color: 'text-amber-800',
            bg: 'bg-amber-50 border-amber-200/80',
            barColor: 'bg-amber-500',
        };
    }, [accuracy, totalAnswers]);

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

    const topStrength = strengths[0] || null;
    const topWeakness = weaknesses[0] || null;
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]" edges={['left', 'right']}>
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
                {/* Candidate Identity Header */}
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
                            <Text numberOfLines={1} className="font-geist text-xs text-[#64748B]">
                                {email}
                            </Text>
                        </View>
                    </View>

                    {/* Overall Exam Readiness Meter */}
                    {!isEmpty && (
                        <View className="mt-4 pt-4 border-t border-[#F1F4F8]">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#64748B]">
                                    Exam Readiness Score
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
                                <Text className="font-geist text-xs text-[#64748B]">
                                    cumulative accuracy
                                </Text>
                            </View>

                            {/* Readiness Bar */}
                            <View className="h-2 w-full overflow-hidden rounded-full bg-[#E5E9F0]" style={{ borderCurve: 'continuous' }}>
                                <View
                                    className={`h-full rounded-full ${readinessInfo.barColor}`}
                                    style={{ width: `${Math.min(100, Math.max(4, accuracy))}%` }}
                                />
                            </View>
                            <Text className="mt-2 font-geist text-[11px] text-[#64748B] leading-4">
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
                                <Text className="font-geist text-[10px] text-[#64748B] uppercase tracking-wider">
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
                                <Text className="font-geist text-[10px] text-[#64748B] uppercase tracking-wider">
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
                                <Text className="font-geist text-[10px] text-[#64748B] uppercase tracking-wider">
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
                                <Text className="font-geist text-[10px] text-[#64748B] uppercase tracking-wider">
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

                {/* Empty State — Honest Onboarding */}
                {isEmpty && !loading && (
                    <View
                        className="items-center rounded-2xl border border-[#E5E9F0] bg-white p-6 shadow-2xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View
                            className="mb-3 h-11 w-11 items-center justify-center rounded-xl bg-[#F1F4F8]"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <IconTarget size={20} color="#001428" strokeWidth={2} />
                        </View>
                        <Text className="font-geist-bold text-base tracking-tight text-[#001428] text-center">
                            Your Readiness Portfolio
                        </Text>
                        <Text className="mt-1 font-geist text-xs text-[#64748B] text-center leading-5 px-3">
                            Take practice quizzes to establish your readiness baseline and track topic accuracy.
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
                                Start Practice Quiz
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* Diagnostic Highlights */}
                {(topStrength || topWeakness) && (
                    <View className="gap-2.5">
                        <Text className="px-1 font-geist-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                            Diagnostic Highlights
                        </Text>

                        {/* Top Strength Card */}
                        {topStrength && (
                            <View
                                className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-1.5">
                                        <IconTrophy size={15} color="#059669" strokeWidth={2} />
                                        <Text className="font-geist-semibold text-xs uppercase tracking-wider text-emerald-800">
                                            Curriculum Strength
                                        </Text>
                                    </View>
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-xs text-emerald-800"
                                    >
                                        {topStrength.accuracy}% Accuracy
                                    </Text>
                                </View>
                                <Text numberOfLines={1} className="mt-1.5 font-geist-bold text-sm text-[#001428]">
                                    {topStrength.topicName}
                                </Text>
                                <Text className="mt-0.5 font-geist text-xs text-[#526071]">
                                    {topStrength.sampleCount} questions answered • 80%+ accuracy
                                </Text>
                            </View>
                        )}

                        {/* Top Weakness / Review Priority Card */}
                        {topWeakness && (
                            <View
                                className="rounded-2xl border border-amber-200 bg-white p-4 shadow-2xs"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-1.5">
                                        <IconAlertTriangle size={15} color="#D97706" strokeWidth={2} />
                                        <Text className="font-geist-semibold text-xs uppercase tracking-wider text-amber-900">
                                            Priority Review Area
                                        </Text>
                                    </View>
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-xs text-amber-900"
                                    >
                                        {topWeakness.accuracy}% Accuracy
                                    </Text>
                                </View>
                                <Text numberOfLines={1} className="mt-1.5 font-geist-bold text-sm text-[#001428]">
                                    {topWeakness.topicName}
                                </Text>
                                <Text numberOfLines={2} className="mt-0.5 font-geist text-xs text-[#64748B] leading-4">
                                    Recommended for practice to raise your accuracy in this topic.
                                </Text>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Practice weak topic: ${topWeakness.topicName}`}
                                    onPress={() => router.push({
                                        pathname: '/(main)/quizzes/create',
                                        params: { sourceKind: 'topic', topicId: topWeakness.topicId },
                                    })}
                                    style={({ pressed }) => [
                                        {
                                            borderCurve: 'continuous',
                                            transform: [{ scale: pressed ? 0.98 : 1 }],
                                        },
                                    ]}
                                    className="mt-3.5 items-center justify-center rounded-xl bg-[#001428] py-2.5 active:opacity-90"
                                >
                                    <Text className="font-geist-semibold text-xs text-white">
                                        Practice Topic Now
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}

                {/* Topic Mastery Summary Card */}
                {!isEmpty && (
                    <View className="gap-2.5">
                        <Text className="px-1 font-geist-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                            Curriculum Topic Mastery
                        </Text>

                        <TopicEstimatesCard
                            estimates={estimates}
                            loading={loading}
                            limit={4}
                            onViewAllPress={() => router.push('/(main)/report')}
                        />
                    </View>
                )}

                {/* Account & Settings Inset Group */}
                <View className="gap-2.5">
                    <Text className="px-1 font-geist-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                        Account
                    </Text>

                    <View
                        className="overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white shadow-2xs divide-y divide-[#F1F3F6]"
                        style={{ borderCurve: 'continuous' }}
                    >
                        {/* Full Diagnostic Report */}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="View full detailed performance report"
                            onPress={() => router.push('/(main)/report')}
                            className="flex-row items-center justify-between p-3.5 active:bg-[#F8F9FC]"
                        >
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-xl bg-[#001428]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconChartBar size={16} color="#FFFFFF" strokeWidth={2} />
                                </View>
                                <View>
                                    <Text className="font-geist-bold text-xs text-[#001428]">
                                        Full Diagnostic Report
                                    </Text>
                                    <Text className="font-geist text-[11px] text-[#64748B]">
                                        Trajectory curves, weaknesses & question history
                                    </Text>
                                </View>
                            </View>
                            <IconChevronRight size={16} color="#94A3B8" />
                        </Pressable>

                        {/* App Version */}
                        <View className="flex-row items-center justify-between p-3.5">
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-xl bg-[#F1F4F8]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconInfoCircle size={16} color="#64748B" strokeWidth={2} />
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
