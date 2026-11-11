import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import SourcePicker from '@/components/source-picker';
import { listMaterials, getMaterialLabels } from '@/lib/materials';
import { createFlashcardDeck } from '@/lib/flashcards';

export default function CreateFlashcardDeckPage() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Source state
    const [sourceKind, setSourceKind] = useState(params.sourceKind === 'topic' ? 'topic' : 'module');
    const [materialId, setMaterialId] = useState(params.materialId || null);
    const [topicId, setTopicId] = useState(params.topicId || null);

    // Options state
    const [cardCount, setCardCount] = useState(10);
    const [customTitle, setCustomTitle] = useState('');

    // Data state
    const [materials, setMaterials] = useState([]);
    const [labels, setLabels] = useState({ subjects: [], topics: [] });
    const [loadingData, setLoadingData] = useState(true);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function init() {
            setLoadingData(true);
            try {
                const [matRes, labelRes] = await Promise.all([
                    listMaterials().catch(() => ({ materials: [] })),
                    getMaterialLabels().catch(() => ({ subjects: [], topics: [] })),
                ]);
                setMaterials(matRes.materials ?? []);
                setLabels(labelRes ?? { subjects: [], topics: [] });
            } finally {
                setLoadingData(false);
            }
        }
        init();
    }, []);

    const isSourceReady = sourceKind === 'module' ? Boolean(materialId) : Boolean(topicId);

    async function handleGenerate() {
        if (!isSourceReady || generating) return;
        setGenerating(true);
        setError(null);

        try {
            const source = sourceKind === 'module'
                ? { kind: 'module', materialId }
                : { kind: 'topic', topicId };

            const res = await createFlashcardDeck({
                source,
                cardCount,
                title: customTitle.trim() || undefined,
            });

            router.replace(`/flashcards/${res.setId}`);
        } catch (err) {
            setError(err.message || 'Could not generate flashcard deck. Please try again.');
        } finally {
            setGenerating(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F8F8FF]" edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View className="flex-row items-center gap-3 border-b border-[#E4E8EE] bg-white px-5 py-3.5">
                <Pressable
                    hitSlop={10}
                    disabled={generating}
                    onPress={() => router.back()}
                    className="rounded-full p-1 active:bg-[#F1F4F8]"
                >
                    <IconArrowLeft size={22} color="#001428" />
                </Pressable>
                <Text className="font-geist-semibold text-lg text-[#001428]">New Flashcards</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}>
                {/* Source Selection */}
                <SourcePicker
                    sourceKind={sourceKind}
                    onSelectKind={k => {
                        setSourceKind(k);
                        setError(null);
                    }}
                    selectedMaterialId={materialId}
                    onSelectMaterial={setMaterialId}
                    selectedTopicId={topicId}
                    onSelectTopic={setTopicId}
                    materials={materials}
                    labels={labels}
                    onLabelsChange={setLabels}
                    loading={loadingData}
                />

                {/* Card Count Options */}
                <View className="gap-2.5">
                    <Text className="font-geist-medium text-xs uppercase tracking-wider text-[#526071]">
                        Number of Terms
                    </Text>
                    <View className="flex-row gap-2.5">
                        {[5, 10, 15, 20].map(count => {
                            const selected = cardCount === count;
                            return (
                                <Pressable
                                    key={count}
                                    disabled={generating}
                                    onPress={() => setCardCount(count)}
                                    className={`flex-1 items-center justify-center rounded-2xl border py-3 ${
                                        selected
                                            ? 'border-[#001428] bg-[#001428]'
                                            : 'border-[#E4E8EE] bg-white active:bg-[#F1F4F8]'
                                    }`}
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text
                                        className={`font-geist-semibold text-sm ${
                                            selected ? 'text-white' : 'text-[#001428]'
                                        }`}
                                    >
                                        {count}
                                    </Text>
                                    <Text
                                        className={`font-geist text-[10px] ${
                                            selected ? 'text-white/70' : 'text-[#526071]'
                                        }`}
                                    >
                                        cards
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Custom Deck Title (Optional) */}
                <View className="gap-2">
                    <Text className="font-geist-medium text-xs uppercase tracking-wider text-[#526071]">
                        Custom Deck Title (Optional)
                    </Text>
                    <TextInput
                        value={customTitle}
                        onChangeText={setCustomTitle}
                        placeholder="Auto-generated if left blank"
                        placeholderTextColor="#9CA3AF"
                        editable={!generating}
                        className="rounded-2xl border border-[#E4E8EE] bg-white px-4 py-3 font-geist text-sm text-[#001428]"
                        style={{ borderCurve: 'continuous' }}
                    />
                </View>

                {/* Error Banner */}
                {error && (
                    <View
                        className="rounded-xl border border-red-200 bg-red-50 p-3.5"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <Text className="font-geist text-xs text-red-700">{error}</Text>
                    </View>
                )}

                {/* Submit Action */}
                <View className="gap-2 pt-2">
                    <Pressable
                        disabled={!isSourceReady || generating}
                        onPress={handleGenerate}
                        className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 shadow-sm ${
                            !isSourceReady || generating
                                ? 'bg-[#526071]/40 opacity-70'
                                : 'bg-[#001428] active:opacity-90'
                        }`}
                        style={{ borderCurve: 'continuous' }}
                    >
                        {generating ? (
                            <>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                                <Text className="font-geist-semibold text-sm text-white">
                                    Extracting Terms with AI...
                                </Text>
                            </>
                        ) : (
                            <>
                                <IconSparkles size={18} color="#FFFFFF" />
                                <Text className="font-geist-semibold text-sm text-white">
                                    Generate Flashcards
                                </Text>
                            </>
                        )}
                    </Pressable>
                    <Text className="text-center font-geist text-xs text-[#526071]">
                        Extracts key concepts, definitions, and code syntax from the source.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
