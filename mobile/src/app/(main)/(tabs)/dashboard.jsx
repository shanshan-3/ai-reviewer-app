import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import MaterialCard from '@/components/material-card';
import { listMaterials } from '@/lib/materials';
import { useSession } from '@/providers/session-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconBolt from '@tabler/icons-react-native/IconBolt';
import IconCards from '@tabler/icons-react-native/IconCards';
import IconUpload from '@tabler/icons-react-native/IconUpload';
import { THEME } from '@/lib/theme';

export default function DashboardPage() {
    const { session } = useSession();
    const userId = session?.user.id;
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [nextOffset, setNextOffset] = useState(null);
    const requestId = useRef(0);
    const working = useRef(false);
    const failedOffset = useRef(0);

    const load = useCallback(async (offset = 0) => {
        if (!userId || working.current) return;
        working.current = true;
        const id = ++requestId.current;
        setLoading(true);
        setMessage('');
        try {
            const result = await listMaterials(offset);
            if (id !== requestId.current) return;
            setMaterials(value => offset === 0 ? result.materials
                : [...value, ...result.materials.filter(item => !value.some(existing => existing.id === item.id))]);
            setNextOffset(result.nextOffset);
        } catch (error) {
            if (id === requestId.current) { failedOffset.current = offset; setMessage(error.message || 'Could not load your modules.'); }
        } finally {
            if (id === requestId.current) { working.current = false; setLoading(false); }
        }
    }, [userId]);

    useFocusEffect(useCallback(() => {
        setMaterials([]);
        setNextOffset(null);
        void load();
        return () => { requestId.current++; working.current = false; };
    }, [load]));
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <FlatList data={materials} keyExtractor={material => material.id}
                renderItem={({ item }) => <MaterialCard material={item} onPress={() => router.push({ pathname: '/(main)/materials/[materialId]', params: { materialId: item.id } })} />}
                contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 16 }}
                refreshing={loading && materials.length > 0} onRefresh={() => load()}
                ListHeaderComponent={<View className="gap-7">
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
                            {!loading && !message && materials.length === 0 ? 'Add your first module' : 'Add study material'}
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

                <Text accessibilityRole="header" className="font-geist-semibold text-base text-foreground">Your modules</Text>
                </View>}
                ListEmptyComponent={!loading && !message ? <View className="gap-2 rounded-lg border border-dashed border-border p-5">
                    <Text className="font-geist-medium text-sm text-foreground">No modules yet</Text>
                    <Text className="font-geist text-sm leading-6 text-foreground/70">Your uploaded study materials will appear here.</Text>
                </View> : null}
                ListFooterComponent={<View>
                    {loading && <ActivityIndicator className="py-4" color={THEME.primary} accessibilityLabel="Loading your modules" />}
                    <AuthMessage message={message} isError />
                    {!loading && Boolean(message) && <AuthButton submitLabel="Retry" onSubmit={() => load(failedOffset.current)} />}
                    {!loading && !message && nextOffset !== null && <AuthButton submitLabel="Load more modules" onSubmit={() => load(nextOffset)} />}
                </View>}
            />
        </SafeAreaView>
    );
}
