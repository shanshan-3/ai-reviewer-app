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
            setError(err.message || 'Could not create deck. Please try again.');
        } finally {
            setGenerating(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]" edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View className="flex-row items-center gap-3 border-b border-[#F1F3F6] bg-white px-5 py-3.5">
                <Pressable
                    hitSlop={10}
                    disabled={generating}
                    onPress={() => router.back()}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-[#F1F4F8] active:bg-[#E2E8F0]"
                    style={{ borderCurve: 'continuous' }}
                >
                    <IconArrowLeft size={18} color="#001428" />
                </Pressable>
                <Text className="font-geist-bold text-base text-[#001428]">New Deck</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 18, gap: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
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
                <View className="gap-2">
                    <Text className="font-geist-bold text-xs uppercase tracking-wider text-[#64748B]">
                        Cards
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
                                            : 'border-[#E5E9F0] bg-white active:bg-[#F1F4F8]'
                                    }`}
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className={`font-geist-bold text-sm ${
                                            selected ? 'text-white' : 'text-[#001428]'
                                        }`}
                                    >
                                        {count}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Deck Title */}
                <View className="gap-2">
                    <Text className="font-geist-bold text-xs uppercase tracking-wider text-[#64748B]">
                        Deck Title
                    </Text>
                    <TextInput
                        value={customTitle}
                        onChangeText={setCustomTitle}
                        placeholder="Auto-generated if left blank"
                        placeholderTextColor="#94A3B8"
                        editable={!generating}
                        className="rounded-2xl border border-[#E5E9F0] bg-white px-4 py-3.5 font-geist text-sm text-[#001428]"
                        style={{ borderCurve: 'continuous' }}
                    >
                    </TextInput>
                </View>

                {/* Error Banner */}
                {error && (
                    <View
                        className="rounded-xl border border-rose-200 bg-rose-50 p-3.5"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <Text className="font-geist text-xs text-rose-800">{error}</Text>
                    </View>
                )}

                {/* Submit Action */}
                <View className="pt-2">
                    <Pressable
                        disabled={!isSourceReady || generating}
                        onPress={handleGenerate}
                        className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                            !isSourceReady || generating
                                ? 'bg-[#94A3B8]/30 opacity-70'
                                : 'bg-[#001428] active:opacity-90'
                        }`}
                        style={({ pressed }) => [
                            {
                                borderCurve: 'continuous',
                                transform: [{ scale: pressed && isSourceReady && !generating ? 0.98 : 1 }],
                            },
                        ]}
                    >
                        {generating ? (
                            <>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                                <Text className="font-geist-semibold text-sm text-white">
                                    Creating...
                                </Text>
                            </>
                        ) : (
                            <>
                                <IconSparkles size={16} color="#FFFFFF" />
                                <Text className="font-geist-semibold text-sm text-white">
                                    Create Deck
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
