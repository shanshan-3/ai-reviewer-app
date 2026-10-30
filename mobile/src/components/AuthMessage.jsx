import { Text } from "react-native";

/** @param {{ message: string, isError?: boolean }} props */
export default function AuthMessage({ message, isError = false }) {
  if (!message) return null;

  return (
    <Text
      accessibilityLiveRegion="polite"
      className={`font-geist mt-4 text-center ${isError ? "text-destructive" : "text-foreground"}`}
    >
      {message}
    </Text>
  );
}
