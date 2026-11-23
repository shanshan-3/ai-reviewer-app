import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';

export default function MaterialScreenHeader({ title }) {
    return (
        <View className="min-h-14 flex-row items-center gap-3 border-b border-[#E5E9F0] bg-white px-4 py-2">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center rounded-xl active:bg-[#F1F4F8]"
                style={{ borderCurve: 'continuous' }}
            >
                <IconArrowLeft size={20} color="#001428" accessible={false} />
            </Pressable>
            <Text accessibilityRole="header" numberOfLines={1} className="flex-1 font-geist-semibold text-base text-[#001428]">
                {title}
            </Text>
        </View>
    );
}
