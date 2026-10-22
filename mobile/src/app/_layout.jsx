import '../../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';
import StartupSplash from '@/components/StartupSplash';
import { NAV_THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Could not hold the native splash screen.', error);
});

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  return (
    <ThemeProvider value={NAV_THEME[scheme]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <StartupSplash>
        <Stack screenOptions={{ headerShown: false }} />
        <PortalHost />
      </StartupSplash>
    </ThemeProvider>
    
  );
}
