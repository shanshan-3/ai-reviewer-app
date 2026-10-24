import '../../global.css';

import { useEffect } from 'react';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
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
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    if (fontError) console.warn('Could not load Poppins. Using system fonts.', fontError);
  }, [fontError]);

  if (!fontsLoaded && !fontError) return null;

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
