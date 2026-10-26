import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconArrowLeft, IconLock } from "@tabler/icons-react-native";
import { router } from "expo-router";
import AuthButton from "@/components/AuthButton";
import FormField from "@/components/FormField";
import { validateSetPassword } from "@/lib/auth";
import { THEME as theme } from "@/lib/theme";

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
    const errors = submitted ? validateSetPassword(password, confirmPassword) : {};

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

    function handleSubmit() {
        setSubmitted(true);
        if (Object.keys(validateSetPassword(password, confirmPassword)).length) {
            setMessage("");
            return;
        }
        Keyboard.dismiss();
        setMessage("Password reset isn't connected yet.");
    }

    function handleBack() {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(auth)/otp");
        }
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
                            onChangeText={(value) => {
                                setConfirmPassword(value);
                                setMessage("");
                            }}
                        />
                        <AuthButton
                            submitLabel="Set password"
                            onSubmit={handleSubmit}
                            message={message}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
