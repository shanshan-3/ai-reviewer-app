import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import IconCards from '@tabler/icons-react-native/IconCards';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import MaterialScreenHeader from '@/components/MaterialScreenHeader';
import MaterialReviewForm from '@/components/MaterialReviewForm';
import { getMaterial } from '@/lib/materials';
import { THEME } from '@/lib/theme';

const STATUS_CONFIG = {
    ready: { label: 'Ready', dot: 'bg-emerald-500', text: 'text-emerald-700' },
    processing: { label: 'Processing', dot: 'bg-amber-500', text: 'text-amber-700' },
    needs_review: { label: 'Needs review', dot: 'bg-indigo-500', text: 'text-indigo-700' },
    failed: { label: 'Import failed', dot: 'bg-rose-500', text: 'text-rose-700' },
    deleting: { label: 'Deleting…', dot: 'bg-slate-400', text: 'text-slate-600' },
};
const EXTRACTION_NOTES = {
    IMAGES_EXCLUDED: 'Scanned images and diagrams are excluded.',
    PAGE_WITHOUT_USABLE_TEXT: 'Empty pages skipped.',
    FORMATTING_REVIEW: 'Review code and table formatting.',
    LIBRARY_WARNING: 'Verify extracted text completeness.',
};

export default function MaterialPreviewPage() {
    const { materialId } = useLocalSearchParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [attempt, setAttempt] = useState(0);
    const scrollRef = useRef(null);
    const formTop = useRef(0);
    const extractionNotes = [...new Set(result?.material.warnings.map(warning => EXTRACTION_NOTES[warning.code] || warning.message))];

    useEffect(() => {
        let active = true;
        async function load() {
            setLoading(true);
            setMessage('');
            setResult(null);
            try {
                if (typeof materialId !== 'string') throw new Error('Invalid module ID.');
                const data = await getMaterial(materialId);
                if (active) setResult(data);
            } catch (error) {
                if (active) setMessage(error.message || 'Could not load this module.');
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => { active = false; };
    }, [materialId, attempt]);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
            <MaterialScreenHeader title="Module Preview" />
            <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{ padding: 20, gap: 28, paddingTop: 28, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
                {loading && <View className="items-center gap-3 rounded-2xl bg-card px-6 py-12">
                    <ActivityIndicator color={THEME.primary} accessibilityLabel="Loading module" />
                    <Text className="font-geist text-sm text-muted-foreground">Loading module…</Text>
                </View>}
                <AuthMessage message={message} isError />
                {!loading && Boolean(message) && <AuthButton submitLabel="Retry" onSubmit={() => setAttempt(value => value + 1)} />}
                {result && (() => {
                    const statusInfo = STATUS_CONFIG[result.material.status] || {
                        label: result.material.status,
                        dot: 'bg-slate-400',
                        text: 'text-[#526071]',
                    };
                    return (
                        <>
                        <View className="gap-4">
                            <View className="flex-row items-center gap-1.5">
                                <View className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                                <Text className={`font-geist-medium text-xs ${statusInfo.text}`}>{statusInfo.label}</Text>
                            </View>
                            <Text selectable accessibilityRole="header" className="font-geist-semibold text-3xl leading-10 tracking-tight text-[#001428]">{result.material.title}</Text>
                            <View className="flex-row items-start gap-2">
                                <IconFileText size={18} color="#526071" style={{ marginTop: 3 }} accessible={false} />
                                <Text selectable className="flex-1 font-geist text-sm leading-6 text-[#526071]">{result.material.original_filename}</Text>
                            </View>

                            {/* 1-Tap Quick Study Action Bar for Approved Modules */}
                            {result.material.status === 'ready' && (
                                <View className="flex-row items-center gap-2.5 pt-1">
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Start a practice quiz from this module"
                                        onPress={() => router.push({
                                            pathname: '/(main)/quizzes/create',
                                            params: { sourceKind: 'module', materialId: result.material.id },
                                        })}
                                        style={({ pressed }) => [
                                            {
                                                borderCurve: 'continuous',
                                                transform: [{ scale: pressed ? 0.98 : 1 }],
                                            },
                                        ]}
                                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-[#001428] py-3 px-4 shadow-2xs active:opacity-90"
                                    >
                                        <IconSparkles size={16} color="#FFFFFF" strokeWidth={2} />
                                        <Text className="font-geist-semibold text-xs text-white">Start Quiz</Text>
                                    </Pressable>

                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Generate flashcards from this module"
                                        onPress={() => router.push({
                                            pathname: '/(main)/flashcards/create',
                                            params: { sourceKind: 'module', materialId: result.material.id },
                                        })}
                                        style={({ pressed }) => [
                                            {
                                                borderCurve: 'continuous',
                                                transform: [{ scale: pressed ? 0.98 : 1 }],
                                            },
                                        ]}
                                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-[#E4E8EE] bg-white py-3 px-4 shadow-2xs active:bg-[#F8FAFC]"
                                    >
                                        <IconCards size={16} color="#001428" strokeWidth={2} />
                                        <Text className="font-geist-semibold text-xs text-[#001428]">Flashcards</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                        {extractionNotes.length > 0 && (
                            <View
                                className="flex-row items-start gap-3 rounded-2xl border border-[#E2E8F0]/80 bg-[#F8FAFC] p-4 shadow-2xs"
                                style={{ borderCurve: 'continuous' }}
                            >
                                <IconInfoCircle size={18} color="#526071" style={{ marginTop: 2 }} accessible={false} />
                                <View className="flex-1 gap-1">
                                    <Text accessibilityRole="header" className="font-geist-semibold text-xs text-[#001428]">
                                        Parser Notice
                                    </Text>
                                    {extractionNotes.map(note => (
                                        <Text key={note} className="font-geist text-xs text-[#526071] leading-5">
                                            {note}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        )}
                    {result.material.status === 'failed' && <Text className="font-geist text-sm text-destructive">This import failed: {result.material.error_code}</Text>}
                    {['needs_review', 'ready'].includes(result.material.status) && <View onLayout={event => { formTop.current = event.nativeEvent.layout.y; }}>
                        <MaterialReviewForm key={result.material.id}
                        onReaderPageChange={offset => scrollRef.current?.scrollTo({ y: formTop.current + offset, animated: false })}
                        material={result.material} sections={result.sections} onApproved={({ subjectId, topicId, sectionIds }) => setResult(value => ({
                            ...value, material: { ...value.material, status: 'ready', subject_id: subjectId, topic_id: topicId },
                            sections: value.sections.map(section => ({ ...section, eligible_for_generation: sectionIds.includes(section.id) })),
                        }))} /></View>}
                        </>
                    );
                })()}
            </ScrollView>
        </SafeAreaView>
    );
}
