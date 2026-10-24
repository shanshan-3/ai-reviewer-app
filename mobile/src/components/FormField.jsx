import { forwardRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { THEME as theme } from "@/lib/theme";

/**
 * A labeled text input with an optional leading icon, password toggle,
 * and inline error message.
 *
 * @param {{
 *   label: string,
 *   labelId: string,
 *   icon?: import('react').ElementType,
 *   error?: string,
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
    isPassword,
    showPassword,
    onTogglePassword,
    containerClassName = "",
    onFocus,
    ...inputProps
  },
  ref,
) {
  const PasswordVisibilityIcon = showPassword ? EyeOff : Eye;

  return (
    <View className={`gap-2 ${containerClassName}`}>
      <Text
        nativeID={labelId}
        className="font-poppins-medium text-base text-foreground"
      >
        {label}
      </Text>
      <View className="relative">
        <TextInput
          ref={ref}
          onFocus={onFocus}
          accessibilityLabel={error ? `${label}. ${error}` : label}
          accessibilityLabelledBy={labelId}
          placeholderTextColor={theme.mutedForeground}
          selectionColor={theme.foreground}
          className={`font-poppins min-h-14 rounded-lg border py-3 text-base text-foreground focus:border-foreground ${
            error ? "border-destructive" : "border-muted-foreground"
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
            <Icon size={20} color={error ? theme.destructive : theme.mutedForeground} />
          </View>
        )}
        {isPassword && onTogglePassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            onPress={onTogglePassword}
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
        )}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="font-poppins text-sm text-destructive"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

export default FormField;
