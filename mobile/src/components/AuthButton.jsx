import { ActivityIndicator, Pressable, Text, View } from "react-native";

/**
 * @param {{
 *   submitLabel: string,
 *   onSubmit: () => void,
 *   children?: import('react').ReactNode,
 *   disabled?: boolean,
 *   loading?: boolean,
 * }} props
 */
export default function AuthButton({ submitLabel, onSubmit, children, disabled = false, loading = false }) {
  const isBusy = disabled || loading;
  return (
    <View className="w-full max-w-sm self-center pt-4">
      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        disabled={isBusy}
        accessibilityState={{ disabled: isBusy, busy: isBusy }}
        style={({ pressed }) => [
          {
            borderCurve: 'continuous',
            transform: [{ scale: pressed && !isBusy ? 0.97 : 1 }],
          },
        ]}
        className={`min-h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-[#001428] px-4 py-3.5 shadow-sm active:opacity-90 ${
          isBusy ? "opacity-70" : ""
        }`}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : null}
        <Text className="font-geist-semibold text-base tracking-tight text-white">
          {submitLabel}
        </Text>
      </Pressable>
      {children}
    </View>
  );
}
