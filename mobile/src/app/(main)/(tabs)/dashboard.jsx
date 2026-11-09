import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import MaterialCard from '@/components/material-card';
import { deleteMaterial, listMaterials } from '@/lib/materials';
import { listUserQuizzes } from '@/lib/quizzes';
import { useSession } from '@/providers/session-provider';
import { useToast } from '@/providers/toast-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconUpload from '@tabler/icons-react-native/IconUpload';
import IconPlayerPlay from '@tabler/icons-react-native/IconPlayerPlay';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconPlus from '@tabler/icons-react-native/IconPlus';
import { THEME } from '@/lib/theme';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardPage() {
    const { session } = useSession();
    const showToast = useToast();
    const userId = session?.user.id;
    const [materials, setMaterials] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizCount, setQuizCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [nextOffset, setNextOffset] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const confirmationOpen = useRef(false);
    const requestId = useRef(0);
    const working = useRef(false);
    const failedOffset = useRef(0);

    const displayName = session?.user?.user_metadata?.full_name
        || (session?.user?.email ? session.user.email.split('@')[0] : 'Student');

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

            // Load quizzes for Dashboard metrics and active resume banner
            listUserQuizzes()
                .then(res => {
                    const list = res.quizzes ?? [];
                    setQuizCount(list.length);
                    const active = list.find(q => q.session?.status === 'active');
                    setActiveQuiz(active || null);
                })
                .catch(() => {});
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
                contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, paddingTop: 24, paddingBottom: 32, gap: 12 }}
                refreshing={loading && materials.length > 0} onRefresh={() => load()}
                ListHeaderComponent={<View className="gap-6 pb-2">
                    {/* Top Greeting Header */}
                    <View className="flex-row items-center justify-between">
                        <View className="min-w-0 flex-1 pr-3">
    
                            <Text accessibilityRole="header" numberOfLines={1} className="font-geist-bold text-3xl tracking-tight text-[#001428]">
                                {getGreeting()}, {displayName}
                            </Text>
                            <Text className="mt-1 font-geist text-xs text-[#526071]">
                                Track your course modules and generate AI practice quizzes.
                            </Text>
                        </View>
                        <Image
                            source={require('../../../../assets/illustrations/studying-amico-storyset-navy.png')}
                            style={{ width: 72, height: 72 }}
                            resizeMode="contain"
                            accessible={false}
                        />
                    </View>

                    {/* Quick KPI Strip */}
                    <View
                        className="flex-row items-center divide-x divide-[#E4E8EE] rounded-2xl border border-[#E4E8EE] bg-white py-3 shadow-sm"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-1 items-center px-1">
                            <Text numberOfLines={1} className="font-geist-bold text-xl text-[#001428]">
                                {materials.length}
                            </Text>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                Modules
                            </Text>
                        </View>
                        <View className="flex-1 items-center px-1">
                            <Text numberOfLines={1} className="font-geist-bold text-xl text-[#001428]">
                                {quizCount}
                            </Text>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                Quizzes
                            </Text>
                        </View>
                        <View className="flex-1 items-center px-1">
                            <View className="flex-row items-center gap-1.5">
                                <View className={`h-2 w-2 rounded-full ${activeQuiz ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <Text numberOfLines={1} className="font-geist-bold text-xl text-[#001428]">
                                    {activeQuiz ? '1' : '0'}
                                </Text>
                            </View>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                In Progress
                            </Text>
                        </View>
                    </View>

                    {/* Active In-Progress Quiz Card on Dashboard */}
                    {activeQuiz && (() => {
                        const activeProgress = Math.round((activeQuiz.session.answeredCount / activeQuiz.questionCount) * 100);
                        return (
                            <View
                                className="overflow-hidden rounded-3xl border border-[#001428]/15 bg-white p-5 shadow-sm gap-3"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1">
                                        <View className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <Text className="font-geist-semibold text-xs text-emerald-800">Quiz in Progress</Text>
                                    </View>
                                    <Text className="font-geist text-xs text-[#526071]">
                                        {activeQuiz.session.answeredCount} of {activeQuiz.questionCount} ({activeProgress}%)
                                    </Text>
                                </View>
                                <Text numberOfLines={1} className="font-geist-bold text-base text-[#001428]">
                                    {activeQuiz.sourceTitle || 'General Practice'}
                                </Text>
                                <View className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                                    <View
                                        className="h-full rounded-full bg-[#001428]"
                                        style={{ width: `${activeProgress}%` }}
                                    />
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Resume Active Quiz"
                                    onPress={() => router.push(`/(main)/quizzes/${activeQuiz.session.id}`)}
                                    className="flex-row items-center justify-center gap-2 rounded-2xl bg-[#001428] py-3.5 shadow-sm active:scale-[0.98] active:opacity-90"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconPlayerPlay size={18} color="white" />
                                    <Text className="font-geist-semibold text-sm text-white">Resume Quiz</Text>
                                </Pressable>
                            </View>
                        );
                    })()}

                    {/* Action Cards Grid */}
                    <View className="flex-row gap-3">
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Upload module"
                            accessibilityHint="Choose a PDF or DOCX to import as a module."
                            accessibilityState={{ disabled: Boolean(deletingId) }}
                            disabled={Boolean(deletingId)}
                            onPress={() => router.push('/(main)/materials/import')}
                            className="flex-1 rounded-2xl border border-[#001428] bg-[#001428] p-3.5 shadow-sm active:scale-[0.98] active:opacity-95"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <View className="mb-2 h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                                <IconUpload size={18} color="white" accessible={false} />
                            </View>
                            <Text numberOfLines={1} className="font-geist-semibold text-sm text-white">Upload Module</Text>
                            <Text numberOfLines={1} className="mt-0.5 font-geist text-[11px] text-white/70">PDF or DOCX notes</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Generate AI Quiz"
                            accessibilityHint="Generate a new practice quiz from modules or topics."
                            onPress={() => router.push('/(main)/quizzes/create')}
                            className="flex-1 rounded-2xl border border-[#E4E8EE] bg-white p-3.5 shadow-sm active:scale-[0.98] active:bg-[#F8FAFC]"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <View className="mb-2 h-8 w-8 items-center justify-center rounded-xl bg-[#F1F4F8]">
                                <IconSparkles size={18} color="#001428" accessible={false} />
                            </View>
                            <Text numberOfLines={1} className="font-geist-semibold text-sm text-[#001428]">Practice Quiz</Text>
                            <Text numberOfLines={1} className="mt-0.5 font-geist text-[11px] text-[#526071]">AI practice tests</Text>
                        </Pressable>
                    </View>

                    {/* Modules Section Header */}
                    <View className="flex-row items-center justify-between pt-2">
                        <View>
                            <Text accessibilityRole="header" className="font-geist-bold text-2xl tracking-tight text-[#001428]">
                                Your modules
                            </Text>
                            <Text className="font-geist text-xs text-[#526071]">
                                Approved notes ready for interactive review
                            </Text>
                        </View>
                        {materials.length > 0 && (
                            <View className="rounded-full bg-[#F1F4F8] px-3 py-1">
                                <Text className="font-geist-medium text-xs text-[#526071]">
                                    {materials.length} {materials.length === 1 ? 'module' : 'modules'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>}
                ListEmptyComponent={!loading && !message ? (
                    <View
                        className="items-center justify-center rounded-3xl border border-[#E4E8EE] bg-white p-8 text-center shadow-sm"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F4F8]">
                            <IconFileText size={32} color="#001428" />
                        </View>
                        <Text className="font-geist-bold text-xl text-[#001428]">
                            No modules yet
                        </Text>
                        <Text className="mt-2 max-w-xs text-center font-geist text-xs leading-5 text-[#526071]">
                            Upload your course modules or lecture notes in PDF or DOCX format to start generating AI quizzes.
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Upload your first module"
                            onPress={() => router.push('/(main)/materials/import')}
                            className="mt-5 flex-row items-center gap-2 rounded-2xl bg-[#001428] px-5 py-3 shadow-sm active:scale-95 active:opacity-90"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <IconPlus size={18} color="white" />
                            <Text className="font-geist-semibold text-xs text-white">Upload First Module</Text>
                        </Pressable>
                    </View>
                ) : null}
                ListFooterComponent={<View className="gap-2">
                    {loading && <View className="items-center gap-2 py-5" accessibilityLiveRegion="polite">
                        <ActivityIndicator color={THEME.primary} accessibilityLabel="Loading your modules" />
                        <Text className="font-geist text-sm leading-6 text-[#526071]">Loading your modules…</Text>
                    </View>}
                    <AuthMessage message={message} isError />
                    {!loading && Boolean(message) && <AuthButton submitLabel="Retry" disabled={Boolean(deletingId)} onSubmit={() => load(failedOffset.current)} />}
                    {!loading && !message && nextOffset !== null && <AuthButton submitLabel="Load more modules" disabled={Boolean(deletingId)} onSubmit={() => load(nextOffset)} />}
                </View>}
            />
        </SafeAreaView>
    );
}
