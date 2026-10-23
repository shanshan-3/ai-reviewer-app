import '../../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import StartupSplash from '@/components/StartupSplash';
import { NAV_THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Could not hold the native splash screen.', error);
});

export default function RootLayout() {
  return (
    <ThemeProvider value={NAV_THEME}>
      <StatusBar style="dark" />
      <StartupSplash>
        <Stack screenOptions={{ headerShown: false }} />
        <PortalHost />
      </StartupSplash>
    </ThemeProvider>
    
  );
}
