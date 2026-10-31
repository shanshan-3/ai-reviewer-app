import { useEffect, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconArrowLeft } from "@tabler/icons-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import AuthButton from "@/components/AuthButton";
import AuthMessage from "@/components/AuthMessage";
import { validateEmail, validateOtp } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { markRecoverySession } from "@/lib/recovery-session";
import { THEME as theme } from "@/lib/theme";

export default function OTPPage() {
    const params = useLocalSearchParams();
    const email = typeof params.email === "string" ? params.email.trim() : "";
    const validEmail = !Object.keys(validateEmail(email)).length;
    const pending = useRef(false);
    const [loading, setLoading] = useState(false);
    const [messageIsError, setMessageIsError] = useState(false);
    usePreventRemove(loading, () => {});
    const inputs = useRef(/** @type {(TextInput | null)[]} */([]));
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const resendAvailableAt = useRef(0);
    const [resendSeconds, setResendSeconds] = useState(60);
    const cooldownActive = resendSeconds > 0;
    const resendDisabled = cooldownActive || loading || !validEmail;
    const code = digits.join("");
    const errors = submitted ? validateOtp(code) : {};

    useEffect(() => {
        if (!validEmail) router.replace("/(auth)/verify-email");
    }, [validEmail]);

    useEffect(() => {
        if (!cooldownActive) return;
        if (!resendAvailableAt.current) resendAvailableAt.current = Date.now() + 60000;
        const interval = setInterval(() => {
            setResendSeconds(Math.max(0, Math.ceil((resendAvailableAt.current - Date.now()) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldownActive]);

    async function handleResend() {
        if (pending.current || !validEmail || Date.now() < resendAvailableAt.current) return;
        pending.current = true;
        setLoading(true);
        setMessage("");
        setMessageIsError(false);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
                setMessageIsError(true);
                setMessage(error.message);
                return;
            }
            resendAvailableAt.current = Date.now() + 60000;
            setResendSeconds(60);
            setDigits(["", "", "", "", "", ""]);
            setSubmitted(false);
            setMessage("A new code was requested. Check your email.");
        } catch {
            setMessageIsError(true);
            setMessage("Could not resend the code. Check your connection and try again.");
        } finally {
            pending.current = false;
            setLoading(false);
        }
    }

    function handleChange(value, index) {
        const numbers = value.replace(/\D/g, "").slice(0, 6 - index);
        if (value && !numbers) return;

        setDigits((current) => {
            const next = [...current];
            if (!numbers) {
                next[index] = "";
            } else {
                [...numbers].forEach((digit, offset) => {
                    next[index + offset] = digit;
                });
            }
            return next;
        });
        setMessage("");
        if (numbers) inputs.current[Math.min(index + numbers.length, 5)]?.focus();
    }

    function handleBackspace(key, index) {
        if (key !== "Backspace" || digits[index] || index === 0) return;
        setDigits((current) => current.map((digit, offset) => offset === index - 1 ? "" : digit));
        setMessage("");
        inputs.current[index - 1]?.focus();
    }

    async function handleSubmit() {
        if (pending.current || !validEmail) return;
        setSubmitted(true);
        setMessage("");
        if (Object.keys(validateOtp(code)).length) {
            setMessage("");
            return;
        }
        Keyboard.dismiss();
        pending.current = true;
        setLoading(true);
        setMessageIsError(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "recovery" });
            if (error) {
                setMessage(error.message);
                return;
            }
            if (!data.session?.user?.id) {
                setMessage("Could not verify recovery. Request a new code.");
                return;
            }
            markRecoverySession(data.session);
            router.push("/(auth)/set-password");
        } catch {
            setMessage("Could not verify the code. Check your connection and try again.");
        } finally {
            pending.current = false;
            setLoading(false);
        }
    }

    function handleBack() {
        if (pending.current) return;
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(auth)/verify-email");
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView behavior="padding" className="flex-1">
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 32 }}
                    keyboardShouldPersistTaps="handled"
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
                            source={require("../../../assets/illustrations/otp.png")}
                            accessible={false}
                            className="mb-6 mt-2 self-center"
                            style={{ width: "100%", maxWidth: 300, height: 200 }}
                            resizeMode="contain"
                        />
                        <Text
                            accessibilityRole="header"
                            className="font-geist-bold text-center text-3xl leading-9 text-foreground"
                        >
                            Verify account
                        </Text>
                        <Text className="font-geist mt-3 text-center text-sm leading-5 text-foreground">
                            Enter the six-digit code sent to your email to verify.
                        </Text>
                        <View className="mt-8 gap-2">
                            <Text className="font-geist-medium text-base text-foreground">
                                Verification code
                            </Text>
                            <View className="flex-row gap-2">
                                {digits.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(input) => { inputs.current[index] = input; }}
                                        accessibilityLabel={`Verification code, digit ${index + 1} of 6`}
                                        autoCapitalize="none"
                                        autoComplete={index === 0 ? "one-time-code" : "off"}
                                        textContentType={index === 0 ? "oneTimeCode" : "none"}
                                        autoCorrect={false}
                                        inputMode="numeric"
                                        keyboardType="number-pad"
                                        returnKeyType={index === 5 ? "done" : "next"}
                                        submitBehavior="submit"
                                        selectTextOnFocus
                                        selectionColor="rgba(10, 10, 10, 0.2)"
                                        cursorColor={theme.foreground}
                                        selectionHandleColor={theme.foreground}
                                        className={`font-geist min-h-16 min-w-0 flex-1 rounded-lg border px-0 py-3 text-center text-2xl text-foreground focus:border-foreground ${errors.code ? "border-destructive" : "border-muted-foreground"}`}
                                        value={digit}
                                        editable={!loading}
                                        onChangeText={(value) => handleChange(value, index)}
                                        onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, index)}
                                        onSubmitEditing={() => {
                                            if (index === 5) handleSubmit();
                                            else inputs.current[index + 1]?.focus();
                                        }}
                                    />
                                ))}
                            </View>
                            {errors.code ? (
                                <Text accessibilityLiveRegion="polite" className="font-geist text-sm text-destructive">
                                    {errors.code}
                                </Text>
                            ) : null}
                        </View>
                        <View className="mt-auto w-full max-w-sm self-center">
                            <AuthMessage message={message} isError={messageIsError} />
                            <AuthButton
                                submitLabel={loading ? "Please wait..." : "Verify code"}
                                onSubmit={handleSubmit}
                                disabled={loading || !validEmail}
                            >
                                <View className="mt-4 flex-row flex-wrap items-center justify-center gap-x-1">
                                    <Text className="font-geist text-sm text-foreground">
                                        Didn&apos;t receive a code?
                                    </Text>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={resendDisabled ? `Resend code in ${resendSeconds} seconds` : "Resend code"}
                                        accessibilityState={{ disabled: resendDisabled }}
                                        disabled={resendDisabled}
                                        onPress={handleResend}
                                        className="min-h-12 min-w-12 justify-center rounded-lg px-1 active:opacity-70 focus:bg-secondary"
                                    >
                                        <Text className={`font-geist-medium text-sm ${resendDisabled ? "text-muted-foreground" : "text-foreground underline"}`}>
                                            {resendDisabled ? `Resend in ${resendSeconds}s` : "Resend now"}
                                        </Text>
                                    </Pressable>
                                </View>
                            </AuthButton>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
