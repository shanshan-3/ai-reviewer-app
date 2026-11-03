import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import MaterialScreenHeader from '@/components/MaterialScreenHeader';
import MaterialReviewForm from '@/components/MaterialReviewForm';
import { getMaterial } from '@/lib/materials';
import { THEME } from '@/lib/theme';

export default function MaterialPreviewPage() {
    const { materialId } = useLocalSearchParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [attempt, setAttempt] = useState(0);

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
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 20 }}>
                {loading && <ActivityIndicator color={THEME.primary} accessibilityLabel="Loading module" />}
                <AuthMessage message={message} isError />
                {!loading && Boolean(message) && <AuthButton submitLabel="Retry" onSubmit={() => setAttempt(value => value + 1)} />}
                {result && <>
                    <View className="gap-2">
                        <Text accessibilityRole="header" className="font-geist-semibold text-2xl text-foreground">{result.material.title}</Text>
                        <Text className="font-geist text-sm text-foreground/70">{result.material.original_filename}</Text>
                        <Text className="font-geist-medium text-sm text-foreground">
                            {result.material.status === 'needs_review' ? 'Text needs review' : result.material.status}
                        </Text>
                    </View>
                    {result.material.warnings.map((warning, index) => <Text key={`${warning.code}-${index}`} className="font-geist text-sm leading-6 text-foreground/70">{warning.message}</Text>)}
                    {result.material.status === 'failed' && <Text className="font-geist text-sm text-destructive">This import failed: {result.material.error_code}</Text>}
                    {['needs_review', 'ready'].includes(result.material.status) && <MaterialReviewForm key={result.material.id}
                        material={result.material} sections={result.sections} onApproved={({ subjectId, topicId, sectionIds }) => setResult(value => ({
                            ...value, material: { ...value.material, status: 'ready', subject_id: subjectId, topic_id: topicId },
                            sections: value.sections.map(section => ({ ...section, eligible_for_generation: sectionIds.includes(section.id) })),
                        }))} />}
                </>}
            </ScrollView>
        </SafeAreaView>
    );
}
