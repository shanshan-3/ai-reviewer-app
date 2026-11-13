import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import ProgressSummary from '@/components/progress-summary';
import TopicEstimatesCard from '@/components/topic-estimates-card';
import { getUserStreak, getTopicEstimates } from '@/lib/progress';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import IconUser from '@tabler/icons-react-native/IconUser';
import IconShieldCheck from '@tabler/icons-react-native/IconShieldCheck';
import IconChartBar from '@tabler/icons-react-native/IconChartBar';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';

export default function ProfilePage() {
    const { session } = useSession();
    const pending = useRef(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [streak, setStreak] = useState(null);
    const [estimates, setEstimates] = useState([]);
    const [estimatesLoading, setEstimatesLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            getUserStreak()
                .then(res => setStreak(res.streak ?? null))
                .catch(() => {});

            setEstimatesLoading(true);
            getTopicEstimates()
                .then(res => setEstimates(res.estimates ?? []))
                .catch(() => {})
                .finally(() => setEstimatesLoading(false));
        }, [])
    );

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
        <SafeAreaView className="flex-1 bg-[#F8F8FF]" edges={['left', 'right']}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 20, paddingBottom: 40 }}>
                {/* Account Details Card */}
                <View
                    className="overflow-hidden rounded-2xl border border-[#E4E8EE] bg-white p-4 shadow-2xs"
                    style={{ borderCurve: 'continuous' }}
                >
                    <View className="flex-row items-center gap-3">
                        <View
                            className="h-12 w-12 items-center justify-center rounded-2xl border border-[#E4E8EE] bg-[#F1F4F8]"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <IconUser size={24} color="#001428" />
                        </View>
                        <View className="flex-1">
                            <Text numberOfLines={1} className="font-geist-bold text-base text-[#001428]">
                                {session?.user.email}
                            </Text>
                            <View className="mt-0.5 flex-row items-center gap-1">
                                <IconShieldCheck size={13} color="#059669" />
                                <Text className="font-geist text-xs text-[#526071]">
                                    Personal Preparation Workspace
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Study Streak & Activity Card */}
                <View className="gap-2">
                    <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                        Study Streak & Activity
                    </Text>
                    <ProgressSummary
                        streak={streak || {}}
                        onPress={() => router.push('/(main)/report')}
                    />
                </View>

                {/* Topic Practice Estimates Section */}
                <View className="gap-2">
                    <TopicEstimatesCard
                        estimates={estimates}
                        loading={estimatesLoading}
                        limit={4}
                        onViewAllPress={() => router.push('/(main)/report')}
                    />
                </View>

                {/* Personal Performance Report Link */}
                <View className="gap-2">
                    <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                        Personal Diagnostics
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="View personal performance report"
                        onPress={() => router.push('/(main)/report')}
                        className="flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white p-4 shadow-2xs active:opacity-85"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-row items-center gap-3">
                            <View
                                className="h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <IconChartBar size={20} color="#2563EB" />
                            </View>
                            <View>
                                <Text className="font-geist-bold text-sm text-[#001428]">
                                    Personal Performance Report
                                </Text>
                                <Text className="font-geist text-xs text-[#526071]">
                                    Topic mastery, strengths, and accuracy estimates
                                </Text>
                            </View>
                        </View>
                        <IconChevronRight size={18} color="#94A3B8" />
                    </Pressable>
                </View>

                {/* Account Management & Sign Out */}
                <View className="mt-4 gap-3">
                    <AuthMessage message={message} isError />
                    <AuthButton
                        submitLabel={loading ? 'Signing out...' : 'Sign out'}
                        onSubmit={handleSignOut}
                        disabled={loading}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
