import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import IconCards from '@tabler/icons-react-native/IconCards';
import IconPlus from '@tabler/icons-react-native/IconPlus';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconBook from '@tabler/icons-react-native/IconBook';
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

    return (
        <SafeAreaView className="flex-1 bg-[#F8F8FF]" edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 16 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => load(true)}
                        tintColor="#001428"
                    />
                }
            >
                {/* Header CTA Card */}
                <View
                    className="flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white p-4"
                    style={{ borderCurve: 'continuous' }}
                >
                    <View className="flex-1 pr-3">
                        <Text className="font-geist-semibold text-base text-[#001428]">
                            Technical Flashcards
                        </Text>
                        <Text className="mt-0.5 font-geist text-xs text-[#526071]">
                            Review definitions, terms, and syntax cards.
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => router.push('/flashcards/create')}
                        className="flex-row items-center gap-1.5 rounded-full bg-[#001428] px-3.5 py-2 active:opacity-80"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <IconPlus size={16} color="#FFFFFF" />
                        <Text className="font-geist-medium text-xs text-white">New Deck</Text>
                    </Pressable>
                </View>

                {/* Error Banner */}
                {error && (
                    <View
                        className="flex-row items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3.5"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <Text className="flex-1 font-geist text-xs text-red-700">{error}</Text>
                        <Pressable onPress={() => load()} className="ml-2 py-1 px-2">
                            <Text className="font-geist-medium text-xs text-red-800 underline">Retry</Text>
                        </Pressable>
                    </View>
                )}

                {/* Loading State */}
                {loading && !refreshing && (
                    <View className="items-center justify-center py-16 gap-3">
                        <ActivityIndicator size="small" color="#001428" />
                        <Text className="font-geist text-xs text-[#526071]">Loading decks...</Text>
                    </View>
                )}

                {/* Empty State */}
                {!loading && decks.length === 0 && !error && (
                    <View
                        className="items-center rounded-2xl border border-dashed border-[#E4E8EE] bg-white p-8 text-center"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <View className="mb-3.5 h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F4F8]">
                            <IconCards size={24} color="#001428" />
                        </View>
                        <Text className="font-geist-semibold text-base text-[#001428]">
                            No Flashcard Decks Yet
                        </Text>
                        <Text className="mt-1 text-center font-geist text-xs leading-5 text-[#526071]">
                            Generate custom technical flashcard decks from your approved school modules or IT curriculum topics.
                        </Text>
                        <Pressable
                            onPress={() => router.push('/flashcards/create')}
                            className="mt-5 flex-row items-center gap-1.5 rounded-full bg-[#001428] px-4 py-2.5 active:opacity-80"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <IconPlus size={16} color="#FFFFFF" />
                            <Text className="font-geist-medium text-xs text-white">Create First Deck</Text>
                        </Pressable>
                    </View>
                )}

                {/* Decks List */}
                {!loading && decks.map(deck => {
                    const isDeleting = deletingId === deck.id;
                    const isModule = deck.sourceKind === 'module';
                    const subtitle = isModule
                        ? (deck.materialTitle || 'Course Module')
                        : (deck.topicName ? `${deck.subjectName || 'IT'} • ${deck.topicName}` : 'General IT Review');

                    return (
                        <Pressable
                            key={deck.id}
                            disabled={isDeleting}
                            onPress={() => router.push(`/flashcards/${deck.id}`)}
                            className={`rounded-2xl border border-[#E4E8EE] bg-white p-4 active:bg-[#F8F8FF] ${
                                isDeleting ? 'opacity-40' : ''
                            }`}
                            style={{ borderCurve: 'continuous' }}
                        >
                            <View className="flex-row items-start justify-between gap-3">
                                <View className="flex-1 gap-1">
                                    <View className="flex-row items-center gap-1.5 flex-wrap">
                                        <View className="flex-row items-center gap-1 rounded-md bg-[#F1F4F8] px-2 py-0.5">
                                            {isModule ? (
                                                <IconFileText size={12} color="#526071" />
                                            ) : (
                                                <IconBook size={12} color="#526071" />
                                            )}
                                            <Text className="font-geist-medium text-[10px] uppercase tracking-wider text-[#526071]">
                                                {isModule ? 'Module' : 'Topic'}
                                            </Text>
                                        </View>
                                        <Text
                                            numberOfLines={1}
                                            className="font-geist text-xs text-[#526071]"
                                        >
                                            {subtitle}
                                        </Text>
                                    </View>
                                    <Text className="font-geist-semibold text-base text-[#001428] mt-0.5">
                                        {deck.title}
                                    </Text>
                                </View>

                                <Pressable
                                    hitSlop={12}
                                    disabled={isDeleting}
                                    onPress={() => confirmDelete(deck)}
                                    className="p-1 rounded-lg active:bg-red-50"
                                >
                                    {isDeleting ? (
                                        <ActivityIndicator size="small" color="#DC2626" />
                                    ) : (
                                        <IconTrash size={18} color="#9CA3AF" />
                                    )}
                                </Pressable>
                            </View>

                            {/* Footer chips */}
                            <View className="mt-3.5 flex-row items-center justify-between border-t border-[#F1F4F8] pt-3">
                                <View className="flex-row items-center gap-2">
                                    <View className="rounded-full bg-[#F1F4F8] px-2.5 py-1">
                                        <Text className="font-geist-medium text-[11px] text-[#001428]">
                                            {deck.cardCount} {deck.cardCount === 1 ? 'term' : 'terms'}
                                        </Text>
                                    </View>
                                    <Text className="font-geist text-[11px] text-[#526071]">
                                        {formatRelativeDate(deck.lastReviewedAt)}
                                    </Text>
                                </View>

                                <View className="flex-row items-center gap-0.5">
                                    <Text className="font-geist-medium text-xs text-[#001428]">Study</Text>
                                    <IconChevronRight size={14} color="#001428" />
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
