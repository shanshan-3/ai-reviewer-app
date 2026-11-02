import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';
import { THEME } from '@/lib/theme';

export default function MaterialScreenHeader({ title }) {
    return (
        <View className="min-h-14 flex-row items-center gap-3 border-b border-border bg-card px-4 py-2">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center rounded-lg"
            >
                <IconArrowLeft size={22} color={THEME.foreground} accessible={false} />
            </Pressable>
            <Text accessibilityRole="header" numberOfLines={1} className="flex-1 font-geist-semibold text-lg text-foreground">
                {title}
            </Text>
        </View>
    );
}
