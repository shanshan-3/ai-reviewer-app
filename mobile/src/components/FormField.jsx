import { forwardRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import IconEye from "@tabler/icons-react-native/IconEye";
import IconEyeOff from "@tabler/icons-react-native/IconEyeOff";

/**
 * A labeled text input with an optional leading icon, password toggle,
 * and inline error message.
 *
 * @param {{
 *   label: string,
 *   labelId: string,
 *   icon?: import('react').ElementType,
 *   error?: string,
 *   invalid?: boolean,
 *   isPassword?: boolean,
 *   showPassword?: boolean,
 *   onTogglePassword?: () => void,
 *   containerClassName?: string,
 *   onFocus?: () => void,
 * } & import('react-native').TextInputProps} props
 */
const FormField = forwardRef(function FormField(
  {
    label,
    labelId,
    icon: Icon,
    error,
    invalid = false,
    isPassword,
    showPassword,
    onTogglePassword,
    containerClassName = "",
    onFocus,
    ...inputProps
  },
  ref,
) {
  const PasswordVisibilityIcon = showPassword ? IconEyeOff : IconEye;
  const hasError = Boolean(error) || invalid;

  return (
    <View className={`gap-1.5 ${containerClassName}`}>
      <Text
        nativeID={labelId}
        className="font-geist-semibold text-xs tracking-wider uppercase text-[#526071]"
      >
        {label}
      </Text>
      <View className="relative">
        <TextInput
          ref={ref}
          onFocus={onFocus}
          accessibilityLabel={error ? `${label}. ${error}` : label}
          accessibilityLabelledBy={labelId}
          placeholderTextColor="#94A3B8"
          selectionColor="rgba(0, 20, 40, 0.2)"
          cursorColor="#001428"
          selectionHandleColor="#001428"
          style={{ borderCurve: 'continuous' }}
          className={`font-geist min-h-14 rounded-2xl border bg-white py-3 text-base text-[#001428] shadow-2xs ${
            hasError
              ? "border-[#DC2626] bg-rose-50/20"
              : "border-[#E4E8EE] focus:border-[#001428]"
          } ${Icon ? "pl-12" : "pl-4"} ${isPassword ? "pr-14" : "pr-4"}`}
          secureTextEntry={isPassword && !showPassword}
          {...inputProps}
        />
        {Icon && (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute bottom-0 left-4 top-0 justify-center"
          >
            <Icon size={20} color={hasError ? "#DC2626" : "#64748B"} />
          </View>
        )}
        {isPassword && onTogglePassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            onPress={onTogglePassword}
            hitSlop={8}
            style={({ pressed }) => [
              {
                borderCurve: 'continuous',
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
            className="absolute bottom-0 right-1 top-0 min-h-12 min-w-12 items-center justify-center rounded-xl border-2 border-transparent active:bg-[#F1F4F8]"
          >
            <PasswordVisibilityIcon
              size={20}
              color="#001428"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="font-geist text-xs text-[#DC2626]"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

export default FormField;
