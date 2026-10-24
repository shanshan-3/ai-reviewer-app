import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

/** @param {{ children: import('react').ReactNode }} props */
export default function StartupSplash({ children }) {
  const [complete, setComplete] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const [imageState, setImageState] = useState('loading');
  const [reduceMotion, setReduceMotion] = useState(/** @type {boolean | null} */ (null));
  const [opacity] = useState(() => new Animated.Value(1));
  const [scale] = useState(() => new Animated.Value(0.8));

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
    /** @type {import('react-native').Animated.CompositeAnimation | undefined} */
    let animation;

    async function start() {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('Could not hide the native splash screen.', error);
      }
      if (cancelled) return;
      if (reduceMotion || imageState === 'error') {
        setComplete(true);
        return;
      }

      animation = Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.97, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1, duration: 150, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]);
      animation.start(({ finished }) => {
        if (finished && !cancelled) setComplete(true);
      });
    }

    start();
    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [complete, imageState, laidOut, opacity, reduceMotion, scale]);

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
          style={[styles.overlay, { opacity }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        >
          <StatusBar style="dark" />
          <Animated.Image
            source={require('../../assets/logo/logo-with-name-transparent.png')}
            style={[styles.logo, { transform: [{ scale }] }]}
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
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F8F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '75%',
    maxWidth: 240,
    aspectRatio: 1585 / 992,
  },
});
