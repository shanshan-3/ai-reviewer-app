import { Text, View } from "react-native";
import { THEME as theme } from "@/lib/theme";

const LEVELS = [
  { label: "Too short", color: theme.destructive, bars: 1 },
  { label: "Weak", color: theme.destructive, bars: 1 },
  { label: "Fair", color: theme.chart4, bars: 2 },
  { label: "Good", color: theme.chart2, bars: 3 },
  { label: "Strong", color: theme.chart2, bars: 4 },
];

function getStrength(password) {
  if (!password) return 0;
  if (password.length < 6) return 0;
  let score = 1;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

/** @param {{ password: string }} props */
export default function PasswordStrength({ password }) {
  if (!password) return null;

  const strength = getStrength(password);
  const level = LEVELS[strength];

  return (
    <View className="mt-1 gap-1.5">
      <View className="flex-row gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{
              backgroundColor: i < level.bars ? level.color : theme.border,
            }}
          />
        ))}
      </View>
      <Text
        accessibilityLiveRegion="polite"
        className="font-geist text-xs"
        style={{ color: level.color }}
      >
        {level.label}
      </Text>
    </View>
  );
}
