import { Pressable, Text, View } from "react-native";

/**
 * @param {{
 *   submitLabel: string,
 *   onSubmit: () => void,
 *   message: string,
 *   children?: import('react').ReactNode,
 *   disabled?: boolean,
 * }} props
 */
export default function AuthButton({ submitLabel, onSubmit, message, children, disabled = false }) {
  return (
    <View className="mt-auto w-full max-w-sm self-center pt-4">
      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        className="min-h-14 items-center justify-center rounded-lg border-2 border-primary bg-[#001428] px-4 py-3 active:opacity-80 focus:border-muted-foreground"
        disabled={disabled}
        accessibilityState={{ disabled, busy: disabled }}
      >
        <Text className="font-geist-semibold text-base text-primary-foreground">
          {submitLabel}
        </Text>
      </Pressable>
      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          className="font-geist mt-4 text-base text-foreground"
        >
          {message}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
