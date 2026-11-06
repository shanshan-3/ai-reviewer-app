import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/providers/session-provider';
import ToastProvider from '@/providers/toast-provider';

export default function MainLayout() {
    const { session, loading, isRecovery } = useSession();

    if (loading) return null;

    if (!session) {
        return <Redirect href="/(auth)/login" />;
    }

    if (isRecovery) {
        return <Redirect href="/(auth)/set-password" />;
    }

    return (
        <ToastProvider key={session.user.id}>
            <Stack screenOptions={{ headerShown: false }} >
                <Stack.Screen name="(tabs)" />
            </Stack>
        </ToastProvider>
    );
}
