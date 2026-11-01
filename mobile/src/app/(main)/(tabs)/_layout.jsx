import { Tabs } from 'expo-router';
import { Image, Text, View } from 'react-native';
import IconLayoutDashboard from '@tabler/icons-react-native/IconLayoutDashboard';
import IconUser from '@tabler/icons-react-native/IconUser';
import { THEME } from '@/lib/theme';

function TabHeaderTitle({ children }) {
    return (
        <View className="flex-row items-center gap-3">
            <Image
                source={require('../../../../assets/logo/logo-symbol-transparent.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
                accessible={false}
            />
            <Text
                accessibilityRole="header"
                numberOfLines={1}
                className="shrink font-geist-semibold text-xl text-foreground"
            >
                {children}
            </Text>
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            initialRouteName="dashboard"
            screenOptions={{
                headerShown: true,
                headerTitle: TabHeaderTitle,
                headerTitleAlign: 'left',
                headerStyle: { backgroundColor: THEME.background },
                headerShadowVisible: false,
                tabBarActiveTintColor: THEME.primary,
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <IconLayoutDashboard color={color} size={size} />
                    ),
                }}
                />

                <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <IconUser color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
