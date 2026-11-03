import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { usePreventRemove } from 'expo-router/react-navigation';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import LabelPicker from '@/components/label-picker';
import { approveMaterial, createMaterialLabel, getMaterialLabels } from '@/lib/materials';
import { THEME } from '@/lib/theme';

export default function MaterialReviewForm({ material, sections, onApproved }) {
    const [labels, setLabels] = useState(null);
    const [subjectId, setSubjectId] = useState(material.subject_id || '');
    const [topicId, setTopicId] = useState(material.topic_id || '');
    const [subjectName, setSubjectName] = useState('');
    const [topicName, setTopicName] = useState('');
    const [selected, setSelected] = useState(sections.filter(section => section.eligible_for_generation).map(section => section.id));
    const [confirmed, setConfirmed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [attempt, setAttempt] = useState(0);
    const active = useRef(false);
    const working = useRef(false);
    const ready = material.status === 'ready';

    useEffect(() => {
        active.current = true;
        return () => { active.current = false; };
    }, []);

    useEffect(() => {
        let current = true;
        getMaterialLabels().then(value => { if (current) setLabels(value); })
            .catch(error => { if (current) setMessage(error.message); });
        return () => { current = false; };
    }, [attempt]);

    usePreventRemove(busy, () => Alert.alert('Saving review', 'Wait for your changes to finish saving.'));

    function selectSubject(id) {
        setSubjectId(id);
        setTopicId('');
        setTopicName('');
    }

    async function addLabel(kind) {
        if (working.current) return;
        working.current = true;
        setBusy(true);
        setMessage('');
        try {
            const name = (kind === 'subjects' ? subjectName : topicName).trim();
            const existing = labels[kind].find(label => label.name.toLowerCase() === name.toLowerCase()
                && (kind === 'subjects' || label.subject_id === subjectId));
            const label = existing || await createMaterialLabel(kind, { name, ...(kind === 'topics' ? { subjectId } : {}) });
            if (!active.current) return;
            if (!existing) setLabels(value => ({ ...value, [kind]: [...value[kind], label] }));
            if (kind === 'subjects') { selectSubject(label.id); setSubjectName(''); }
            else { setTopicId(label.id); setTopicName(''); }
        } catch (error) {
            if (active.current) setMessage(error.message);
        } finally {
            working.current = false;
            if (active.current) setBusy(false);
        }
    }

    async function submit() {
        if (working.current || !confirmed || !subjectId || !topicId || !selected.length) return;
        working.current = true;
        setBusy(true);
        setMessage('');
        try {
            await approveMaterial(material.id, { subjectId, topicId, sectionIds: selected });
            if (active.current) onApproved({ subjectId, topicId, sectionIds: selected });
        } catch (error) {
            if (active.current) setMessage(error.message);
        } finally {
            working.current = false;
            if (active.current) setBusy(false);
        }
    }

    return <View className="gap-5">
        <Text accessibilityRole="header" className="font-geist-semibold text-xl text-foreground">{ready ? 'Approved material' : 'Review your module'}</Text>
        {!labels && !message && <ActivityIndicator color={THEME.primary} accessibilityLabel="Loading subject and topic labels" />}
        {!labels && Boolean(message) && <AuthButton submitLabel="Retry loading labels" onSubmit={() => { setMessage(''); setAttempt(value => value + 1); }} />}
        {labels && <LabelPicker labels={labels} subjectId={subjectId} topicId={topicId}
            subjectName={subjectName} topicName={topicName} selectSubject={selectSubject}
            setTopicId={setTopicId} setSubjectName={setSubjectName} setTopicName={setTopicName}
            addLabel={addLabel} busy={busy} ready={ready} />}
        {!ready && <Text className="font-geist text-sm leading-6 text-foreground/70">Read each section, then select the text that can support questions. Leave out code, tables, or other content whose meaning was lost during extraction.</Text>}
        {sections.map(section => {
            const included = selected.includes(section.id);
            const usable = /[\p{L}\p{N}]/u.test(section.text);
            const title = section.reference.page ? `Page ${section.reference.page}` : `Paragraph ${section.reference.paragraph}`;
            return <View key={section.id} className="gap-3 rounded-lg bg-card p-4">
                <Text accessibilityRole="header" className="font-geist-semibold text-base text-foreground">{title}</Text>
                <Text selectable className="font-geist text-base leading-7 text-foreground">{section.text || 'No selectable text in this section.'}</Text>
                {ready ? <Text className="font-geist text-sm text-foreground/70">{included ? 'Approved for questions' : 'Excluded from questions'}</Text>
                    : <Pressable accessibilityRole="checkbox" accessibilityLabel={`Use ${title} for questions`}
                        accessibilityState={{ checked: included, disabled: busy || !usable }} disabled={busy || !usable}
                        onPress={() => { setSelected(value => included ? value.filter(id => id !== section.id) : [...value, section.id]); setConfirmed(false); }}
                        className="min-h-12 justify-center rounded-lg border border-muted-foreground px-4 py-3">
                        <Text className="font-geist text-base text-foreground">{!usable ? 'No usable text to select' : included ? 'Selected for questions' : 'Use this section for questions'}</Text>
                    </Pressable>}
            </View>;
        })}
        {!ready && <>
            <Text className="font-geist text-sm text-foreground">{selected.length} of {sections.length} sections selected</Text>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed, disabled: busy }} disabled={busy}
                onPress={() => setConfirmed(value => !value)} className="min-h-12 justify-center rounded-lg border border-muted-foreground px-4 py-3">
                <Text className="font-geist text-base leading-6 text-foreground">{confirmed ? 'Confirmed: ' : ''}I reviewed the selected text and its formatting. It preserves the meaning of my module.</Text>
            </Pressable>
            <AuthButton submitLabel={busy ? 'Saving…' : 'Approve material'} onSubmit={submit}
                disabled={busy || !labels || !subjectId || !topicId || !selected.length || !confirmed} />
        </>}
        {ready && <AuthMessage message="This material is ready for quiz generation. Quiz generation is not available yet." />}
        <AuthMessage message={message} isError />
    </View>;
}
