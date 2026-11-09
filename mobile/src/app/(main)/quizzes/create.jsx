import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import SourcePicker from '@/components/source-picker';
import { listMaterials, getMaterialLabels } from '@/lib/materials';
import { createQuizGeneration, getQuizGeneration, startQuizSession } from '@/lib/quizzes';

export default function CreateQuizPage() {
    const router = useRouter();

    // Source state
    const [sourceKind, setSourceKind] = useState('module');
    const [materialId, setMaterialId] = useState(null);
    const [topicId, setTopicId] = useState(null);

    // Options state
    const [questionType, setQuestionType] = useState('conceptual');
    const [questionCount, setQuestionCount] = useState(10);
    const [startingDifficulty, setStartingDifficulty] = useState('medium');

    // Data state
    const [materials, setMaterials] = useState([]);
    const [labels, setLabels] = useState({ subjects: [], topics: [] });
    const [loadingData, setLoadingData] = useState(true);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [genStatusText, setGenStatusText] = useState('');
    const [error, setError] = useState(null);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const timer = setInterval(() => {
            setCooldownSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setError(null);
                    return 0;
                }
                const next = prev - 1;
                setError(`Rate limit cooldown active. Please wait ${next}s before generating.`);
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldownSeconds]);

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

                const ready = (matRes.materials ?? []).filter(m => m.status === 'ready');
                if (ready.length > 0) {
                    setMaterialId(ready[0].id);
                } else if ((labelRes.topics ?? []).length > 0) {
                    setSourceKind('topic');
                    setTopicId(labelRes.topics[0].id);
                }
            } catch {
                // non-fatal
            } finally {
                setLoadingData(false);
            }
        }
        init();
    }, []);

    async function handleGenerate() {
        if (generating || cooldownSeconds > 0) return;
        setError(null);
        if (sourceKind === 'module' && !materialId) {
            setError('Please select an approved module.');
            return;
        }
        if (sourceKind === 'topic' && !topicId) {
            setError('Please select an IT topic.');
            return;
        }

        setGenerating(true);
        setGenStatusText('Submitting generation request...');

        try {
            const source = sourceKind === 'module'
                ? { kind: 'module', materialId }
                : { kind: 'topic', topicId };

            const genRes = await createQuizGeneration({
                source,
                questionType,
                questionCount,
                startingDifficulty,
            });

            const generationId = genRes.generation?.id;
            if (!generationId) throw new Error('Could not start quiz generation.');

            // Poll generation status
            let attempts = 0;
            const maxAttempts = 30; // 60s max
            let quizId = null;

            setGenStatusText('AI is formulating questions & answer key...');

            while (attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 2000));
                attempts++;

                const statusRes = await getQuizGeneration(generationId);
                const currentStatus = statusRes.generation?.status;

                if (currentStatus === 'ready') {
                    quizId = statusRes.generation.quizId;
                    break;
                }
                if (currentStatus === 'insufficient_source') {
                    const code = statusRes.generation?.errorCode;
                    if (code === 'UNSUPPORTED_TOPIC') {
                        throw new Error('This subject does not support coding syntax questions. Choose Multiple Choice or True/False, or select a programming subject like Web Development.');
                    }
                    if (code === 'CODE_SOURCE_REQUIRED') {
                        throw new Error('This module does not contain programming code. Choose Multiple Choice or True/False, or upload a module with code.');
                    }
                    throw new Error('This source has limited content for the requested question count. Try selecting 5 questions, or choose an IT Topic for broader practice.');
                }
                if (currentStatus === 'failed') {
                    const code = statusRes.generation?.errorCode;
                    throw new Error(
                        code === 'QUOTA_EXCEEDED'
                            ? 'AI rate limit reached. Please wait a minute and try again.'
                            : code === 'PROVIDER_TIMEOUT'
                            ? 'AI generation timed out. Please try again with fewer questions.'
                            : 'Quiz generation failed. Please try again with different choices.'
                    );
                }
            }

            if (!quizId) throw new Error('Generation took too long. Check the Quizzes tab shortly.');

            setGenStatusText('Starting study session...');
            const sessionRes = await startQuizSession(quizId);
            const sessionId = sessionRes.session?.id;

            if (!sessionId) throw new Error('Could not initialize study session.');

            // Navigate to active quiz
            router.replace(`/(main)/quizzes/${sessionId}`);
        } catch (err) {
            const retry = err.retryAfter ? Math.ceil(Number(err.retryAfter)) : 0;
            if (retry > 0) {
                setCooldownSeconds(retry);
                setError(`Rate limit cooldown active. Please wait ${retry}s before generating.`);
            } else {
                setError(err.message || 'Generation failed.');
            }
            setGenerating(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            {/* Header */}
            <View className="flex-row items-center border-b border-[#E4E8EE] bg-white px-4 py-3">
                <Pressable
                    disabled={generating}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={() => router.back()}
                    className="mr-3 h-10 w-10 items-center justify-center rounded-full active:bg-[#F1F4F8]"
                >
                    <IconArrowLeft size={22} color="#001428" />
                </Pressable>
                <Text className="font-geist-semibold text-lg text-[#001428]">Create New Quiz</Text>
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

                {/* Question Modality */}
                <View className="gap-2.5">
                    <Text className="font-geist-medium text-xs uppercase tracking-wider text-[#526071]">
                        Question Modality
                    </Text>
                    <View className="gap-2">
                        {[
                            { id: 'conceptual', title: 'Multiple Choice', desc: '4 options on concepts, definitions, and theory' },
                            { id: 'true_false', title: 'True or False', desc: 'Factual technical assertions with 2 options' },
                            { id: 'coding_syntax', title: 'Coding Syntax', desc: 'Code snippets testing output, syntax, and logic' },
                        ].map(m => {
                            const selected = questionType === m.id;
                            return (
                                <Pressable
                                    key={m.id}
                                    disabled={generating}
                                    onPress={() => setQuestionType(m.id)}
                                    className={`rounded-2xl border p-4 ${
                                        selected
                                            ? 'border-[#001428] bg-[#F1F4F8]'
                                            : 'border-[#E4E8EE] bg-white active:bg-[#F1F4F8]'
                                    }`}
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className="font-geist-semibold text-sm text-[#001428]">
                                        {m.title}
                                    </Text>
                                    <Text className="mt-0.5 font-geist text-xs leading-4 text-[#526071]">
                                        {m.desc}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Question Count */}
                <View className="gap-2.5">
                    <Text className="font-geist-medium text-xs uppercase tracking-wider text-[#526071]">
                        Question Count
                    </Text>
                    <View className="flex-row gap-3">
                        {[5, 10, 20].map(cnt => {
                            const selected = questionCount === cnt;
                            return (
                                <Pressable
                                    key={cnt}
                                    disabled={generating}
                                    onPress={() => setQuestionCount(cnt)}
                                    className={`flex-1 items-center justify-center rounded-2xl border py-3.5 ${
                                        selected
                                            ? 'border-[#001428] bg-[#F1F4F8]'
                                            : 'border-[#E4E8EE] bg-white active:bg-[#F1F4F8]'
                                    }`}
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className="font-geist-bold text-base text-[#001428]">
                                        {cnt}
                                    </Text>
                                    <Text className="font-geist text-xs text-[#526071]">Questions</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Difficulty Level */}
                <View className="gap-2.5">
                    <Text className="font-geist-medium text-xs uppercase tracking-wider text-[#526071]">
                        Difficulty Level
                    </Text>
                    <View className="flex-row gap-2">
                        {['easy', 'medium', 'hard'].map(diff => {
                            const selected = startingDifficulty === diff;
                            return (
                                <Pressable
                                    key={diff}
                                    disabled={generating}
                                    onPress={() => setStartingDifficulty(diff)}
                                    className={`flex-1 items-center justify-center rounded-2xl border py-3 capitalize ${
                                        selected
                                            ? 'border-[#001428] bg-[#F1F4F8]'
                                            : 'border-[#E4E8EE] bg-white active:bg-[#F1F4F8]'
                                    }`}
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <Text className="font-geist-medium text-sm text-[#001428]">
                                        {diff}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Error Banner */}
                {error && (
                    <View className={`rounded-2xl border ${cooldownSeconds > 0 ? 'border-[#001428] bg-[#F1F4F8]' : 'border-[#DC2626] bg-white'} p-4`}>
                        <Text className={`font-geist text-sm ${cooldownSeconds > 0 ? 'font-geist-medium text-[#001428]' : 'text-[#DC2626]'}`}>{error}</Text>
                    </View>
                )}

                {/* Generate Action Button */}
                <View className="pt-2">
                    {generating ? (
                        <View className="items-center justify-center gap-3 rounded-2xl border border-[#001428] bg-[#F1F4F8] p-5">
                            <ActivityIndicator size="small" color="#001428" />
                            <Text className="text-center font-geist-medium text-sm text-[#001428]">
                                {genStatusText}
                            </Text>
                        </View>
                    ) : (
                        <Pressable
                            disabled={cooldownSeconds > 0}
                            accessibilityRole="button"
                            accessibilityLabel={cooldownSeconds > 0 ? `Rate limit cooldown active. Please wait ${cooldownSeconds} seconds` : "Generate Quiz"}
                            onPress={handleGenerate}
                            className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${cooldownSeconds > 0 ? 'bg-[#8C9BAE]' : 'bg-[#001428] active:opacity-90'}`}
                        >
                            <IconSparkles size={20} color="white" />
                            <Text className="font-geist-semibold text-base text-white">
                                {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Generate Quiz'}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
