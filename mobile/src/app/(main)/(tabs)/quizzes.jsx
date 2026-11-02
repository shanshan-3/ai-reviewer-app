import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuizzesPage() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                <View className="w-full max-w-sm items-center gap-3 self-center">
                    <Text accessibilityRole="header" className="text-center font-geist-semibold text-2xl text-foreground">
                        Quizzes are coming soon
                    </Text>
                    <Text className="text-center font-geist text-sm leading-6 text-foreground/70">
                        Quiz generation and practice are not available yet.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
