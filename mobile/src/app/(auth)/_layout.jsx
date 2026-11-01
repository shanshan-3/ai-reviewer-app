import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/providers/session-provider';

export default function AuthLayout() {
    const { session, loading, isRecovery } = useSession();

    if (loading) return null;

    if (session && !isRecovery) {
        return <Redirect href="/(main)/(tabs)/dashboard" />;
    }

    return (
        <Stack
            initialRouteName="login"
            screenOptions={{ headerShown: false }}
        />
    );
}