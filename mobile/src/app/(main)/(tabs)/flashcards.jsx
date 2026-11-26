import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import IconCards from '@tabler/icons-react-native/IconCards';
import IconPlus from '@tabler/icons-react-native/IconPlus';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconBook from '@tabler/icons-react-native/IconBook';
import IconClock from '@tabler/icons-react-native/IconClock';
import IconArrowRight from '@tabler/icons-react-native/IconArrowRight';
import { listFlashcardDecks, deleteFlashcardDeck } from '@/lib/flashcards';
import { useToast } from '@/providers/toast-provider';
import CardSkeletonList from '@/components/card-skeleton';
import { useAnimatedCount } from '@/hooks/use-animated-count';

function formatRelativeDate(dateString) {
    if (!dateString) return 'New';
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
    const hasLoaded = useRef(false);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else if (!hasLoaded.current) {
            setLoading(true);
        }
        setError(null);
        try {
            const data = await listFlashcardDecks();
            setDecks(data.sets ?? []);
            hasLoaded.current = true;
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
            'Delete Deck?',
            'This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleDeleteDeck(deck.id),
                },
            ]
        );
    }

    async function handleDeleteDeck(targetId) {
        if (!targetId || deletingId) return;
        setDeletingId(targetId);
        try {
            await deleteFlashcardDeck(targetId);
            setDecks(prev => prev.filter(d => d.id !== targetId));
            showToast('Deck deleted');
        } catch (err) {
            Alert.alert('Could not delete', err.message || 'Please try again.');
        } finally {
            setDeletingId(null);
        }
    }

    const moduleDecks = useMemo(() => decks.filter(d => d.sourceKind === 'module'), [decks]);
    const topicDecks = useMemo(() => decks.filter(d => d.sourceKind !== 'module'), [decks]);
    const totalTerms = useMemo(() => decks.reduce((acc, d) => acc + (d.cardCount || 0), 0), [decks]);

    const allCount = useAnimatedCount(decks.length);
    const moduleCount = useAnimatedCount(moduleDecks.length);
    const topicCount = useAnimatedCount(topicDecks.length);
    const termsCount = useAnimatedCount(totalTerms);

    const filteredDecks = useMemo(() => {
        if (selectedFilter === 'module') return moduleDecks;
        if (selectedFilter === 'topic') return topicDecks;
        return decks;
    }, [decks, selectedFilter, moduleDecks, topicDecks]);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
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
                {/* Header Action Bar */}
                <View className="gap-3 pt-0.5">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                            <Text accessibilityRole="header" className="font-geist-bold text-lg tracking-tight text-[#001428]">
                                Study Decks
                            </Text>
                            <Text style={{ fontVariant: ['tabular-nums'] }} className="mt-0.5 font-geist text-xs text-[#526071]">
                                {allCount} {allCount === 1 ? 'deck' : 'decks'} • {termsCount} {termsCount === 1 ? 'term' : 'terms'}
                            </Text>
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="New deck"
                            onPress={() => router.push('/flashcards/create')}
                            className="flex-row items-center gap-1.5 rounded-full bg-[#001428] px-4 py-2.5"
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

                    {/* Filter Choices */}
                    <View
                        className="flex-row rounded-xl bg-[#EAECEF] p-1"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <Pressable
                            accessibilityRole="tab"
                            accessibilityLabel={`All decks, ${allCount}`}
                            accessibilityState={{ selected: selectedFilter === 'all' }}
                            onPress={() => setSelectedFilter('all')}
                            className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                                selectedFilter === 'all'
                                    ? 'bg-white'
                                    : 'bg-transparent'
                            }`}
                            style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.8 : 1 }]}
                        >
                            <Text
                                style={{ fontVariant: ['tabular-nums'] }}
                                className={`text-xs ${
                                    selectedFilter === 'all'
                                        ? 'font-geist-semibold text-[#001428]'
                                        : 'font-geist text-[#526071]'
                                }`}
                            >
                                All ({allCount})
                            </Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="tab"
                            accessibilityLabel={`Module decks, ${moduleCount}`}
                            accessibilityState={{ selected: selectedFilter === 'module' }}
                            onPress={() => setSelectedFilter('module')}
                            className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                                selectedFilter === 'module'
                                    ? 'bg-white'
                                    : 'bg-transparent'
                            }`}
                            style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.8 : 1 }]}
                        >
                            <Text
                                style={{ fontVariant: ['tabular-nums'] }}
                                className={`text-xs ${
                                    selectedFilter === 'module'
                                        ? 'font-geist-semibold text-[#001428]'
                                        : 'font-geist text-[#526071]'
                                }`}
                            >
                                Modules ({moduleCount})
                            </Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="tab"
                            accessibilityLabel={`Topic decks, ${topicCount}`}
                            accessibilityState={{ selected: selectedFilter === 'topic' }}
                            onPress={() => setSelectedFilter('topic')}
                            className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                                selectedFilter === 'topic'
                                    ? 'bg-white'
                                    : 'bg-transparent'
                            }`}
                            style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.8 : 1 }]}
                        >
                            <Text
                                style={{ fontVariant: ['tabular-nums'] }}
                                className={`text-xs ${
                                    selectedFilter === 'topic'
                                        ? 'font-geist-semibold text-[#001428]'
                                        : 'font-geist text-[#526071]'
                                }`}
                            >
                                Topics ({topicCount})
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Error */}
                {error && (
                    <View
                        className="flex-row items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5"
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

                {/* Loading */}
                {loading && !refreshing && (
                    <CardSkeletonList count={3} type="deck" />
                )}

                {/* Global Empty State */}
                {!loading && decks.length === 0 && !error && (
                    <View
                        className="items-center rounded-3xl border border-[#E5E9F0] bg-white p-8 text-center"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View
                            className="mb-3.5 h-14 w-14 items-center justify-center rounded-2xl bg-[#001428]/5 border border-[#001428]/10"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <IconCards size={26} color="#001428" strokeWidth={1.8} />
                        </View>
                        <Text className="font-geist-bold text-base text-[#001428]">
                            No Decks Yet
                        </Text>
                        <Text className="mt-1 text-center font-geist text-xs text-[#526071] max-w-xs leading-5">
                            Create a deck from your notes or topics to start studying.
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Create flashcard deck"
                            onPress={() => router.push('/flashcards/create')}
                            className="mt-5 flex-row items-center gap-1.5 rounded-full bg-[#001428] px-4 py-2.5"
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed ? 0.96 : 1 }],
                                    opacity: pressed ? 0.9 : 1,
                                },
                            ]}
                        >
                            <IconPlus size={15} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="font-geist-semibold text-xs text-white">Create Deck</Text>
                        </Pressable>
                    </View>
                )}

                {/* Filter-Specific Empty State */}
                {!loading && decks.length > 0 && filteredDecks.length === 0 && !error && (
                    <View
                        className="items-center rounded-3xl border border-[#E5E9F0] bg-white p-7 text-center"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View
                            className="mb-3.5 h-14 w-14 items-center justify-center rounded-2xl bg-[#001428]/5 border border-[#001428]/10"
                            style={{ borderCurve: 'continuous' }}
                        >
                            {selectedFilter === 'module' ? (
                                <IconFileText size={24} color="#001428" strokeWidth={1.8} />
                            ) : (
                                <IconBook size={24} color="#001428" strokeWidth={1.8} />
                            )}
                        </View>
                        <Text className="font-geist-bold text-base text-[#001428]">
                            {selectedFilter === 'module' ? 'No Module Decks Yet' : 'No Topic Decks Yet'}
                        </Text>
                        <Text className="mt-1 text-center font-geist text-xs text-[#526071] max-w-xs leading-5">
                            {selectedFilter === 'module'
                                ? 'Generate flashcards directly from your uploaded lecture notes and study materials.'
                                : 'Study key definitions and terminology from pre-configured BSIT curriculum topics.'}
                        </Text>
                        <View className="mt-5 w-full max-w-xs gap-2.5">
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Create ${selectedFilter === 'module' ? 'module' : 'topic'} deck`}
                                onPress={() => router.push('/flashcards/create')}
                                className="flex-row items-center justify-center gap-1.5 rounded-2xl bg-[#001428] py-3 active:opacity-90"
                                style={({ pressed }) => [
                                    {
                                        borderCurve: 'continuous',
                                        transform: [{ scale: pressed ? 0.98 : 1 }],
                                    },
                                ]}
                            >
                                <IconPlus size={15} color="#FFFFFF" strokeWidth={2.5} />
                                <Text className="font-geist-semibold text-xs text-white">
                                    {selectedFilter === 'module' ? 'Create Module Deck' : 'Create Topic Deck'}
                                </Text>
                            </Pressable>

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Show all flashcard decks"
                                onPress={() => setSelectedFilter('all')}
                                className="flex-row items-center justify-center rounded-2xl border border-[#E4E8EE] bg-[#F8FAFC] py-2.5 active:bg-[#F1F4F8]"
                                style={({ pressed }) => [
                                    {
                                        borderCurve: 'continuous',
                                        transform: [{ scale: pressed ? 0.98 : 1 }],
                                    },
                                ]}
                            >
                                <Text className="font-geist-medium text-xs text-[#001428]">
                                    Show All Decks ({decks.length})
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Decks List */}
                {!loading && filteredDecks.map(deck => {
                    const isDeleting = deletingId === deck.id;
                    const isModule = deck.sourceKind === 'module';
                    const reviewCount = deck.reviewCount ?? 0;
                    const isNew = reviewCount === 0 && !deck.lastReviewedAt;

                    // For topics: subtitle shows only the curriculum subject (e.g. "Computer Science"),
                    // never repeating the topic name which is already the deck's main title.
                    // For modules: only show module title if deck title doesn't already contain it.
                    const subtitle = isModule
                        ? (deck.materialTitle && !deck.title.toLowerCase().includes(deck.materialTitle.toLowerCase().trim())
                            ? deck.materialTitle
                            : null)
                        : (deck.subjectName || null);

                    return (
                        <Pressable
                            key={deck.id}
                            disabled={isDeleting}
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${deck.title}`}
                            onPress={() => router.push(`/flashcards/${deck.id}`)}
                            className={isDeleting ? 'opacity-40' : ''}
                            style={({ pressed }) => [
                                {
                                    transform: [{ scale: pressed ? 0.985 : 1 }],
                                },
                            ]}
                        >
                            {({ pressed }) => (
                                <View>
                                    <View
                                        className="rounded-3xl border border-[#E5E9F0] p-4 shadow-2xs"
                                        style={{
                                            borderCurve: 'continuous',
                                            backgroundColor: pressed ? '#F8FAFC' : '#FFFFFF',
                                        }}
                                    >
                                        {/* Top Row: Source Icon, Tag + Subject/Module, Delete */}
                                        <View className="flex-row items-start justify-between gap-3">
                                            <View className="flex-1 flex-row items-start gap-3">
                                                <View
                                                    className="h-10 w-10 items-center justify-center rounded-xl border border-[#E4E8EE] bg-[#F1F4F8]"
                                                    style={{ borderCurve: 'continuous' }}
                                                >
                                                    {isModule ? (
                                                        <IconFileText size={18} color="#001428" strokeWidth={1.9} />
                                                    ) : (
                                                        <IconBook size={18} color="#001428" strokeWidth={1.9} />
                                                    )}
                                                </View>

                                                <View className="flex-1 min-w-0 pr-1">
                                                    <View className="flex-row items-center gap-1.5">
                                                        <View
                                                            className="rounded-full bg-[#F1F4F8] px-2 py-0.5"
                                                            style={{ borderCurve: 'continuous' }}
                                                        >
                                                            <Text className="font-geist-semibold text-[10px] uppercase tracking-wider text-[#526071]">
                                                                {isModule ? 'Module' : 'Topic'}
                                                            </Text>
                                                        </View>
                                                        {isNew && (
                                                            <View
                                                                className="rounded-full border border-blue-200/80 bg-blue-50 px-2 py-0.5"
                                                                style={{ borderCurve: 'continuous' }}
                                                            >
                                                                <Text className="font-geist-semibold text-[10px] text-blue-700">
                                                                    New
                                                                </Text>
                                                            </View>
                                                        )}
                                                        {subtitle && (
                                                            <Text
                                                                numberOfLines={1}
                                                                className="flex-1 font-geist text-[11px] text-[#526071]"
                                                            >
                                                                {subtitle}
                                                            </Text>
                                                        )}
                                                    </View>

                                                    <Text
                                                        numberOfLines={2}
                                                        className="mt-1.5 font-geist-bold text-[15px] leading-snug text-[#001428]"
                                                    >
                                                        {deck.title}
                                                    </Text>
                                                </View>
                                            </View>

                                            <Pressable
                                                hitSlop={12}
                                                disabled={isDeleting}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Delete ${deck.title}`}
                                                onPress={() => confirmDelete(deck)}
                                                className="h-8 w-8 items-center justify-center rounded-xl active:bg-rose-50"
                                                style={({ pressed: trashPressed }) => [
                                                    { borderCurve: 'continuous', opacity: trashPressed ? 0.7 : 1 },
                                                ]}
                                            >
                                                {isDeleting ? (
                                                    <ActivityIndicator size="small" color="#DC2626" />
                                                ) : (
                                                    <IconTrash size={16} color="#94A3B8" />
                                                )}
                                            </Pressable>
                                        </View>

                                        {/* Footer: Card Count, Review Recency, Study CTA */}
                                        <View className="mt-3.5 flex-row items-center justify-between border-t border-[#F1F3F6] pt-3">
                                            <View className="flex-row items-center gap-2.5">
                                                <View
                                                    className="flex-row items-center gap-1.5 rounded-full bg-[#F1F4F8] px-2.5 py-1"
                                                    style={{ borderCurve: 'continuous' }}
                                                >
                                                    <IconCards size={13} color="#001428" strokeWidth={2} />
                                                    <Text
                                                        style={{ fontVariant: ['tabular-nums'] }}
                                                        className="font-geist-semibold text-xs text-[#001428]"
                                                    >
                                                        {deck.cardCount} {deck.cardCount === 1 ? 'term' : 'terms'}
                                                    </Text>
                                                </View>

                                                <View className="flex-row items-center gap-1">
                                                    <IconClock size={12} color="#94A3B8" strokeWidth={2} />
                                                    <Text
                                                        style={{ fontVariant: ['tabular-nums'] }}
                                                        className="font-geist text-[11px] text-[#526071]"
                                                    >
                                                        {reviewCount > 0
                                                            ? `${reviewCount}× · ${formatRelativeDate(deck.lastReviewedAt)}`
                                                            : 'Not studied'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View
                                                className="flex-row items-center gap-1 rounded-full bg-[#001428] px-3.5 py-1.5"
                                                style={{ borderCurve: 'continuous' }}
                                            >
                                                <Text className="font-geist-semibold text-xs text-white">Study</Text>
                                                <IconArrowRight size={12} color="#FFFFFF" strokeWidth={2.5} />
                                            </View>
                                        </View>
                                    </View>

                                    {/* Subtle Stacked-Deck Edge */}
                                    <View
                                        className="mx-4 h-1.5 rounded-b-2xl border-x border-b border-[#E5E9F0] bg-[#F8FAFC]"
                                        style={{ borderCurve: 'continuous' }}
                                    />
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
