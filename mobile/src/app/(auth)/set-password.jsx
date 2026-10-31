import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconArrowLeft, IconLock } from "@tabler/icons-react-native";
import { router } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import AuthButton from "@/components/AuthButton";
import AuthMessage from "@/components/AuthMessage";
import FormField from "@/components/FormField";
import { validateSetPassword } from "@/lib/auth";
import { THEME as theme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { clearRecoverySession, isRecoverySession } from "@/lib/recovery-session";

export default function SetPasswordPage() {
    const scrollView = useRef(/** @type {ScrollView | null} */(null));
    const passwordInput = useRef(/** @type {TextInput | null} */(null));
    const confirmPasswordInput = useRef(/** @type {TextInput | null} */(null));
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [saved, setSaved] = useState(false);
    const [returnToLogin, setReturnToLogin] = useState(false);
    const pending = useRef(false);
    usePreventRemove(loading, () => {});
    const errors = submitted ? validateSetPassword(password, confirmPassword) : {};

    useEffect(() => {
        let active = true;
        supabase.auth.getSession().then(({ data, error }) => {
            if (!active) return;
            if (error || !isRecoverySession(data.session)) {
                router.replace("/(auth)/verify-email");
                return;
            }
            setReady(true);
        }).catch(() => {
            if (active) setMessage("Could not check your recovery session. Go back and try again.");
        });
        return () => {
            active = false;
            if (clearRecoverySession()) {
                supabase.auth.signOut({ scope: "local" }).then(({ error }) => {
                    if (error) console.warn("Could not clear the recovery session.");
                }).catch(() => console.warn("Could not clear the recovery session."));
            }
        };
    }, []);

    useEffect(() => {
        if (returnToLogin && !loading) router.replace("/(auth)/login");
    }, [returnToLogin, loading]);

    const scrollToFocusedInput = useCallback(() => {
        const input = TextInput.State.currentlyFocusedInput();
        if (
            input && Keyboard.isVisible() &&
            [passwordInput.current, confirmPasswordInput.current].some(field => field === input)
        ) {
            scrollView.current?.scrollResponderScrollNativeHandleToKeyboard(input, 24, true);
        }
    }, []);

    useEffect(() => {
        const shown = Keyboard.addListener("keyboardDidShow", scrollToFocusedInput);
        return () => shown.remove();
    }, [scrollToFocusedInput]);

    async function handleSubmit() {
        if (pending.current || !ready) return;
        setSubmitted(true);
        setMessage("");
        if (!saved && Object.keys(validateSetPassword(password, confirmPassword)).length) return;
        Keyboard.dismiss();
        pending.current = true;
        setLoading(true);
        let passwordSaved = saved;
        try {
            if (!passwordSaved) {
                const { data, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                if (!isRecoverySession(data.session)) {
                    clearRecoverySession();
                    setMessage("Your recovery session ended. Request a new code.");
                    setReady(false);
                    return;
                }
                const { error } = await supabase.auth.updateUser({ password });
                if (error) throw error;
                passwordSaved = true;
                setSaved(true);
                setPassword("");
                setConfirmPassword("");
                setSubmitted(false);
            }
            const { error } = await supabase.auth.signOut({ scope: "local" });
            if (error) throw error;
            clearRecoverySession();
            setReturnToLogin(true);
        } catch (error) {
            setMessage(passwordSaved
                ? "Password updated. Could not sign out. Tap Return to sign in to retry."
                : error instanceof Error ? error.message : "Could not save your password. Check your connection and try again.");
        } finally {
            pending.current = false;
            setLoading(false);
        }
    }

    function handleBack() {
        if (!pending.current) router.replace("/(auth)/verify-email");
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView behavior="padding" className="flex-1">
                <ScrollView
                    ref={scrollView}
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 32 }}
                    keyboardShouldPersistTaps="handled"
                    onLayout={scrollToFocusedInput}
                    onContentSizeChange={scrollToFocusedInput}
                >
                    <View className="w-full max-w-sm self-center">
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            onPress={handleBack}
                            className="min-h-12 min-w-12 self-start items-center justify-center rounded-lg active:opacity-70 focus:bg-secondary"
                        >
                            <IconArrowLeft
                                size={24}
                                color={theme.foreground}
                                accessible={false}
                                accessibilityElementsHidden
                                importantForAccessibility="no-hide-descendants"
                            />
                        </Pressable>
                        <Image
                            source={require("../../../assets/illustrations/create-password.png")}
                            accessible={false}
                            className="mb-6 mt-2 self-center"
                            style={{ width: "100%", maxWidth: 300, height: 200 }}
                            resizeMode="contain"
                        />
                        <Text
                            accessibilityRole="header"
                            className="font-geist-bold text-center text-3xl leading-9 text-foreground"
                        >
                            Set new password
                        </Text>
                        <Text className="font-geist mt-3 text-center text-sm leading-5 text-foreground">
                            Enter a new password and confirm it below.
                        </Text>
                        <FormField
                            ref={passwordInput}
                            containerClassName="mt-8"
                            label="New Password"
                            labelId="new-password-label"
                            icon={IconLock}
                            error={errors.password}
                            isPassword
                            showPassword={showPassword}
                            onTogglePassword={() => setShowPassword(!showPassword)}
                            onFocus={scrollToFocusedInput}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            textContentType="newPassword"
                            autoCorrect={false}
                            returnKeyType="next"
                            submitBehavior="submit"
                            onSubmitEditing={() => confirmPasswordInput.current?.focus()}
                            placeholder="Enter your new password"
                            value={password}
                            editable={!loading && !saved}
                            onChangeText={(value) => {
                                setPassword(value);
                                setMessage("");
                            }}
                        />
                        <FormField
                            ref={confirmPasswordInput}
                            containerClassName="mt-5"
                            label="Confirm Password"
                            labelId="confirm-password-label"
                            icon={IconLock}
                            error={errors.confirmPassword}
                            isPassword
                            showPassword={showConfirmPassword}
                            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                            onFocus={scrollToFocusedInput}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            textContentType="newPassword"
                            autoCorrect={false}
                            returnKeyType="done"
                            submitBehavior="submit"
                            onSubmitEditing={handleSubmit}
                            placeholder="Re-enter your new password"
                            value={confirmPassword}
                            editable={!loading && !saved}
                            onChangeText={(value) => {
                                setConfirmPassword(value);
                                setMessage("");
                            }}
                        />
                        <View className="mt-auto w-full max-w-sm self-center">
                            <AuthMessage message={message} isError />
                            <AuthButton
                                submitLabel={loading ? "Please wait..." : saved ? "Return to sign in" : "Set password"}
                                onSubmit={handleSubmit}
                                disabled={loading || !ready}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
