import { Pressable, Text, View } from "react-native";
import { GraduationCap, BookOpen } from "lucide-react-native";
import { THEME as theme } from "@/lib/theme";

const ROLES = [
  { key: "student", label: "Student", Icon: GraduationCap },
  { key: "instructor", label: "Instructor", Icon: BookOpen },
];

/**
 * @param {{ value: string, onChange: (role: string) => void }} props
 */
export default function RoleSelector({ value, onChange }) {
  return (
    <View className="gap-2">
      <Text className="font-poppins-medium text-base text-foreground">
        I am a
      </Text>
      <View className="flex-row gap-3">
        {ROLES.map(({ key, label, Icon }) => {
          const selected = value === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              onPress={() => onChange(key)}
              className={`min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 ${
                selected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground bg-background"
              }`}
            >
              <Icon
                size={20}
                color={selected ? theme.primaryForeground : theme.foreground}
              />
              <Text
                className={`font-poppins-semibold text-base ${
                  selected ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
