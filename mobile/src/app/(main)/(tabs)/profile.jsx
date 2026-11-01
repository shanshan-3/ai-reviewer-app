import { useRef, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export default function ProfilePage() {
    const { session } = useSession();
    const pending = useRef(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

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
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
                <Text className="font-geist text-base text-foreground">
                    {session?.user.email}
                </Text>

                <AuthMessage message={message} isError />

                <AuthButton
                    submitLabel={loading ? 'Signing out...' : 'Sign out'}
                    onSubmit={handleSignOut}
                    disabled={loading}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
