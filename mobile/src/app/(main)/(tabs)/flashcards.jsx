import { useCallback, useMemo, useState } from 'react';
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
import DeleteConfirmationModal from '@/components/delete-confirmation-modal';

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
    const [deckToDelete, setDeckToDelete] = useState(null);
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
        setDeckToDelete(deck);
    }

    async function handleDeleteDeck() {
        if (!deckToDelete || deletingId) return;
        const targetId = deckToDelete.id;
        setDeletingId(targetId);
        try {
            await deleteFlashcardDeck(targetId);
            setDecks(prev => prev.filter(d => d.id !== targetId));
            setDeckToDelete(null);
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
                {/* Header Action Bar */}
                <View className="gap-3 pt-0.5">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                            <Text accessibilityRole="header" className="font-geist-bold text-lg tracking-tight text-[#001428]">
                                Study Decks
                            </Text>
                            {!loading && (
                                <Text className="mt-0.5 font-geist text-xs text-[#64748B]">
                                    {decks.length} {decks.length === 1 ? 'deck' : 'decks'} • {totalTerms} {totalTerms === 1 ? 'term' : 'terms'}
                                </Text>
                            )}
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

                    {/* Filter */}
                    {!loading && decks.length > 0 && (
                        <View
                            className="flex-row rounded-xl bg-[#EAECEF] p-1"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <Pressable
                                onPress={() => setSelectedFilter('all')}
                                className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                                    selectedFilter === 'all'
                                        ? 'bg-white'
                                        : 'bg-transparent'
                                }`}
                                style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.8 : 1 }]}
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
                                        ? 'bg-white'
                                        : 'bg-transparent'
                                }`}
                                style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.8 : 1 }]}
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
                                        ? 'bg-white'
                                        : 'bg-transparent'
                                }`}
                                style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.8 : 1 }]}
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
                    <View className="items-center justify-center py-20 gap-3">
                        <ActivityIndicator size="small" color="#001428" />
                        <Text className="font-geist text-xs text-[#64748B]">Loading...</Text>
                    </View>
                )}

                {/* Empty State */}
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
                        <Text className="mt-1 text-center font-geist text-xs text-[#64748B] max-w-xs leading-5">
                            Create a deck from your modules or topics to begin reviewing.
                        </Text>
                        <Pressable
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

                {/* Decks List */}
                {!loading && filteredDecks.map(deck => {
                    const isDeleting = deletingId === deck.id;
                    const isModule = deck.sourceKind === 'module';

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
                            className={`rounded-3xl border border-[#E5E9F0] bg-white p-4 ${
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
                                        className="h-10 w-10 items-center justify-center rounded-xl bg-[#001428]"
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        {isModule ? (
                                            <IconFileText size={18} color="#FFFFFF" strokeWidth={1.8} />
                                        ) : (
                                            <IconBook size={18} color="#FFFFFF" strokeWidth={1.8} />
                                        )}
                                    </View>

                                    <View className="flex-1 pr-1">
                                        <View className="flex-row items-center gap-1.5">
                                            <View
                                                className="rounded-full bg-[#F1F4F8] px-2 py-0.5"
                                                style={{ borderCurve: 'continuous' }}
                                            >
                                                <Text className="font-geist-semibold text-[9px] uppercase tracking-wider text-[#64748B]">
                                                    {isModule ? 'Module' : 'Topic'}
                                                </Text>
                                            </View>
                                            {subtitle && (
                                                <Text
                                                    numberOfLines={1}
                                                    className="font-geist text-[11px] text-[#64748B] flex-1"
                                                >
                                                    {subtitle}
                                                </Text>
                                            )}
                                        </View>

                                        <Text
                                            numberOfLines={2}
                                            className="font-geist-bold text-[15px] leading-snug text-[#001428] mt-1"
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
                                    className="p-1 rounded-lg active:bg-rose-50"
                                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                >
                                    {isDeleting ? (
                                        <ActivityIndicator size="small" color="#DC2626" />
                                    ) : (
                                        <IconTrash size={16} color="#94A3B8" />
                                    )}
                                </Pressable>
                            </View>

                            {/* Footer */}
                            <View className="mt-3.5 flex-row items-center justify-between border-t border-[#F1F3F6] pt-3">
                                <View className="flex-row items-center gap-2">
                                    <View
                                        className="rounded-full bg-[#F1F4F8] px-2.5 py-0.5"
                                        style={{ borderCurve: 'continuous' }}
                                    >
                                        <Text
                                            style={{ fontVariant: ['tabular-nums'] }}
                                            className="font-geist-semibold text-xs text-[#001428]"
                                        >
                                            {deck.cardCount} terms
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center gap-1">
                                        <IconClock size={11} color="#94A3B8" />
                                        <Text className="font-geist text-[10px] text-[#64748B]">
                                            {formatRelativeDate(deck.lastReviewedAt)}
                                        </Text>
                                    </View>
                                </View>

                                <View
                                    className="flex-row items-center gap-1 rounded-full bg-[#001428] px-3 py-1"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className="font-geist-semibold text-xs text-white">Study</Text>
                                    <IconArrowRight size={12} color="#FFFFFF" strokeWidth={2.5} />
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Custom Delete Confirmation Modal */}
            <DeleteConfirmationModal
                visible={Boolean(deckToDelete)}
                title="Delete this Cards?"
                isDeleting={Boolean(deletingId)}
                onCancel={() => {
                    if (!deletingId) setDeckToDelete(null);
                }}
                onConfirm={handleDeleteDeck}
            />
        </SafeAreaView>
    );
}
