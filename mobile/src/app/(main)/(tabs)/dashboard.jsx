import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconBolt from '@tabler/icons-react-native/IconBolt';
import IconCards from '@tabler/icons-react-native/IconCards';
import IconUpload from '@tabler/icons-react-native/IconUpload';
import { THEME } from '@/lib/theme';

export default function DashboardPage() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 28 }}>
                <View className="gap-2">
                    <Text accessibilityRole="header" className="font-geist-semibold text-2xl text-foreground">
                        Welcome to RebyuIT
                    </Text>
                    <Text className="font-geist text-sm leading-6 text-foreground/70">
                        Upload your study materials to create personalized quizzes and study cards.
                    </Text>
                </View>

                <View className="items-center gap-5 rounded-xl border border-border bg-card p-6">
                    <Image
                        source={require('../../../../assets/illustrations/studying-amico-storyset-navy.png')}
                        style={{ width: '100%', maxWidth: 208, height: 180 }}
                        resizeMode="contain"
                        accessible={false}
                    />
                    <View className="w-full items-center gap-2">
                        <Text accessibilityRole="header" className="text-center font-geist-semibold text-xl text-foreground">
                            Add your first module
                        </Text>
                        <Text className="text-center font-geist text-sm leading-6 text-foreground/70">
                            Upload a PDF or DOCX to create review material.
                        </Text>
                    </View>
                    <View className="w-full gap-3">
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Upload material"
                            onPress={() => router.push('/(main)/materials/import')}
                            className="min-h-12 flex-row flex-wrap items-center justify-center gap-2 rounded-lg bg-[#001428] px-4 py-3 active:opacity-80 focus:border-muted-foreground"
                        >
                            <IconUpload size={20} color={THEME.primaryForeground} accessible={false} />
                            <Text className="text-center font-geist-semibold text-sm text-primary-foreground">
                                Upload material
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <View className="gap-3">
                    <Text accessibilityRole="header" className="font-geist-semibold text-base text-foreground">
                        Quick review actions
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                        <Pressable
                            disabled
                            accessibilityRole="button"
                            accessibilityLabel="Generate Quiz, coming soon"
                            accessibilityState={{ disabled: true }}
                            className="min-h-12 grow basis-32 gap-3 rounded-lg border border-border bg-card p-4"
                        >
                            <IconBolt size={22} color={THEME.mutedForeground} accessible={false} />
                            <View className="gap-1">
                                <Text className="font-geist-medium text-sm text-foreground/70">Generate Quiz</Text>
                                <Text className="font-geist text-xs leading-5 text-foreground/70">Coming soon</Text>
                            </View>
                        </Pressable>
                        <Pressable
                            disabled
                            accessibilityRole="button"
                            accessibilityLabel="Flashcards, coming soon"
                            accessibilityState={{ disabled: true }}
                            className="min-h-12 grow basis-32 gap-3 rounded-lg border border-border bg-card p-4"
                        >
                            <IconCards size={22} color={THEME.mutedForeground} accessible={false} />
                            <View className="gap-1">
                                <Text className="font-geist-medium text-sm text-foreground/70">Flashcards</Text>
                                <Text className="font-geist text-xs leading-5 text-foreground/70">Coming soon</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                <View className="gap-3">
                    <Text accessibilityRole="header" className="font-geist-semibold text-base text-foreground">
                        Your modules
                    </Text>
                    <View className="gap-2 rounded-lg border border-dashed border-border p-5">
                        <Text className="font-geist-medium text-sm text-foreground">No modules yet</Text>
                        <Text className="font-geist text-sm leading-6 text-foreground/70">
                            Your uploaded study materials will appear here.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
