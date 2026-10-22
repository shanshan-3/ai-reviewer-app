import { useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Check, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { THEME } from "@/lib/theme";
import { validateLogin } from "@/lib/auth";

export default function LoginPage() {
    const { colorScheme } = useColorScheme();
    const theme = THEME[colorScheme === "dark" ? "dark" : "light"];
    const passwordInput = useRef(/** @type {TextInput | null} */(null));
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    // shortcut: remember-me selection is local, connect session persistence with authentication.
    const [rememberMe, setRememberMe] = useState(false);
    const PasswordVisibilityIcon = showPassword ? EyeOff : Eye;
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const errors = submitted ? validateLogin(email, password) : {};

    function handleSubmit() {
        setSubmitted(true);
        if (Object.keys(validateLogin(email, password)).length) {
            setMessage("");
            return;
        }

        Keyboard.dismiss();
        setMessage("Sign-in isn’t connected yet.");
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "center",
                        padding: 24,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="w-full max-w-sm self-center">

                        <Text
                            accessibilityRole="header"
                            className="text-3xl font-bold text-foreground"
                        >
                            Welcome back
                        </Text>
                        <Text className="mt-2 text-base leading-6 text-muted-foreground">
                            Sign in to continue to your workspace and pick up where you left off.
                        </Text>

                        <View className="mt-8 gap-2">
                            <Text
                                nativeID="email-label"
                                className="text-base font-medium text-foreground"
                            >
                                Email address
                            </Text>
                            <View className="relative">
                                <TextInput
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
                                    placeholder="you@example.com"
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
                                    autoComplete="current-password"
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

                        <View className="mt-3 flex-row flex-wrap items-center justify-between gap-x-3">
                            <Pressable
                                accessibilityRole="checkbox"
                                accessibilityLabel="Remember me"
                                accessibilityState={{ checked: rememberMe }}
                                onPress={() => setRememberMe(!rememberMe)}
                                className="min-h-12 flex-row items-center gap-2 rounded-lg border-2 border-transparent px-1 active:opacity-70 focus:border-foreground"
                            >
                                <View
                                    accessibilityElementsHidden
                                    importantForAccessibility="no-hide-descendants"
                                    className={`h-5 w-5 items-center justify-center rounded border ${rememberMe ? "border-primary bg-primary" : "border-muted-foreground"}`}
                                >
                                    {rememberMe ? (
                                        <Check size={14} color={theme.primaryForeground} />
                                    ) : null}
                                </View>
                                <Text className="text-sm text-foreground">
                                    Remember me
                                </Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                className="min-h-12 justify-center rounded-lg border-2 border-transparent px-1 active:opacity-70 focus:border-foreground"
                            >
                                <Text className="text-sm font-medium text-foreground underline">
                                    Forgot password?
                                </Text>
                            </Pressable>
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            onPress={handleSubmit}
                            className="mt-4 min-h-14 items-center justify-center rounded-lg border-2 border-primary bg-primary px-4 py-3 active:opacity-80 focus:border-muted-foreground"
                        >
                            <Text className="text-base font-semibold text-primary-foreground">
                                Sign in
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
                        <Text className="mt-6 text-center text-sm text-muted-foreground">
                            Need an account?{" "}
                            <Text className="font-semibold text-foreground underline">
                                Create a new one
                            </Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
    
