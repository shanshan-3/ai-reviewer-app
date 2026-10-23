import { useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { THEME as theme } from "@/lib/theme";
import { validateRegister } from "@/lib/auth";

export default function RegisterPage() {
    const { fontScale } = useWindowDimensions();
    const emailInput = useRef(/** @type {TextInput | null} */(null));
    const passwordInput = useRef(/** @type {TextInput | null} */(null));
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const PasswordVisibilityIcon = showPassword ? EyeOff : Eye;
    const [fullName, setFullName] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const errors = submitted ? validateRegister(fullName, email, password) : {};

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
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        flexGrow: 1,
                        padding: 24,
                        paddingTop: 48,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="w-full max-w-sm self-center">

                        <Text
                            accessibilityRole="header"
                            style={{ minHeight: 72 * fontScale }}
                            className="text-3xl font-bold leading-9 text-foreground"
                        >
                            Create your account
                        </Text>
                        <Text
                            style={{ minHeight: 72 * fontScale }}
                            className="mt-2 text-base leading-6 text-muted-foreground"
                        >
                            Create an account to organize your study materials, practice with quizzes and flashcards, and review at your own pace.
                        </Text>

                        <View className="mt-8 gap-2">
                            <Text
                                nativeID="full-name-label"
                                className="text-base font-medium text-foreground"
                            >
                                Full Name
                            </Text>
                            <View className="relative">
                                <TextInput
                                    accessibilityLabel={
                                        errors.fullName ? `Full Name. ${errors.fullName}` : "Full Name"
                                    }
                                    accessibilityLabelledBy="full-name-label"
                                    autoCapitalize="words"
                                    autoComplete="name"
                                    autoCorrect={false}
                                    keyboardType="default"
                                    returnKeyType="next"
                                    submitBehavior="submit"
                                    onSubmitEditing={() => emailInput.current?.focus()}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={theme.mutedForeground}
                                    selectionColor={theme.foreground}
                                    className="min-h-14 rounded-lg border border-muted-foreground py-3 pl-12 pr-4 text-base text-foreground focus:border-foreground"
                                    value={fullName}
                                    onChangeText={(value) => {
                                        setFullName(value);
                                        setMessage("");
                                    }}
                                />
                                <View
                                    pointerEvents="none"
                                    accessibilityElementsHidden
                                    importantForAccessibility="no-hide-descendants"
                                    className="absolute bottom-0 left-4 top-0 justify-center"
                                >
                                    <User size={20} color={theme.mutedForeground} />
                                </View>
                            </View>
                            {errors.fullName ? (
                                <Text
                                    accessibilityLiveRegion="polite"
                                    className="text-sm text-foreground"
                                >
                                    {errors.fullName}
                                </Text>
                            ) : null}
                        </View>

                        <View className="mt-5 gap-2">
                            <Text
                                nativeID="email-label"
                                className="text-base font-medium text-foreground"
                            >
                                Email
                            </Text>
                            <View className="relative">
                                <TextInput
                                    ref={emailInput}
                                    accessibilityLabel={
                                        errors.email ? `Email. ${errors.email}` : "Email"
                                    }
                                    accessibilityLabelledBy="email-label"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                    submitBehavior="submit"
                                    onSubmitEditing={() => passwordInput.current?.focus()}
                                    placeholder="Enter your email"
                                    placeholderTextColor={theme.mutedForeground}
                                    selectionColor={theme.foreground}
                                    className="min-h-14 rounded-lg border border-muted-foreground py-3 pl-12 pr-4 text-base text-foreground focus:border-foreground"
                                    value={email}
                                    onChangeText={(value) => {
                                        setEmail(value);
                                        setMessage("");
                                    }}
                                />
                                <View
                                    pointerEvents="none"
                                    accessibilityElementsHidden
                                    importantForAccessibility="no-hide-descendants"
                                    className="absolute bottom-0 left-4 top-0 justify-center"
                                >
                                    <Mail size={20} color={theme.mutedForeground} />
                                </View>
                            </View>
                            {errors.email ? (
                                <Text
                                    accessibilityLiveRegion="polite"
                                    className="text-sm text-foreground"
                                >
                                    {errors.email}
                                </Text>
                            ) : null}
                        </View>

                        <View className="mt-5 gap-2">
                            <Text
                                nativeID="password-label"
                                className="text-base font-medium text-foreground"
                            >
                                Password
                            </Text>
                            <View className="relative">
                                <TextInput
                                    ref={passwordInput}
                                    accessibilityLabel={
                                        errors.password
                                            ? `Password. ${errors.password}`
                                            : "Password"
                                    }
                                    accessibilityLabelledBy="password-label"
                                    autoCapitalize="none"
                                    autoComplete="new-password"
                                    autoCorrect={false}
                                    secureTextEntry={!showPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSubmit}
                                    placeholder="Enter your password"
                                    placeholderTextColor={theme.mutedForeground}
                                    selectionColor={theme.foreground}
                                    className="min-h-14 rounded-lg border border-muted-foreground py-3 pl-12 pr-14 text-base text-foreground focus:border-foreground"
                                    value={password}
                                    onChangeText={(value) => {
                                        setPassword(value);
                                        setMessage("");
                                    }}
                                />
                                <View
                                    pointerEvents="none"
                                    accessibilityElementsHidden
                                    importantForAccessibility="no-hide-descendants"
                                    className="absolute bottom-0 left-4 top-0 justify-center"
                                >
                                    <Lock size={20} color={theme.mutedForeground} />
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                        showPassword ? "Hide password" : "Show password"
                                    }
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="absolute bottom-0 right-1 top-0 min-h-12 min-w-12 items-center justify-center rounded-lg border-2 border-transparent active:bg-secondary focus:border-foreground"
                                >
                                    <PasswordVisibilityIcon
                                        size={20}
                                        color={theme.foreground}
                                        accessible={false}
                                        accessibilityElementsHidden
                                        importantForAccessibility="no-hide-descendants"
                                    />
                                </Pressable>
                            </View>
                            {errors.password ? (
                                <Text
                                    accessibilityLiveRegion="polite"
                                    className="text-sm text-foreground"
                                >
                                    {errors.password}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                    <View className="mt-auto w-full max-w-sm self-center pt-4">
                        <Pressable
                            accessibilityRole="button"
                            onPress={handleSubmit}
                            className="min-h-14 items-center justify-center rounded-lg border-2 border-primary bg-[#001428] px-4 py-3 active:opacity-80 focus:border-muted-foreground"
                        >
                            <Text className="text-base font-semibold text-primary-foreground">
                                Create account
                            </Text>
                        </Pressable>
                        {message ? (
                            <Text
                                accessibilityLiveRegion="polite"
                                className="mt-4 text-base text-foreground"
                            >
                                {message}
                            </Text>
                        ) : null}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Already have an account? Sign in"
                            onPress={() => router.navigate("/(auth)/login")}
                            className="mt-6 min-h-12 items-center justify-center rounded-lg border-2 border-transparent px-1 active:opacity-70 focus:border-foreground"
                        >
                            <Text className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Text className="font-semibold text-foreground underline">
                                    Sign in
                                </Text>
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
