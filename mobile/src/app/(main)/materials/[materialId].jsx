import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import MaterialScreenHeader from '@/components/MaterialScreenHeader';
import MaterialReviewForm from '@/components/MaterialReviewForm';
import { getMaterial } from '@/lib/materials';
import { THEME } from '@/lib/theme';

const STATUS_LABELS = { processing: 'Processing', needs_review: 'Review needed', ready: 'Approved', failed: 'Import failed', deleting: 'Deletion pending' };
const EXTRACTION_NOTES = {
    IMAGES_EXCLUDED: 'Images and scanned text are not included.',
    PAGE_WITHOUT_USABLE_TEXT: 'Some pages have no readable text.',
    FORMATTING_REVIEW: 'Check code and tables before using them for questions.',
    LIBRARY_WARNING: 'Check the extracted text for missing content.',
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
            <MaterialScreenHeader title="Module preview" />
            <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{ padding: 20, gap: 28, paddingTop: 28, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
                {loading && <View className="items-center gap-3 rounded-2xl bg-card px-6 py-12">
                    <ActivityIndicator color={THEME.primary} accessibilityLabel="Loading module" />
                    <Text className="font-geist text-sm text-muted-foreground">Opening your module…</Text>
                </View>}
                <AuthMessage message={message} isError />
                {!loading && Boolean(message) && <AuthButton submitLabel="Retry" onSubmit={() => setAttempt(value => value + 1)} />}
                {result && <>
                        <View className="gap-4">
                            <View className="flex-row items-center gap-2">
                                <View className={`h-2 w-2 rounded-full ${result.material.status === 'ready' ? 'bg-[#15803D]' : 'bg-[#001428]'}`} />
                                <Text className="font-geist-medium text-sm leading-5 text-[#526071]">{STATUS_LABELS[result.material.status] || 'Unavailable'}</Text>
                            </View>
                            <Text selectable accessibilityRole="header" className="font-geist-semibold text-3xl leading-10 tracking-tight text-[#001428]">{result.material.title}</Text>
                            <View className="flex-row items-start gap-2">
                                <IconFileText size={18} color="#526071" style={{ marginTop: 3 }} accessible={false} />
                                <Text selectable className="flex-1 font-geist text-sm leading-6 text-[#526071]">{result.material.original_filename}</Text>
                            </View>
                        </View>
                        {extractionNotes.length > 0 && <View className="flex-row items-start gap-3 rounded-2xl bg-[#EDF0F5] p-4" style={{ borderCurve: 'continuous' }}>
                            <IconInfoCircle size={20} color="#526071" style={{ marginTop: 2 }} accessible={false} />
                            <View className="flex-1 gap-1">
                                <Text accessibilityRole="header" className="font-geist-semibold text-sm leading-6 text-[#001428]">Check the extraction</Text>
                                {extractionNotes.map(note => <Text key={note} className="font-geist text-sm leading-6 text-[#526071]">{note}</Text>)}
                            </View>
                        </View>}
                    {result.material.status === 'failed' && <Text className="font-geist text-sm text-destructive">This import failed: {result.material.error_code}</Text>}
                    {['needs_review', 'ready'].includes(result.material.status) && <View onLayout={event => { formTop.current = event.nativeEvent.layout.y; }}>
                        <MaterialReviewForm key={result.material.id}
                        onReaderPageChange={offset => scrollRef.current?.scrollTo({ y: formTop.current + offset, animated: false })}
                        material={result.material} sections={result.sections} onApproved={({ subjectId, topicId, sectionIds }) => setResult(value => ({
                            ...value, material: { ...value.material, status: 'ready', subject_id: subjectId, topic_id: topicId },
                            sections: value.sections.map(section => ({ ...section, eligible_for_generation: sectionIds.includes(section.id) })),
                        }))} /></View>}
                </>}
            </ScrollView>
        </SafeAreaView>
    );
}
