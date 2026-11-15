import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import IconCards from '@tabler/icons-react-native/IconCards';
import IconPlus from '@tabler/icons-react-native/IconPlus';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconBook from '@tabler/icons-react-native/IconBook';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import IconBrain from '@tabler/icons-react-native/IconBrain';
import IconClock from '@tabler/icons-react-native/IconClock';
import { listFlashcardDecks, deleteFlashcardDeck } from '@/lib/flashcards';
import { useToast } from '@/providers/toast-provider';

function formatRelativeDate(dateString) {
    if (!dateString) return 'Not yet reviewed';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function FlashcardsPage() {
    const router = useRouter();
    const showToast = useToast();
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'module' | 'topic'

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const data = await listFlashcardDecks();
            setDecks(data.sets ?? []);
        } catch (err) {
            setError(err.message || 'Could not load flashcard decks.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    function confirmDelete(deck) {
        if (deletingId) return;
        Alert.alert(
            'Delete Flashcard Deck?',
            `Permanently delete "${deck.title}"? Its ${deck.cardCount} terms and review history will be removed. This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingId(deck.id);
                        try {
                            await deleteFlashcardDeck(deck.id);
                            setDecks(prev => prev.filter(d => d.id !== deck.id));
                            showToast('Flashcard deck deleted');
                        } catch (err) {
                            Alert.alert('Could not delete deck', err.message || 'Please try again.');
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    }

    // Filtered decks & metrics
    const moduleDecks = useMemo(() => decks.filter(d => d.sourceKind === 'module'), [decks]);
    const topicDecks = useMemo(() => decks.filter(d => d.sourceKind !== 'module'), [decks]);
    const totalTerms = useMemo(() => decks.reduce((acc, d) => acc + (d.cardCount || 0), 0), [decks]);

    const filteredDecks = useMemo(() => {
        if (selectedFilter === 'module') return moduleDecks;
        if (selectedFilter === 'topic') return topicDecks;
        return decks;
    }, [decks, selectedFilter, moduleDecks, topicDecks]);

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]" edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={{ padding: 18, paddingBottom: 110, gap: 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => load(true)}
                        tintColor="#001428"
                    />
                }
            >
                {/* Apple HIG Header Area */}
                <View className="gap-3 pt-1">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                            <Text className="font-geist-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                                Study Suite
                            </Text>
                            <Text className="font-geist-bold text-2xl tracking-tight text-[#001428]">
                                Flashcards
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Create new flashcard deck"
                            onPress={() => router.push('/flashcards/create')}
                            className="flex-row items-center gap-1.5 rounded-full bg-[#001428] px-4 py-2.5 shadow-xs"
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed ? 0.96 : 1 }],
                                    opacity: pressed ? 0.9 : 1,
                                },
                            ]}
                        >
                            <IconPlus size={15} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="font-geist-semibold text-xs text-white">New Deck</Text>
                        </Pressable>
                    </View>

                    {/* Quick Stats Summary Bar (Apple Activity Style) */}
                    {!loading && decks.length > 0 && (
                        <View
                            className="flex-row items-center justify-between rounded-2xl border border-[#E5E9F0] bg-white p-3.5 shadow-2xs"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <View className="flex-1 flex-row items-center gap-2.5">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-xl bg-[#F1F4F8]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconCards size={16} color="#001428" strokeWidth={2} />
                                </View>
                                <View>
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-sm text-[#001428]"
                                    >
                                        {decks.length}
                                    </Text>
                                    <Text className="font-geist text-[10px] text-[#64748B]">
                                        Total Decks
                                    </Text>
                                </View>
                            </View>

                            <View className="h-6 w-[1px] bg-[#E5E9F0]" />

                            <View className="flex-1 flex-row items-center gap-2.5 pl-3">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-xl bg-[#F1F4F8]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconBrain size={16} color="#001428" strokeWidth={2} />
                                </View>
                                <View>
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-sm text-[#001428]"
                                    >
                                        {totalTerms}
                                    </Text>
                                    <Text className="font-geist text-[10px] text-[#64748B]">
                                        Total Terms
                                    </Text>
                                </View>
                            </View>

                            <View className="h-6 w-[1px] bg-[#E5E9F0]" />

                            <View className="flex-1 flex-row items-center gap-2.5 pl-3">
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-xl bg-[#F1F4F8]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <IconSparkles size={16} color="#001428" strokeWidth={2} />
                                </View>
                                <View>
                                    <Text className="font-geist-bold text-sm text-[#001428]">
                                        Active
                                    </Text>
                                    <Text className="font-geist text-[10px] text-[#64748B]">
                                        Spaced Rep
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Apple Segmented Control Filter */}
                    {!loading && decks.length > 0 && (
                        <View
                            className="flex-row rounded-xl bg-[#EAECEF] p-1"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <Pressable
                                onPress={() => setSelectedFilter('all')}
                                className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                                    selectedFilter === 'all'
                                        ? 'bg-white shadow-2xs'
                                        : 'bg-transparent'
                                }`}
                                style={({ pressed }) => [
                                    {
                                        borderCurve: 'continuous',
                                        opacity: pressed ? 0.8 : 1,
                                    },
                                ]}
                            >
                                <Text
                                    className={`text-xs ${
                                        selectedFilter === 'all'
                                            ? 'font-geist-semibold text-[#001428]'
                                            : 'font-geist text-[#64748B]'
                                    }`}
                                >
                                    All ({decks.length})
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setSelectedFilter('module')}
                                className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                                    selectedFilter === 'module'
                                        ? 'bg-white shadow-2xs'
                                        : 'bg-transparent'
                                }`}
                                style={({ pressed }) => [
                                    {
                                        borderCurve: 'continuous',
                                        opacity: pressed ? 0.8 : 1,
                                    },
                                ]}
                            >
                                <Text
                                    className={`text-xs ${
                                        selectedFilter === 'module'
                                            ? 'font-geist-semibold text-[#001428]'
                                            : 'font-geist text-[#64748B]'
                                    }`}
                                >
                                    Modules ({moduleDecks.length})
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setSelectedFilter('topic')}
                                className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                                    selectedFilter === 'topic'
                                        ? 'bg-white shadow-2xs'
                                        : 'bg-transparent'
                                }`}
                                style={({ pressed }) => [
                                    {
                                        borderCurve: 'continuous',
                                        opacity: pressed ? 0.8 : 1,
                                    },
                                ]}
                            >
                                <Text
                                    className={`text-xs ${
                                        selectedFilter === 'topic'
                                            ? 'font-geist-semibold text-[#001428]'
                                            : 'font-geist text-[#64748B]'
                                    }`}
                                >
                                    Topics ({topicDecks.length})
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* Error Banner */}
                {error && (
                    <View
                        className="flex-row items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 shadow-2xs"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <Text className="flex-1 font-geist text-xs text-rose-800 leading-snug">
                            {error}
                        </Text>
                        <Pressable
                            onPress={() => load()}
                            className="ml-2 rounded-lg bg-rose-100 px-2.5 py-1 active:opacity-75"
                        >
                            <Text className="font-geist-semibold text-xs text-rose-900">Retry</Text>
                        </Pressable>
                    </View>
                )}

                {/* Loading State */}
                {loading && !refreshing && (
                    <View className="items-center justify-center py-20 gap-3">
                        <ActivityIndicator size="small" color="#001428" />
                        <Text className="font-geist text-xs text-[#64748B]">Loading flashcards...</Text>
                    </View>
                )}

                {/* Empty State (Apple Clean HIG Style) */}
                {!loading && decks.length === 0 && !error && (
                    <View
                        className="items-center rounded-3xl border border-[#E5E9F0] bg-white p-8 shadow-2xs text-center"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View
                            className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-[#001428]/5 border border-[#001428]/10"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <IconCards size={30} color="#001428" strokeWidth={1.8} />
                        </View>
                        <Text className="font-geist-bold text-lg text-[#001428]">
                            No Flashcard Decks Yet
                        </Text>
                        <Text className="mt-1.5 text-center font-geist text-xs leading-5 text-[#64748B] max-w-xs">
                            Create custom technical revision decks from your uploaded modules or IT curriculum topics to master key terms.
                        </Text>
                        <Pressable
                            onPress={() => router.push('/flashcards/create')}
                            className="mt-6 flex-row items-center gap-2 rounded-full bg-[#001428] px-5 py-3 shadow-xs"
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed ? 0.96 : 1 }],
                                    opacity: pressed ? 0.9 : 1,
                                },
                            ]}
                        >
                            <IconPlus size={16} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="font-geist-semibold text-xs text-white">Create First Deck</Text>
                        </Pressable>
                    </View>
                )}

                {/* Decks List (Apple Inset Grouped Bento) */}
                {!loading && filteredDecks.map(deck => {
                    const isDeleting = deletingId === deck.id;
                    const isModule = deck.sourceKind === 'module';
                    const subtitle = isModule
                        ? (deck.materialTitle || 'Course Module')
                        : (deck.topicName ? `${deck.subjectName || 'IT'} • ${deck.topicName}` : 'General IT Review');

                    return (
                        <Pressable
                            key={deck.id}
                            disabled={isDeleting}
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${deck.title} deck`}
                            onPress={() => router.push(`/flashcards/${deck.id}`)}
                            className={`rounded-2xl border border-[#E5E9F0] bg-white p-4 shadow-2xs ${
                                isDeleting ? 'opacity-40' : ''
                            }`}
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed ? 0.985 : 1 }],
                                    backgroundColor: pressed ? '#F8F9FC' : '#FFFFFF',
                                },
                            ]}
                        >
                            <View className="flex-row items-start justify-between gap-3">
                                <View className="flex-1 flex-row items-start gap-3">
                                    <View
                                        className="h-10 w-10 items-center justify-center rounded-xl bg-[#001428] shadow-xs"
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        {isModule ? (
                                            <IconFileText size={18} color="#FFFFFF" strokeWidth={2} />
                                        ) : (
                                            <IconBook size={18} color="#FFFFFF" strokeWidth={2} />
                                        )}
                                    </View>

                                    <View className="flex-1 pr-1">
                                        <Text
                                            numberOfLines={1}
                                            className="font-geist-semibold text-[10px] uppercase tracking-wider text-[#64748B]"
                                        >
                                            {isModule ? 'Module Deck' : 'Topic Deck'} • {subtitle}
                                        </Text>
                                        <Text
                                            numberOfLines={2}
                                            className="font-geist-bold text-[15px] leading-snug text-[#001428] mt-0.5"
                                        >
                                            {deck.title}
                                        </Text>
                                    </View>
                                </View>

                                <Pressable
                                    hitSlop={12}
                                    disabled={isDeleting}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Delete ${deck.title} deck`}
                                    onPress={() => confirmDelete(deck)}
                                    className="p-1.5 rounded-lg active:bg-rose-50"
                                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                >
                                    {isDeleting ? (
                                        <ActivityIndicator size="small" color="#DC2626" />
                                    ) : (
                                        <IconTrash size={16} color="#94A3B8" />
                                    )}
                                </Pressable>
                            </View>

                            {/* Card Footer Divider & Metadata */}
                            <View className="mt-3.5 flex-row items-center justify-between border-t border-[#F1F3F6] pt-3">
                                <View className="flex-row items-center gap-2">
                                    <View
                                        className="rounded-full bg-[#F1F4F8] px-2.5 py-0.5"
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        <Text
                                            style={{ fontVariant: ['tabular-nums'] }}
                                            className="font-geist-semibold text-[11px] text-[#001428]"
                                        >
                                            {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center gap-1">
                                        <IconClock size={12} color="#94A3B8" />
                                        <Text className="font-geist text-[11px] text-[#64748B]">
                                            {formatRelativeDate(deck.lastReviewedAt)}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center gap-1 rounded-full bg-[#F1F4F8] px-2.5 py-1">
                                    <Text className="font-geist-semibold text-[11px] text-[#001428]">Study</Text>
                                    <IconChevronRight size={13} color="#001428" strokeWidth={2.5} />
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
