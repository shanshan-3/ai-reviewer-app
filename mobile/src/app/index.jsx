import { Redirect } from 'expo-router';
import { useSession } from '@/providers/session-provider';

export default function Index() {
  const { session, loading, isRecovery } = useSession();

  if (loading) return null;

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isRecovery) {
    return <Redirect href="/(auth)/set-password" />;
  }

  return <Redirect href="/(main)/(tabs)/dashboard" />;

}
