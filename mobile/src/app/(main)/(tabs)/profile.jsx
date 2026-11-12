import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import ProgressSummary from '@/components/progress-summary';
import { getUserStreak } from '@/lib/progress';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import IconUser from '@tabler/icons-react-native/IconUser';
import IconShieldCheck from '@tabler/icons-react-native/IconShieldCheck';

export default function ProfilePage() {
    const { session } = useSession();
    const pending = useRef(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [streak, setStreak] = useState(null);

    useFocusEffect(
        useCallback(() => {
            getUserStreak()
                .then(res => setStreak(res.streak ?? null))
                .catch(() => {});
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
                    <ProgressSummary streak={streak || {}} />
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
