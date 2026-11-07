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
                contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, paddingTop: 28, paddingBottom: 32, gap: 12 }}
                refreshing={loading && materials.length > 0} onRefresh={() => load()}
                ListHeaderComponent={<View className="gap-8 pb-2">
                <View className="gap-3">
                    <View className="flex-row flex-wrap items-center gap-4">
                        <View className="min-w-0 flex-1 basis-40 gap-3">
                            <Text accessibilityRole="header" className="font-geist-semibold text-3xl leading-10 tracking-tight text-[#001428]">
                                Your study space
                            </Text>
                            <Text className="font-geist text-base leading-7 text-[#526071]">
                                Keep your modules together, ready for review.
                            </Text>
                        </View>
                        <Image source={require('../../../../assets/illustrations/studying-amico-storyset-navy.png')}
                            style={{ width: 88, height: 88 }} resizeMode="contain" accessible={false} />
                    </View>

                    <View className="mt-2 gap-3">
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Upload module"
                            accessibilityHint="Choose a PDF or DOCX to import as a module."
                            accessibilityState={{ disabled: Boolean(deletingId) }}
                            disabled={Boolean(deletingId)}
                            onPress={() => router.push('/(main)/materials/import')}
                            className="min-h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-[#001428] px-5 py-4 active:opacity-80 disabled:opacity-40 focus:bg-[#243447]"
                        >
                            <IconUpload size={20} color={THEME.primaryForeground} accessible={false} />
                            <Text className="shrink text-center font-geist-semibold text-base text-primary-foreground">
                                Upload module
                            </Text>
                        </Pressable>
                        <Text className="text-center font-geist text-xs leading-5 text-[#526071]">
                            PDF or DOCX · Up to 5 MiB
                        </Text>
                    </View>
                </View>

                <View className="gap-2">
                    <Text accessibilityRole="header" className="font-geist-semibold text-2xl leading-8 tracking-tight text-[#001428]">
                        Your modules
                    </Text>
                    <Text className="font-geist text-sm leading-6 text-[#526071]">
                        Open a module to review its content.
                    </Text>
                </View>
                </View>}
                ListEmptyComponent={!loading && !message ? <View className="items-center gap-5 px-5 py-8">
                    <View className="max-w-xs gap-2">
                        <Text className="text-center font-geist-semibold text-xl leading-7 tracking-tight text-[#001428]">No modules yet</Text>
                        <Text className="text-center font-geist text-sm leading-6 text-[#526071]">Upload your first module to keep your notes here, ready to review.</Text>
                    </View>
                </View> : null}
                ListFooterComponent={<View className="gap-2">
                    {loading && <View className="items-center gap-2 py-5" accessibilityLiveRegion="polite">
                        <ActivityIndicator color={THEME.primary} accessibilityLabel="Loading your modules" />
                        <Text className="font-geist text-sm leading-6 text-[#526071]">Loading your modules…</Text>
                    </View>}
                    <AuthMessage message={message} isError />
                    {!loading && Boolean(message) && <AuthButton submitLabel="Retry" disabled={Boolean(deletingId)} onSubmit={() => load(failedOffset.current)} />}
                    {!loading && !message && nextOffset !== null && <AuthButton submitLabel="Load more modules" disabled={Boolean(deletingId)} onSubmit={() => load(nextOffset)} />}
                    <View className="mt-6 gap-4 rounded-2xl bg-[#EDF0F5] p-5" style={{ borderCurve: 'continuous' }}>
                        <Text className="font-geist-medium text-xs leading-5 text-[#526071]">Coming soon</Text>
                        <View className="flex-row flex-wrap gap-x-6 gap-y-4">
                            <View className="max-w-full flex-row items-center gap-2">
                                <IconBolt size={18} color={THEME.mutedForeground} accessible={false} />
                                <Text className="shrink font-geist text-sm leading-6 text-[#526071]">Practice quizzes</Text>
                            </View>
                            <View className="max-w-full flex-row items-center gap-2">
                                <IconCards size={18} color={THEME.mutedForeground} accessible={false} />
                                <Text className="shrink font-geist text-sm leading-6 text-[#526071]">Flashcards</Text>
                            </View>
                        </View>
                    </View>
                </View>}
            />
        </SafeAreaView>
    );
}
