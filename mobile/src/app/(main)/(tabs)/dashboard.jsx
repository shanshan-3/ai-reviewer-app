import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import MaterialCard from '@/components/material-card';
import { deleteMaterial, listMaterials } from '@/lib/materials';
import { useSession } from '@/providers/session-provider';
import { useToast } from '@/providers/toast-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconBolt from '@tabler/icons-react-native/IconBolt';
import IconCards from '@tabler/icons-react-native/IconCards';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconUpload from '@tabler/icons-react-native/IconUpload';
import { THEME } from '@/lib/theme';

export default function DashboardPage() {
    const { session } = useSession();
    const showToast = useToast();
    const userId = session?.user.id;
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [nextOffset, setNextOffset] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const confirmationOpen = useRef(false);
    const requestId = useRef(0);
    const working = useRef(false);
    const failedOffset = useRef(0);

    usePreventRemove(Boolean(deletingId), () => Alert.alert('Deletion in progress', 'Wait for deletion to finish before leaving this screen.'));

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
        setDeletingId(null);
        void load();
        return () => { requestId.current++; working.current = false; confirmationOpen.current = false; };
    }, [load]));

    function confirmDeletion(material) {
        if (working.current || confirmationOpen.current || material.status === 'processing') return;
        confirmationOpen.current = true;
        const epoch = requestId.current;
        Alert.alert('Delete module?', `Permanently delete "${material.title}"? Its uploaded file, extracted text, and any linked quizzes, flashcards, and study results will be lost. This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel', onPress: () => { confirmationOpen.current = false; } },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                confirmationOpen.current = false;
                if (epoch !== requestId.current || working.current) return;
                working.current = true;
                const id = ++requestId.current;
                setDeletingId(material.id);
                setMessage('');
                try {
                    await deleteMaterial(material.id);
                    if (id !== requestId.current) return;
                    setMaterials(value => value.filter(item => item.id !== material.id));
                    showToast('Module deleted');
                    working.current = false;
                    setDeletingId(null);
                    await load();
                } catch (error) {
                    if (id !== requestId.current) return;
                    failedOffset.current = 0;
                    setMessage(error.message || 'Could not delete this module. Refresh and try again.');
                    working.current = false;
                    setDeletingId(null);
                }
            } },
        ], { cancelable: false });
    }
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <FlatList data={materials} keyExtractor={material => material.id}
                renderItem={({ item }) => <MaterialCard material={item} deleting={deletingId === item.id} disabled={Boolean(deletingId) || loading}
                    onDelete={() => confirmDeletion(item)} onPress={() => router.push({ pathname: '/(main)/materials/[materialId]', params: { materialId: item.id } })} />}
                contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, paddingBottom: 32, gap: 12 }}
                refreshing={loading && materials.length > 0} onRefresh={() => load()}
                ListHeaderComponent={<View className="gap-6 pb-1">
                <View className="gap-2">
                    <Text accessibilityRole="header" className="font-geist-semibold text-3xl tracking-tight text-[#001428]">
                        Your study space
                    </Text>
                    <Text className="font-geist text-sm leading-6 text-foreground/70">
                        Keep your modules together, ready for review.
                    </Text>
                </View>

                <View className="gap-4 rounded-xl border border-border bg-card p-5">
                    <View className="flex-row flex-wrap items-center gap-3">
                        <View className="min-w-0 flex-1 basis-40 gap-2">
                            <Text accessibilityRole="header" className="font-geist-semibold text-xl text-[#001428]">
                                Add a module
                            </Text>
                            <Text className="font-geist text-sm leading-6 text-foreground/70">
                                Upload your notes. Review and organize their content.
                            </Text>
                        </View>
                        <Image
                            source={require('../../../../assets/illustrations/studying-amico-storyset-navy.png')}
                            style={{ width: 88, height: 88 }}
                            resizeMode="contain"
                            accessible={false}
                        />
                    </View>
                    <View className="gap-2">
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Upload material"
                            accessibilityHint="Choose a PDF or DOCX to import as a module."
                            accessibilityState={{ disabled: Boolean(deletingId) }}
                            disabled={Boolean(deletingId)}
                            onPress={() => router.push('/(main)/materials/import')}
                            className="min-h-12 flex-row flex-wrap items-center justify-center gap-2 rounded-lg border-2 border-transparent bg-[#001428] px-4 py-3 active:opacity-80 disabled:opacity-50 focus:border-muted-foreground"
                        >
                            <IconUpload size={20} color={THEME.primaryForeground} accessible={false} />
                            <Text className="text-center font-geist-semibold text-sm text-primary-foreground">
                                Upload material
                            </Text>
                        </Pressable>
                        <Text className="text-center font-geist text-xs leading-5 text-foreground/70">
                            PDF or DOCX · Up to 5 MiB
                        </Text>
                    </View>
                </View>

                <View className="gap-1">
                    <Text accessibilityRole="header" className="font-geist-semibold text-lg text-[#001428]">
                        Your modules
                    </Text>
                    <Text className="font-geist text-sm leading-6 text-foreground/70">
                        Open a module to review its content.
                    </Text>
                </View>
                </View>}
                ListEmptyComponent={!loading && !message ? <View className="items-center gap-3 rounded-xl border border-border bg-card px-6 py-8">
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-background">
                        <IconFileText size={24} color="#001428" accessible={false} />
                    </View>
                    <View className="gap-2">
                        <Text className="text-center font-geist-semibold text-base text-foreground">No modules yet</Text>
                        <Text className="text-center font-geist text-sm leading-6 text-foreground/70">Use Upload material above to add your first module.</Text>
                    </View>
                </View> : null}
                ListFooterComponent={<View className="gap-2">
                    {loading && <View className="items-center gap-2 py-5" accessibilityLiveRegion="polite">
                        <ActivityIndicator color={THEME.primary} accessibilityLabel="Loading your modules" />
                        <Text className="font-geist text-sm text-foreground/70">Loading your modules…</Text>
                    </View>}
                    <AuthMessage message={message} isError />
                    {!loading && Boolean(message) && <AuthButton submitLabel="Retry" disabled={Boolean(deletingId)} onSubmit={() => load(failedOffset.current)} />}
                    {!loading && !message && nextOffset !== null && <AuthButton submitLabel="Load more modules" disabled={Boolean(deletingId)} onSubmit={() => load(nextOffset)} />}
                    <View className="mt-5 gap-3 border-t border-border pt-5">
                        <Text className="font-geist-medium text-xs text-foreground/70">Coming soon</Text>
                        <View className="flex-row flex-wrap gap-x-6 gap-y-3">
                            <View className="flex-row items-center gap-2">
                                <IconBolt size={18} color={THEME.mutedForeground} accessible={false} />
                                <Text className="font-geist text-sm text-foreground/70">Practice quizzes</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <IconCards size={18} color={THEME.mutedForeground} accessible={false} />
                                <Text className="font-geist text-sm text-foreground/70">Flashcards</Text>
                            </View>
                        </View>
                    </View>
                </View>}
            />
        </SafeAreaView>
    );
}
