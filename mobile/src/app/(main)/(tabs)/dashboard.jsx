import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardPage() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
                <Text className="font-geist text-base text-foreground">
                    Welcome to RebyuIT.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
