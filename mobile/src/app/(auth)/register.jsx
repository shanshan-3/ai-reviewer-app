import { useCallback, useEffect, useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { IconLock, IconMail, IconUser, IconArrowLeft } from "@tabler/icons-react-native";
import { validateRegister } from "@/lib/auth";
import FormField from "@/components/FormField";
import PasswordStrength from "@/components/PasswordStrength";
import AuthButton from "@/components/AuthButton";

export default function RegisterPage() {
    const { fontScale } = useWindowDimensions();
    const scrollView = useRef(/** @type {ScrollView | null} */(null));
    const fullNameInput = useRef(/** @type {TextInput | null} */(null));
    const emailInput = useRef(/** @type {TextInput | null} */(null));
    const passwordInput = useRef(/** @type {TextInput | null} */(null));
    const passwordSection = useRef(/** @type {View | null} */(null));
    const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const errors = submitted ? validateRegister(fullName, email, password) : {};

    const scrollToFocusedInput = useCallback(() => {
        const input = TextInput.State.currentlyFocusedInput();
        if (
            input &&
            Keyboard.isVisible() &&
            [fullNameInput.current, emailInput.current, passwordInput.current].some(field => field === input)
        ) {
            const target = input === passwordInput.current ? passwordSection.current : input;
            if (target) {
                scrollView.current?.scrollResponderScrollNativeHandleToKeyboard(target, 24, true);
            }
        }
    }, []);

    useEffect(() => {
        const shown = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true);
            scrollToFocusedInput();
        });
        const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
        return () => {
            shown.remove();
            hidden.remove();
        };
    }, [scrollToFocusedInput]);

    function handleInputFocus() {
        setPasswordFocused(TextInput.State.currentlyFocusedInput() === passwordInput.current);
        scrollToFocusedInput();
    }

    function handleSubmit() {
        setSubmitted(true);
        if (Object.keys(validateRegister(fullName, email, password)).length) {
            setMessage("");
            return;
        }

        Keyboard.dismiss();
        setMessage("Registration isn't connected yet.");
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                className="flex-1"
                behavior="padding"
            >
                <ScrollView
                    ref={scrollView}
                    className="flex-1"
                    scrollEnabled={!(passwordFocused && keyboardVisible)}
                    onLayout={scrollToFocusedInput}
                    onContentSizeChange={scrollToFocusedInput}
                    contentContainerStyle={{
                        flexGrow: 1,
                        padding: 24,
                        paddingTop: 32,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="w-full max-w-sm self-center">

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            onPress={() => router.back()}
                        >
                            <IconArrowLeft
                                style={{ minHeight: 24 * fontScale, minWidth: 24 * fontScale }}
                                size={24}
                            />
                        </Pressable>

                        <Text
                            accessibilityRole="header"
                            className="font-geist-bold mt-4 text-3xl leading-9 text-foreground"
                        >
                            Create your account
                        </Text>
                        <Text
                            className="font-geist mt-3 text-base leading-6 text-muted-foreground"
                        >
                            Set up your profile to start reviewing, practicing, and tracking your progress.
                        </Text>

                        <FormField
                            ref={fullNameInput}
                            containerClassName="mt-6"
                            label="Full Name"
                            labelId="full-name-label"
                            icon={IconUser}
                            error={errors.fullName}
                            onFocus={handleInputFocus}
                            autoCapitalize="words"
                            autoComplete="name"
                            autoCorrect={false}
                            returnKeyType="next"
                            submitBehavior="submit"
                            onSubmitEditing={() => emailInput.current?.focus()}
                            placeholder="Enter your full name"
                            value={fullName}
                            onChangeText={(value) => {
                                setFullName(value);
                                setMessage("");
                            }}
                        />

                        <FormField
                            ref={emailInput}
                            containerClassName="mt-5"
                            label="Email"
                            labelId="email-label"
                            icon={IconMail}
                            error={errors.email}
                            onFocus={handleInputFocus}
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect={false}
                            keyboardType="email-address"
                            returnKeyType="next"
                            submitBehavior="submit"
                            onSubmitEditing={() => passwordInput.current?.focus()}
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={(value) => {
                                setEmail(value);
                                setMessage("");
                            }}
                        />

                        <View
                            ref={passwordSection}
                            collapsable={false}
                            onLayout={scrollToFocusedInput}
                        >
                            <FormField
                                ref={passwordInput}
                                containerClassName="mt-5"
                                label="Password"
                                labelId="password-label"
                                icon={IconLock}
                                error={errors.password}
                                isPassword
                                showPassword={showPassword}
                                onTogglePassword={() => setShowPassword(!showPassword)}
                                onFocus={handleInputFocus}
                                onBlur={() => setPasswordFocused(false)}
                                autoCapitalize="none"
                                autoComplete="new-password"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={handleSubmit}
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={(value) => {
                                    setPassword(value);
                                    setMessage("");
                                }}
                            />
                            <PasswordStrength password={password} />
                        </View>
                    </View>
                    <AuthButton
                        submitLabel="Create account"
                        onSubmit={handleSubmit}
                        message={message}
                    >
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Already have an account? Sign in"
                            onPress={() => router.navigate("/(auth)/login")}
                            className="mt-6 min-h-12 items-center justify-center rounded-lg border-2 border-transparent px-1 active:opacity-70 focus:border-foreground"
                        >
                            <Text className="font-geist text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Text className="font-geist-semibold text-foreground underline">
                                    Sign in
                                </Text>
                            </Text>
                        </Pressable>
                    </AuthButton>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
