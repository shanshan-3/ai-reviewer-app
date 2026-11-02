import { Tabs } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import IconLayoutDashboard from '@tabler/icons-react-native/IconLayoutDashboard';
import IconHelp from '@tabler/icons-react-native/IconHelp';
import IconCards from '@tabler/icons-react-native/IconCards';
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
                className="shrink font-geist-semibold text-xl text-[#001428]"
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
                headerStyle: {
                    backgroundColor: THEME.card,
                    borderBottomColor: THEME.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                },
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
                name="quizzes"
                options={{
                    title: 'Quizzes',
                    tabBarIcon: ({ color, size }) => (
                        <IconHelp color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="flashcards"
                options={{
                    title: 'Flashcards',
                    tabBarIcon: ({ color, size }) => (
                        <IconCards color={color} size={size} />
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
