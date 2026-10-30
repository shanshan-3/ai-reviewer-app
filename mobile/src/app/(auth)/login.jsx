import { useEffect, useRef, useState } from "react";
import {
    Keyboard,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconCheck, IconLock, IconMail } from "@tabler/icons-react-native";
import { THEME as theme } from "@/lib/theme";
import { validateLogin } from "@/lib/auth";
import { router } from "expo-router";
import FormField from "@/components/FormField";
import AuthButton from "@/components/AuthButton";
import AuthMessage from "@/components/AuthMessage";
import { authStorage, supabase } from "@/lib/supabase";

export default function LoginPage() {
    const passwordInput = useRef(/** @type {import('react-native').TextInput | null} */(null));
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const [messageIsError, setMessageIsError] = useState(false);
    const [invalidCredentials, setInvalidCredentials] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());
    const errors = submitted ? validateLogin(email, password) : {};
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        Promise.all([supabase.auth.getSession(), authStorage.getRememberMe()])
            .then(([{ data, error }, remember]) => {
                if (!mounted) return;
                setRememberMe(remember);
                if (error) {
                    setMessageIsError(true);
                    setMessage(error.message);
                } else if (data.session) {
                    setMessageIsError(false);
                    setMessage('You are already signed in.');
                }
            })
            .catch(() => {
                if (mounted) {
                    setMessageIsError(true);
                    setMessage('Could not restore your session. Try signing in again.');
                }
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        const shown = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
        const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
        return () => {
            shown.remove();
            hidden.remove();
        };
    }, []);

    async function handleSubmit() {
        if (loading) return;

        setSubmitted(true);
        setMessage('');
        setMessageIsError(false);
        setInvalidCredentials(false);

        if (Object.keys(validateLogin(email, password)).length) return;

        Keyboard.dismiss();
        setLoading(true);

        try {
            await authStorage.setRememberMe(rememberMe);
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                setMessageIsError(true);
                setInvalidCredentials(error.code === 'invalid_credentials');
                setMessage(error.message);
                return;
            }

            setMessage('Signed in successfully.');
        } catch {
            setMessageIsError(true);
            setMessage('Could not sign in. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }
    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1">
                <ScrollView
                    className="flex-1"
                    scrollEnabled={!(inputFocused && keyboardVisible)}
                    contentContainerStyle={{
                        flexGrow: 1,
                        padding: 24,
                        paddingTop: 32,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="w-full max-w-sm self-center">
                        <Image
                            source={require("../../../assets/logo/logo-symbol-transparent.png")}
                            className="self-center mb-8"
                            style={{ width: 100, height: 50 }}
                            resizeMode="contain"
                        />
                        <Text
                            accessibilityRole="header"
                            className="font-geist-bold text-3xl leading-9 text-foreground"
                        >
                            Welcome back
                        </Text>
                        <Text
                            className="font-geist mt-3 text-base leading-6 text-muted-foreground"
                        >
                            Sign in to continue to your workspace and pick up where you left off.
                        </Text>

                        <FormField
                            containerClassName="mt-6"
                            label="Email address"
                            labelId="email-label"
                            icon={IconMail}
                            error={errors.email}
                            invalid={invalidCredentials}
                            accessibilityHint={invalidCredentials ? "Check your email and password." : undefined}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect={false}
                            keyboardType="email-address"
                            returnKeyType="next"
                            submitBehavior="submit"
                            onSubmitEditing={() => passwordInput.current?.focus()}
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={(value) => {
                                setEmail(value);
                                setMessage("");
                                setInvalidCredentials(false);
                            }}
                        />

                        <FormField
                            ref={passwordInput}
                            containerClassName="mt-5"
                            label="Password"
                            labelId="password-label"
                            icon={IconLock}
                            error={errors.password}
                            invalid={invalidCredentials}
                            accessibilityHint={invalidCredentials ? "Check your email and password." : undefined}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            isPassword
                            showPassword={showPassword}
                            onTogglePassword={() => setShowPassword(!showPassword)}
                            autoCapitalize="none"
                            autoComplete="current-password"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={(value) => {
                                setPassword(value);
                                setMessage("");
                                setInvalidCredentials(false);
                            }}
                        />

                        <View className="mt-3 flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
                            <Pressable
                                accessibilityRole="checkbox"
                                accessibilityLabel="Remember me"
                                accessibilityState={{ checked: rememberMe, disabled: loading }}
                                disabled={loading}
                                onPress={() => setRememberMe(!rememberMe)}
                                className="min-h-12 max-w-full flex-row items-center gap-2 rounded-lg border-2 border-transparent px-1 active:opacity-70 focus:border-foreground"
                            >
                                <View
                                    accessibilityElementsHidden
                                    importantForAccessibility="no-hide-descendants"
                                    className={`h-5 w-5 items-center justify-center rounded border ${rememberMe ? "border-primary bg-primary" : "border-muted-foreground"}`}
                                >
                                    {rememberMe ? (
                                        <IconCheck size={14} color={theme.primaryForeground} />
                                    ) : null}
                                </View>
                                <Text className="font-geist shrink text-sm text-foreground">
                                    Remember me
                                </Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole="link"
                                onPress={() => router.push("/(auth)/verify-email")}
                                className="min-h-12 max-w-full justify-center rounded-lg border-2 border-transparent px-1 active:opacity-70 focus:border-foreground"
                            >
                                <Text className="font-geist-medium text-sm text-foreground underline">
                                    Forgot password?
                                </Text>
                            </Pressable>
                        </View>

                    </View>
                    <View className="mt-auto w-full max-w-sm self-center">
                        <AuthMessage message={message} isError={messageIsError} />
                        <AuthButton
                            submitLabel={loading ? "Signing in..." : "Sign in"}
                            onSubmit={handleSubmit}
                            disabled={loading}
                        >
                            <Pressable
                                accessibilityRole="link"
                                onPress={() => router.push("/(auth)/register")}
                                className="mt-6 min-h-12 items-center justify-center rounded-lg border-2 border-transparent px-1 active:opacity-70 focus:border-foreground"
                            >
                                <Text className="font-geist text-center text-sm text-muted-foreground">
                                    Need an account?{" "}
                                    <Text className="font-geist-semibold text-foreground underline">
                                        Create a new one
                                    </Text>
                                </Text>
                            </Pressable>
                        </AuthButton>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
