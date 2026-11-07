import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useSession } from '@/providers/session-provider';
import { THEME } from '@/lib/theme';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** @param {{ children: import('react').ReactNode }} props */
export default function StartupSplash({ children }) {
  const { loading } = useSession();
  const [complete, setComplete] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const [imageState, setImageState] = useState('loading');
  const [reduceMotion, setReduceMotion] = useState(/** @type {boolean | null} */ (null));
  const opacity = useSharedValue(1);
  const reveal = useSharedValue(0);
  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: reveal.get(),
    transform: reduceMotion ? [] : [
      { translateY: (1 - reveal.get()) * 8 - (1 - opacity.get()) * 4 },
      { scale: 0.94 + reveal.get() * 0.06 + (1 - opacity.get()) * 0.02 },
    ],
  }));

  useEffect(() => {
    let cancelled = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) setReduceMotion((current) => current ?? enabled);
      })
      .catch(() => {
        if (!cancelled) setReduceMotion((current) => current ?? true);
      });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (complete || !laidOut || imageState === 'loading' || reduceMotion === null) return;

    let cancelled = false;
    function finishReveal() {
      if (!cancelled) setRevealed(true);
    }

    async function start() {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('Could not hide the native splash screen.', error);
      }
      if (cancelled) return;
      if (reduceMotion || imageState === 'error') {
        reveal.set(1);
        finishReveal();
        return;
      }

      reveal.set(withTiming(1, {
        duration: 520,
        easing: EASE_OUT,
        reduceMotion: ReduceMotion.System,
      }, (finished) => {
        if (finished) scheduleOnRN(finishReveal);
      }));
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimation(reveal);
    };
  }, [complete, imageState, laidOut, reduceMotion, reveal]);

  useEffect(() => {
    if (complete || !revealed || loading) return;

    let cancelled = false;
    function finish() {
      if (!cancelled) setComplete(true);
    }
    opacity.set(withTiming(0, {
      duration: reduceMotion || imageState === 'error' ? 0 : 260,
      easing: EASE_OUT,
      reduceMotion: ReduceMotion.System,
    }, (finished) => {
      if (finished) scheduleOnRN(finish);
    }));
    return () => {
      cancelled = true;
      cancelAnimation(opacity);
    };
  }, [complete, imageState, loading, opacity, reduceMotion, revealed]);

  return (
    <View style={styles.container}>
      <View
        style={styles.container}
        onLayout={() => setLaidOut(true)}
        pointerEvents={complete ? 'auto' : 'none'}
        accessibilityElementsHidden={!complete}
        importantForAccessibility={complete ? 'auto' : 'no-hide-descendants'}
        aria-hidden={!complete}
      >
        {children}
      </View>
      {!complete && (
        <Animated.View
          style={[styles.overlay, overlayStyle]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        >
          <StatusBar style="dark" />
          <Animated.Image
            source={require('../../assets/logo/logo-with-name-transparent.png')}
            style={[styles.logo, logoStyle]}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() => setImageState('ready')}
            onError={() => setImageState('error')}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '75%',
    maxWidth: 240,
    aspectRatio: 1585 / 992,
  },
});
