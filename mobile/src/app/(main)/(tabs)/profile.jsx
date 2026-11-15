import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import TopicEstimatesCard from '@/components/topic-estimates-card';
import { getTopicEstimates } from '@/lib/progress';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import IconShieldCheck from '@tabler/icons-react-native/IconShieldCheck';
import IconChartBar from '@tabler/icons-react-native/IconChartBar';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconLogout from '@tabler/icons-react-native/IconLogout';
import IconLock from '@tabler/icons-react-native/IconLock';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import IconCertificate from '@tabler/icons-react-native/IconCertificate';

export default function ProfilePage() {
    const { session } = useSession();
    const pending = useRef(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [estimates, setEstimates] = useState([]);
    const [estimatesLoading, setEstimatesLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            setEstimatesLoading(true);
            getTopicEstimates()
                .then(res => setEstimates(res.estimates ?? []))
                .catch(() => {})
                .finally(() => setEstimatesLoading(false));
        }, [])
    );

    const email = session?.user?.email || 'Student Account';
    const initial = email ? email.charAt(0).toUpperCase() : 'S';
    const username = email.includes('@') ? email.split('@')[0] : email;

    // Derived mastery metrics for the profile summary
    const masteredCount = useMemo(() => {
        return estimates.filter(e => e.eligible && e.accuracy >= 80).length;
    }, [estimates]);

    function confirmSignOut() {
        if (pending.current) return;
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out of your personal reviewer workspace?',
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

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]" edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={{ padding: 18, gap: 20, paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Apple ID Style Hero Card */}
                <View
                    className="overflow-hidden rounded-3xl border border-[#E5E9F0] bg-white p-5 shadow-2xs"
                    style={{ borderCurve: 'continuous' }}
                >
                    <View className="flex-row items-center gap-4">
                        <View
                            className="h-14 w-14 items-center justify-center rounded-2xl bg-[#001428] shadow-xs"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <Text className="font-geist-bold text-xl text-white">
                                {initial}
                            </Text>
                        </View>
                        <View className="flex-1 pr-1">
                            <Text numberOfLines={1} className="font-geist-bold text-lg text-[#001428] tracking-tight">
                                {username}
                            </Text>
                            <Text numberOfLines={1} className="font-geist text-xs text-[#64748B]">
                                {email}
                            </Text>

                            <View className="mt-1.5 flex-row items-center self-start gap-1 rounded-full bg-emerald-50 border border-emerald-100/80 px-2 py-0.5">
                                <IconShieldCheck size={12} color="#059669" />
                                <Text className="font-geist-semibold text-[10px] text-emerald-800">
                                    Personal Preparation Workspace
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Quick Metric Strip (Apple Health / Settings Bento) */}
                    <View className="mt-5 flex-row items-center justify-between border-t border-[#F1F3F6] pt-4">
                        <View className="flex-1 items-center">
                            <Text
                                style={{ fontVariant: ['tabular-nums'] }}
                                className="font-geist-bold text-base text-[#001428]"
                            >
                                {estimates.length}
                            </Text>
                            <Text className="font-geist text-[10px] text-[#64748B] uppercase tracking-wider">
                                Tracked Topics
                            </Text>
                        </View>

                        <View className="h-6 w-[1px] bg-[#E5E9F0]" />

                        <View className="flex-1 items-center">
                            <Text
                                style={{ fontVariant: ['tabular-nums'] }}
                                className="font-geist-bold text-base text-emerald-600"
                            >
                                {masteredCount}
                            </Text>
                            <Text className="font-geist text-[10px] text-[#64748B] uppercase tracking-wider">
                                Mastered
                            </Text>
                        </View>

                        <View className="h-6 w-[1px] bg-[#E5E9F0]" />

                        <View className="flex-1 items-center">
                            <Text className="font-geist-bold text-base text-[#001428]">
                                Active
                            </Text>
                            <Text className="font-geist text-[10px] text-[#64748B] uppercase tracking-wider">
                                Cloud Sync
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Personal Diagnostics Section */}
                <View className="gap-2.5">
                    <Text className="px-1 font-geist-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                        Personal Diagnostics
                    </Text>

                    {/* Performance Report Navigation Row (Apple Inset Grouped) */}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="View personal performance report"
                        onPress={() => router.push('/(main)/report')}
                        className="flex-row items-center justify-between rounded-2xl border border-[#E5E9F0] bg-white p-4 shadow-2xs"
                        style={({ pressed }) => [
                            {
                                borderCurve: 'continuous',
                                transform: [{ scale: pressed ? 0.985 : 1 }],
                                backgroundColor: pressed ? '#F8F9FC' : '#FFFFFF',
                            },
                        ]}
                    >
                        <View className="flex-1 flex-row items-center gap-3.5">
                            <View
                                className="h-10 w-10 items-center justify-center rounded-xl bg-[#001428] shadow-xs"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <IconChartBar size={20} color="#FFFFFF" strokeWidth={2} />
                            </View>
                            <View className="flex-1 pr-2">
                                <Text className="font-geist-bold text-sm text-[#001428]">
                                    Performance Report
                                </Text>
                                <Text className="font-geist text-xs text-[#64748B]">
                                    Mastery curves, strengths & accuracy estimates
                                </Text>
                            </View>
                        </View>
                        <IconChevronRight size={18} color="#94A3B8" />
                    </Pressable>

                    {/* Topic Practice Estimates Card */}
                    <TopicEstimatesCard
                        estimates={estimates}
                        loading={estimatesLoading}
                        limit={4}
                        onViewAllPress={() => router.push('/(main)/report')}
                    />
                </View>

                {/* System & Workspace Specifications (Apple Inset Grouped) */}
                <View className="gap-2.5">
                    <Text className="px-1 font-geist-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                        Workspace & Security
                    </Text>

                    <View
                        className="overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white shadow-2xs divide-y divide-[#F1F3F6]"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-row items-center justify-between p-3.5">
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-lg bg-[#F1F4F8]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconSparkles size={16} color="#001428" strokeWidth={2} />
                                </View>
                                <Text className="font-geist-medium text-xs text-[#001428]">
                                    Reviewer Engine
                                </Text>
                            </View>
                            <Text className="font-geist text-xs text-[#64748B]">
                                v1.0.0 (Native)
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between p-3.5">
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-lg bg-[#F1F4F8]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconLock size={16} color="#001428" strokeWidth={2} />
                                </View>
                                <Text className="font-geist-medium text-xs text-[#001428]">
                                    Security & Storage
                                </Text>
                            </View>
                            <Text className="font-geist text-xs text-[#64748B]">
                                Supabase Auth & DB
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between p-3.5">
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-lg bg-[#F1F4F8]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconCertificate size={16} color="#001428" strokeWidth={2} />
                                </View>
                                <Text className="font-geist-medium text-xs text-[#001428]">
                                    Account Scope
                                </Text>
                            </View>
                            <Text className="font-geist text-xs text-[#64748B]">
                                Candidate Practice
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Account Actions & Sign Out (Apple HIG Inset Action) */}
                <View className="gap-2.5">
                    <Text className="px-1 font-geist-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                        Account
                    </Text>

                    {message ? (
                        <View
                            className="rounded-xl border border-rose-200 bg-rose-50 p-3"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <Text className="font-geist text-xs text-rose-700">{message}</Text>
                        </View>
                    ) : null}

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Sign out of account"
                        disabled={loading}
                        onPress={confirmSignOut}
                        className="flex-row items-center justify-between rounded-2xl border border-rose-200/70 bg-white p-3.5 shadow-2xs"
                        style={({ pressed }) => [
                            {
                                borderCurve: 'continuous',
                                transform: [{ scale: pressed ? 0.985 : 1 }],
                                backgroundColor: pressed ? '#FFF1F2' : '#FFFFFF',
                            },
                        ]}
                    >
                        <View className="flex-row items-center gap-3">
                            <View
                                className="h-8 w-8 items-center justify-center rounded-lg bg-[#FF3B30] shadow-xs"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <IconLogout size={16} color="#FFFFFF" strokeWidth={2} />
                            </View>
                            <Text className="font-geist-semibold text-xs text-[#FF3B30]">
                                Sign Out
                            </Text>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                            <IconChevronRight size={16} color="#F87171" />
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
