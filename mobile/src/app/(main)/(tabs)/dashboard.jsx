import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import MaterialCard from '@/components/material-card';
import { deleteMaterial, listMaterials } from '@/lib/materials';
import { listUserQuizzes } from '@/lib/quizzes';
import { getTopicRecommendations, getUserStreak } from '@/lib/progress';
import { getCurrentWeekDays, getDeviceTimeZone } from '@/lib/study-date';
import { useSession } from '@/providers/session-provider';


import { useToast } from '@/providers/toast-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconUpload from '@tabler/icons-react-native/IconUpload';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconPlus from '@tabler/icons-react-native/IconPlus';
import IconArrowRight from '@tabler/icons-react-native/IconArrowRight';
import IconFlame from '@tabler/icons-react-native/IconFlame';
import { THEME } from '@/lib/theme';



export default function DashboardPage() {
    const { session } = useSession();
    const showToast = useToast();
    const userId = session?.user.id;
    const [materials, setMaterials] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizCount, setQuizCount] = useState(0);
    const [recommendations, setRecommendations] = useState([]);
    const [streak, setStreak] = useState(null);
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

            // Load quizzes for Dashboard metrics and active resume banner
            listUserQuizzes()
                .then(res => {
                    const list = res.quizzes ?? [];
                    setQuizCount(list.length);
                    const active = list.find(q => q.session?.status === 'active');
                    setActiveQuiz(active || null);
                })
                .catch(() => {});

            // Load weak-topic recommendations
            getTopicRecommendations()
                .then(res => {
                    setRecommendations(res.recommendations ?? []);
                })
                .catch(() => {});

            // Load study streak
            getUserStreak()
                .then(res => {
                    setStreak(res.streak ?? null);
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

    const timeZone = getDeviceTimeZone();
    const currentWeek = getCurrentWeekDays(timeZone);
    const studiedDatesSet = new Set(streak?.recentDays || []);

    const weekVelocity = currentWeek.map(day => {
        const hasStudied = studiedDatesSet.has(day.dateString);
        return {
            ...day,
            hasStudied,
            intensity: hasStudied ? 1.0 : day.isToday ? 0.35 : 0.1,
        };
    });

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
                            <Text accessibilityRole="header" numberOfLines={2} className="font-geist-bold text-2xl tracking-tight text-[#001428]">
                                Ready to review today?
                            </Text>
                            <Text className="mt-1 font-geist text-xs text-[#526071]">
                                Track your course modules and generate AI practice quizzes.
                            </Text>
                        </View>
                        <Image
                            source={require('../../../../assets/illustrations/studying-amico-storyset-navy.png')}
                            style={{ width: 92, height: 92 }}
                            resizeMode="contain"
                            accessible={false}
                        />
                    </View>

                    {/* Quick KPI Strip */}
                    <View
                        className="flex-row items-center divide-x divide-[#E4E8EE] rounded-2xl border border-[#E4E8EE] bg-white py-3 shadow-xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="flex-1 items-center px-1">
                            <Text numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }} className="font-geist-bold text-xl text-[#001428]">
                                {materials.length}
                            </Text>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                Modules
                            </Text>
                        </View>
                        <View className="flex-1 items-center px-1">
                            <Text numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }} className="font-geist-bold text-xl text-[#001428]">
                                {quizCount}
                            </Text>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                Quizzes
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Study streak: ${streak?.currentStreak ?? 0} days. Tap to view performance report.`}
                            onPress={() => router.push('/(main)/report')}
                            className="flex-1 items-center px-1 active:opacity-75"
                        >
                            <View className="flex-row items-center gap-1">
                                <IconFlame
                                    size={15}
                                    color={streak?.hasStudiedToday && (streak?.currentStreak ?? 0) > 0 ? '#D97706' : '#94A3B8'}
                                    fill={streak?.hasStudiedToday && (streak?.currentStreak ?? 0) > 0 ? '#FDE68A' : 'none'}
                                    strokeWidth={2}
                                />
                                <Text numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }} className="font-geist-bold text-xl text-[#001428]">
                                    {streak?.currentStreak ?? 0}
                                </Text>
                            </View>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                Day Streak
                            </Text>
                        </Pressable>
                        <View className="flex-1 items-center px-1">
                            <Text numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }} className="font-geist-bold text-xl text-[#001428]">
                                {activeQuiz ? '1' : '0'}
                            </Text>
                            <Text numberOfLines={1} className="mt-0.5 font-geist-medium text-[11px] text-[#526071]">
                                In Progress
                            </Text>
                        </View>
                    </View>

                    {/* 7-Day Study Velocity & Consistency Strip (Compact) */}
                    <View
                        className="overflow-hidden rounded-2xl border border-[#E4E8EE] bg-white p-3.5 shadow-xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="mb-2 flex-row items-center justify-between">
                            <View className="flex-1 pr-2">
                                <Text className="font-geist-bold text-xs text-[#001428]">
                                    7-Day Study Velocity
                                </Text>
                                <Text className="mt-0.5 font-geist text-[11px] text-[#526071]">
                                    {streak?.hasStudiedToday
                                        ? 'Daily goal completed • Streak active'
                                        : 'Study today to maintain your consistency'}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Study streak: ${streak?.currentStreak ?? 0} days. View performance report.`}
                                onPress={() => router.push('/(main)/report')}
                                className="flex-row items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 active:opacity-75"
                            >
                                <IconFlame
                                    size={12}
                                    color="#D97706"
                                    fill={(streak?.currentStreak ?? 0) > 0 ? '#FDE68A' : 'none'}
                                    strokeWidth={2}
                                />
                                <Text
                                    style={{ fontVariant: ['tabular-nums'] }}
                                    className="font-geist-bold text-[11px] text-amber-900"
                                >
                                    {streak?.currentStreak ?? 0}d Streak
                                </Text>
                            </Pressable>
                        </View>

                        {/* Compact 7-Day Velocity Bars */}
                        <View className="flex-row items-end justify-between px-1 pt-1.5 pb-0.5 gap-2">
                            {weekVelocity.map((day) => {
                                const barH = Math.max(8, Math.round(day.intensity * 38));
                                const barColor = day.hasStudied
                                    ? 'bg-amber-500'
                                    : day.isToday
                                    ? 'bg-[#001428]'
                                    : 'bg-[#CBD5E1]';

                                return (
                                    <Pressable
                                        key={day.dateString}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${day.dayLabel}, ${day.dayNumber}: ${
                                            day.hasStudied
                                                ? 'Study session completed'
                                                : day.isToday
                                                ? 'Due today'
                                                : 'No recorded activity'
                                        }`}
                                        className="flex-1 items-center gap-1 active:opacity-75"
                                    >
                                        {/* Status glyph on top of the bar */}
                                        <View className="h-3.5 items-center justify-center">
                                            {day.hasStudied ? (
                                                <IconFlame size={12} color="#D97706" fill="#FDE68A" strokeWidth={2} />
                                            ) : day.isToday ? (
                                                <View className="h-1.5 w-1.5 rounded-full bg-[#001428]" />
                                            ) : null}
                                        </View>

                                        {/* Visual Bar Pill */}
                                        <View className="h-[38px] w-full items-center justify-end">
                                            <View
                                                className={`w-full max-w-[20px] rounded-full ${barColor}`}
                                                style={{ height: barH }}
                                            />
                                        </View>

                                        {/* Day & Date Labels */}
                                        <View className="items-center">
                                            <Text
                                                className={`font-geist text-[10px] ${
                                                    day.isToday ? 'font-geist-bold text-[#001428]' : 'text-[#526071]'
                                                }`}
                                            >
                                                {day.dayLabel}
                                            </Text>
                                            <Text
                                                style={{ fontVariant: ['tabular-nums'] }}
                                                className={`font-geist text-[9px] ${
                                                    day.isToday ? 'font-geist-bold text-[#001428]' : 'text-[#94A3B8]'
                                                }`}
                                            >
                                                {day.dayNumber}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Bottom Footer Action Link */}
                        <View className="mt-2.5 flex-row items-center justify-between border-t border-[#F1F4F8] pt-2">
                            <Text className="font-geist text-[10px] text-[#526071]">
                                Weekly consistency • Amber indicates study
                            </Text>
                        </View>
                    </View>





                    {/* Active In-Progress Quiz Card on Dashboard (Compact Apple-style Capsule) */}
                    {activeQuiz && (() => {
                        const activeProgress = Math.round((activeQuiz.session.answeredCount / activeQuiz.questionCount) * 100);
                        return (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Resume active quiz for ${activeQuiz.sourceTitle || 'General Practice'}, ${activeProgress}% complete`}
                                accessibilityHint="Navigates to the active quiz session"
                                onPress={() => router.push(`/(main)/quizzes/${activeQuiz.session.id}`)}
                                className="overflow-hidden rounded-2xl border border-[#001428]/15 bg-white shadow-xs active:opacity-95"
                                style={({ pressed }) => [{
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed ? 0.985 : 1 }],
                                }]}
                            >
                                <View className="flex-row items-center justify-between p-3.5">
                                    <View className="flex-1 pr-3">
                                        <Text className="font-geist-semibold text-[11px] uppercase tracking-wider text-emerald-700">
                                            In Progress ({activeProgress}%)
                                        </Text>
                                        <Text numberOfLines={1} className="mt-1 font-geist-bold text-sm text-[#001428]">

                                            {activeQuiz.sourceTitle || 'General Practice'}
                                        </Text>
                                        <Text numberOfLines={1} className="mt-0.5 font-geist text-[11px] text-[#526071]">
                                            Question {activeQuiz.session.answeredCount} of {activeQuiz.questionCount} answered
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-1.5 rounded-full bg-[#001428] px-3 py-2 shadow-xs">
                                        <Text className="font-geist-semibold text-xs text-white">Resume</Text>
                                        <IconArrowRight size={13} color="white" />
                                    </View>
                                </View>
                                <View className="h-1 w-full bg-[#E2E8F0]">
                                    <View
                                        className="h-full bg-[#001428]"
                                        style={{ width: `${activeProgress}%` }}
                                    />
                                </View>
                            </Pressable>
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

                    {/* Weak-Topic Recommendation Card (Restored Layout with Refined Color Palette) */}
                    {recommendations.length > 0 && (() => {
                        const topRec = recommendations[0];
                        return (
                            <View
                                className="overflow-hidden rounded-3xl border border-[#001428]/15 bg-white p-5 shadow-sm gap-3"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <View className="flex-row items-center justify-between">
                                    <Text className="font-geist-bold text-sm text-[#001428]">
                                        {topRec.accuracy}% Accuracy <Text className="font-geist text-xs text-[#526071] font-normal">• {topRec.sampleCount} questions</Text>
                                    </Text>
                                </View>


                                <View>
                                    <Text numberOfLines={1} className="font-geist-bold text-base text-[#001428]">
                                        {topRec.topicName}
                                    </Text>
                                    <Text numberOfLines={2} className="mt-1 font-geist text-xs leading-5 text-[#526071]">
                                        {topRec.reason}
                                    </Text>
                                </View>

                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Practice recommended topic ${topRec.topicName}`}
                                    onPress={() => router.push({
                                        pathname: '/(main)/quizzes/create',
                                        params: { sourceKind: 'topic', topicId: topRec.topicId },
                                    })}
                                    className="flex-row items-center justify-center gap-2 rounded-2xl bg-[#001428] py-3.5 shadow-sm active:scale-[0.98] active:opacity-90"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className="font-geist-semibold text-xs text-white">Practice This Topic</Text>
                                    <IconArrowRight size={16} color="white" />
                                </Pressable>
                            </View>
                        );
                    })()}

                    {/* Modules Section Header */}
                    <View className="pt-2">
                        <Text accessibilityRole="header" className="font-geist-bold text-2xl tracking-tight text-[#001428]">
                            Your modules
                        </Text>
                        <Text className="mt-0.5 font-geist text-xs text-[#526071]">
                            Approved notes ready for interactive review
                        </Text>
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
