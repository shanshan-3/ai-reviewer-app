import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, AppState, KeyboardAvoidingView, Pressable, Text, View } from 'react-native';
import { useSegments } from 'expo-router';
import Animated, { Easing, FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconX from '@tabler/icons-react-native/IconX';
import { THEME } from '@/lib/theme';

const ToastContext = createContext(null);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export default function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const [tabBarHeight, setTabBarHeight] = useState(0);
    const insets = useSafeAreaInsets();
    const segments = useSegments();
    const showToast = useCallback(message => setToast({ message }), []);
    const context = useMemo(() => ({ showToast, setTabBarHeight }), [showToast]);

    useEffect(() => {
        if (!toast) return;
        let disposed = false;
        let timer;
        let startedAt = null;
        let remaining = 3000;
        let prepared = false;
        let appState = AppState.currentState;

        function pause() {
            clearTimeout(timer);
            if (startedAt !== null) remaining = Math.max(0, remaining - (Date.now() - startedAt));
            startedAt = null;
        }

        function resume() {
            if (disposed || !prepared || appState !== 'active') return;
            startedAt = Date.now();
            timer = setTimeout(() => setToast(current => current === toast ? null : current), remaining);
        }

        const subscription = AppState.addEventListener('change', next => {
            pause();
            appState = next;
            resume();
        });

        async function prepare() {
            const [screenReader, recommended] = await Promise.all([
                AccessibilityInfo.isScreenReaderEnabled().catch(() => false),
                process.env.EXPO_OS === 'android'
                    ? AccessibilityInfo.getRecommendedTimeoutMillis(3000).catch(() => 3000)
                    : Promise.resolve(3000),
            ]);
            if (disposed) return;
            remaining = Math.max(3000, recommended, screenReader ? 6000 : 0);
            prepared = true;
            if (process.env.EXPO_OS === 'ios') {
                AccessibilityInfo.announceForAccessibilityWithOptions(toast.message, { queue: true });
            }
            resume();
        }
        void prepare();
        return () => {
            disposed = true;
            pause();
            subscription.remove();
        };
    }, [toast]);

    return <ToastContext.Provider value={context}>
        <View className="flex-1">
            {children}
            {toast && <KeyboardAvoidingView pointerEvents="box-none" behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
                style={{ position: 'absolute', bottom: Math.max(insets.bottom, segments.includes('(tabs)') ? tabBarHeight : 0) + 16, left: insets.left + 16, right: insets.right + 16, zIndex: 100 }}>
                <Animated.View entering={FadeIn.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.System)}
                    exiting={FadeOut.duration(120).easing(EASE_OUT).reduceMotion(ReduceMotion.System)}
                    className="w-full max-w-[560px] flex-row items-center gap-3 self-center rounded-xl py-2 pl-4 pr-2"
                    style={{ borderCurve: 'continuous', backgroundColor: THEME.successBackground, borderColor: THEME.successBorder, borderWidth: 1, borderLeftColor: THEME.success, borderLeftWidth: 4 }}>
                    <IconCheck size={20} color={THEME.success} accessible={false} />
                    <Text accessibilityLiveRegion="polite" style={{ color: THEME.successForeground }} className="flex-1 font-geist-medium text-sm leading-6">{toast.message}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={() => setToast(null)}
                        className="h-12 w-12 items-center justify-center rounded-lg active:opacity-60 focus:border-2 focus:border-foreground">
                        <IconX size={20} color={THEME.successForeground} accessible={false} />
                    </Pressable>
                </Animated.View>
            </KeyboardAvoidingView>}
        </View>
    </ToastContext.Provider>;
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider.');
    return context.showToast;
}

export function useToastTabBarHeight() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToastTabBarHeight must be used within ToastProvider.');
    return context.setTabBarHeight;
}
