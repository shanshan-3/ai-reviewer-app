import { useEffect, useRef, useState } from "react";
import {
    Keyboard,
    Image,
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconArrowLeft } from "@tabler/icons-react-native";
import { router } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { validateEmail } from "@/lib/auth";
import FormField from "@/components/FormField";
import AuthButton from "@/components/AuthButton";
import AuthMessage from "@/components/AuthMessage";
import { supabase } from "@/lib/supabase";

export default function VerifyEmailPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const sending = useRef(false);
    usePreventRemove(loading, () => {});
    const [emailFocused, setEmailFocused] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());
    const { fontScale } = useWindowDimensions();
    const errors = submitted ? validateEmail(email) : {};

    useEffect(() => {
        const shown = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
        const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
        return () => {
            shown.remove();
            hidden.remove();
        };
    }, []);

    async function handleSubmit() {
        if (sending.current) return;

        setSubmitted(true);
        setMessage("");
        if (Object.keys(validateEmail(email)).length) return;

        Keyboard.dismiss();
        sending.current = true;
        setLoading(true);
        const recoveryEmail = email.trim();

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail);
            if (error) {
                setMessage(error.message);
                return;
            }

            router.push({
                pathname: "/(auth)/otp",
                params: { email: recoveryEmail },
            });
        } catch {
            setMessage("Could not send the code. Check your connection and try again.");
        } finally {
            sending.current = false;
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1">
                <ScrollView
                    className="flex-1"
                    scrollEnabled={!(emailFocused && keyboardVisible)}
                    contentContainerStyle={{
                        flexGrow: 1,
                        padding: 24,
                        paddingTop: 32,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="w-full max-w-sm self-center">
                        <Pressable
                            className="min-h-12 min-w-12 self-start justify-center rounded-lg active:opacity-70 focus:bg-secondary"
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            onPress={() => { if (!sending.current) router.back(); }}
                        >
                            <IconArrowLeft
                                style={{ minHeight: 24 * fontScale, minWidth: 24 * fontScale }}
                                size={24}
                            />
                        </Pressable>
                        <Image
                            source={require("../../../assets/illustrations/verify-email.png")}
                            className="mb-6 mt-2 self-center"
                            style={{ width: "100%", maxWidth: 300, height: 180 }}
                            resizeMode="contain"
                        />
                        <Text
                            accessibilityRole="header"
                            className="font-geist-bold text-center text-3xl leading-9 text-foreground"
                        >
                            Forgot your password?
                        </Text>
                        <Text className="font-geist mt-3 text-center text-sm leading-5 text-foreground">
                            Enter your email to reset your account password.
                        </Text>

                        <FormField
                            containerClassName="mt-6 mb-2"
                            label="Email address"
                            labelId="email-label"
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            error = {errors.email}
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect={false}
                            keyboardType="email-address"
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={(value) => {
                                setEmail(value);
                                setMessage("");
                            }}
                        />
                        <View className="mt-auto w-full max-w-sm self-center">
                            <AuthMessage message={message} isError />
                            <AuthButton
                                submitLabel={loading ? "Sending..." : "Send code"}
                                onSubmit={handleSubmit}
                                disabled={loading}
                            />
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
