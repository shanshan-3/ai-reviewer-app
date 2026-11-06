import { useEffect, useMemo, useRef, useState } from 'react';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconMinus from '@tabler/icons-react-native/IconMinus';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { usePreventRemove } from 'expo-router/react-navigation';
import AuthButton from '@/components/AuthButton';
import AuthMessage from '@/components/AuthMessage';
import LabelPicker from '@/components/label-picker';
import FormField from '@/components/FormField';
import { buildMaterialPages, getPageSelection, togglePageSelection } from '@/lib/material-pages';
import { approveMaterial, createMaterialLabel, getMaterialLabels } from '@/lib/materials';
import { THEME } from '@/lib/theme';
import { useToast } from '@/providers/toast-provider';

export default function MaterialReviewForm({ material, sections, onReaderPageChange, onApproved }) {
    const showToast = useToast();
    const [labels, setLabels] = useState(null);
    const [subjectId, setSubjectId] = useState(material.subject_id || '');
    const [topicId, setTopicId] = useState(material.topic_id || '');
    const [selected, setSelected] = useState(sections.filter(section => section.eligible_for_generation).map(section => section.id));
    const [confirmed, setConfirmed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [pageIndex, setPageIndex] = useState(0);
    const [jump, setJump] = useState('');
    const [showJump, setShowJump] = useState(false);
    const [pageError, setPageError] = useState('');
    const readerTop = useRef(0);
    const pages = useMemo(() => buildMaterialPages(sections), [sections]);
    const page = pages[pageIndex];
    const selection = page ? getPageSelection(page, selected) : { usableIds: [], checked: false };
    const allSelection = getPageSelection({ sections }, selected);
    const active = useRef(false);
    const working = useRef(false);
    const ready = material.status === 'ready';
    const approveDisabled = busy || !labels || !subjectId || !topicId || !selected.length || !confirmed;

    function changePage(index) {
        if (index < 0 || index >= pages.length) return;
        setPageIndex(index);
        setJump('');
        setShowJump(false);
        setPageError('');
        onReaderPageChange?.(readerTop.current);
    }

    function jumpToPage() {
        if (!/^\d+$/.test(jump.trim()) || Number(jump) < 1 || Number(jump) > pages.length) {
            setPageError(`Enter a page number from 1 to ${pages.length}.`);
            return;
        }
        changePage(Number(jump) - 1);
    }

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

    async function selectSubject(name) {
        if (working.current || !labels || ready) return false;
        working.current = true;
        setBusy(true);
        setMessage('');
        try {
            let currentLabels = labels;
            async function ensureLabel(kind, body) {
                const find = () => currentLabels[kind].find(label => label.name.toLowerCase() === body.name.toLowerCase()
                    && (kind === 'subjects' || label.subject_id === body.subjectId));
                const existing = find();
                if (existing) return existing;
                try {
                    const label = await createMaterialLabel(kind, body);
                    currentLabels = { ...currentLabels, [kind]: [...currentLabels[kind], label] };
                    if (active.current) setLabels(currentLabels);
                    return label;
                } catch (error) {
                    // A concurrent save or a lost response may already have created this label.
                    const refreshed = await getMaterialLabels().catch(() => null);
                    if (refreshed) {
                        currentLabels = refreshed;
                        if (active.current) setLabels(currentLabels);
                        const saved = find();
                        if (saved) return saved;
                    }
                    throw error;
                }
            }
            const subject = await ensureLabel('subjects', { name });
            if (!active.current) return false;
            const topic = await ensureLabel('topics', { name: 'General', subjectId: subject.id });
            if (!active.current) return false;
            setSubjectId(subject.id);
            setTopicId(topic.id);
            return true;
        } catch (error) {
            if (active.current) setMessage(error.message);
            return false;
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
            if (active.current) {
                onApproved({ subjectId, topicId, sectionIds: selected });
                showToast('Module approved');
            }
        } catch (error) {
            if (active.current) setMessage(error.message);
        } finally {
            working.current = false;
            if (active.current) setBusy(false);
        }
    }

    return <View className="gap-6">
        <Text accessibilityRole="header" className="font-geist-semibold text-lg text-[#001428]">Subject</Text>
        {!labels && !message && <ActivityIndicator color={THEME.primary} accessibilityLabel="Loading subjects" />}
        {!labels && Boolean(message) && <AuthButton submitLabel="Retry loading labels" onSubmit={() => { setMessage(''); setAttempt(value => value + 1); }} />}
        {labels && <LabelPicker labels={labels} subjectId={subjectId}
            selectSubject={selectSubject} message={message} onOpen={() => setMessage('')}
            busy={busy} ready={ready} />}
        <View className="gap-4" onLayout={event => { readerTop.current = event.nativeEvent.layout.y; }}>
            <Text accessibilityRole="header" className="font-geist-semibold text-lg text-[#001428]">Extracted text</Text>
            {pages.some(item => !item.sections[0].reference.page) && <Text className="font-geist text-xs leading-5 text-muted-foreground">DOCX reader pages group paragraphs. Numbering differs from Word.</Text>}
            {!ready && <Pressable accessibilityRole="checkbox" accessibilityLabel="Select all pages"
                    accessibilityState={{ checked: allSelection.checked, disabled: busy || !allSelection.usableIds.length }}
                    disabled={busy || !allSelection.usableIds.length}
                    onPress={() => { setSelected(value => togglePageSelection({ sections }, value)); setConfirmed(false); }}
                    className={`min-h-12 flex-row items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 active:bg-secondary focus:border-foreground ${busy || !allSelection.usableIds.length ? 'opacity-40' : ''}`}>
                    <View className={`h-5 w-5 items-center justify-center rounded border ${allSelection.checked ? 'border-[#001428] bg-[#001428]' : 'border-muted-foreground'}`}>
                        {allSelection.checked === true && <IconCheck size={16} color={THEME.primaryForeground} accessible={false} />}
                        {allSelection.checked === 'mixed' && <IconMinus size={16} color={THEME.primaryForeground} accessible={false} />}
                    </View>
                    <Text className="flex-1 font-geist-medium text-sm text-[#001428]">Select all pages</Text>
                </Pressable>}
            {!page && <Text className="font-geist text-base leading-7 text-muted-foreground">No extracted text is available.</Text>}
            {page && <>
                <View className="flex-row items-center gap-1 rounded-xl border border-border bg-card p-2">
                    <Pressable accessibilityRole="button" accessibilityState={{ disabled: pageIndex === 0 }} disabled={pageIndex === 0}
                        onPress={() => changePage(pageIndex - 1)} className={`min-h-12 justify-center rounded-lg px-3 active:bg-secondary focus:bg-secondary ${pageIndex === 0 ? 'opacity-40' : ''}`}>
                        <Text className="font-geist-semibold text-sm text-[#001428]">Previous</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Go to page" accessibilityState={{ expanded: showJump }}
                        onPress={() => { setShowJump(value => !value); setPageError(''); }} className="min-h-12 flex-1 items-center justify-center gap-1 rounded-lg px-2 active:bg-secondary focus:bg-secondary">
                        <Text accessibilityLiveRegion="polite" style={{ fontVariant: ['tabular-nums'] }} className="text-center font-geist-medium text-sm text-[#001428]">{page.title.startsWith('Reader') ? 'Reader page' : 'Page'} {pageIndex + 1} of {pages.length}</Text>
                        <Text className="text-center font-geist text-xs text-muted-foreground">{showJump ? 'Close page selector' : 'Tap to jump'}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityState={{ disabled: pageIndex === pages.length - 1 }} disabled={pageIndex === pages.length - 1}
                        onPress={() => changePage(pageIndex + 1)} className={`min-h-12 justify-center rounded-lg px-3 active:bg-secondary focus:bg-secondary ${pageIndex === pages.length - 1 ? 'opacity-40' : ''}`}>
                        <Text className="font-geist-semibold text-sm text-[#001428]">Next</Text>
                    </Pressable>
                </View>
                {showJump && <View className="flex-row items-end gap-3">
                    <FormField label="Go to page" labelId="reader-page" value={jump} onChangeText={setJump}
                        keyboardType="number-pad" returnKeyType="go" onSubmitEditing={jumpToPage} containerClassName="flex-1" />
                    <Pressable accessibilityRole="button" onPress={jumpToPage} className="min-h-14 justify-center rounded-lg border border-border bg-card px-5 py-3 active:bg-secondary focus:border-foreground">
                        <Text className="font-geist-semibold text-base text-[#001428]">Go</Text>
                    </Pressable>
                </View>}
                <AuthMessage message={pageError} isError />
                <View className="gap-4 rounded-xl border border-border bg-card p-5" style={{ borderCurve: 'continuous' }}>
                    {ready ? <Text className="font-geist text-sm text-muted-foreground">{selection.checked === true ? 'Approved for questions' : selection.checked === 'mixed' ? 'Some paragraphs approved' : 'Excluded from questions'}</Text>
                        : <Pressable accessibilityRole="checkbox" accessibilityLabel={`Include ${page.title} for questions`}
                            accessibilityState={{ checked: selection.checked, disabled: busy || !selection.usableIds.length }} disabled={busy || !selection.usableIds.length}
                            onPress={() => { setSelected(value => togglePageSelection(page, value)); setConfirmed(false); }}
                            className="min-h-12 flex-row items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 active:bg-secondary focus:border-foreground">
                            <View className={`h-5 w-5 items-center justify-center rounded border ${selection.checked ? 'border-[#001428] bg-[#001428]' : 'border-muted-foreground'}`}>
                                {selection.checked === true && <IconCheck size={16} color={THEME.primaryForeground} accessible={false} />}
                                {selection.checked === 'mixed' && <IconMinus size={16} color={THEME.primaryForeground} accessible={false} />}
                            </View>
                            <Text className="flex-1 font-geist text-sm leading-6 text-foreground">{!selection.usableIds.length ? 'No usable text to select' : selection.checked === 'mixed' ? 'Some paragraphs selected · Include all' : 'Include page for questions'}</Text>
                        </Pressable>}
                    {page.sections.map(section => <Text key={section.id} selectable className="font-geist text-base leading-8 text-foreground">
                        {section.text || 'No selectable text on this page.'}
                    </Text>)}
                </View>
            </>}
        </View>
        {!ready && <View className="gap-4 border-t border-border pt-6">
            <View className="gap-1">
                <Text accessibilityRole="header" className="font-geist-semibold text-lg text-[#001428]">Finish review</Text>
                <Text style={{ fontVariant: ['tabular-nums'] }} className="font-geist text-sm leading-6 text-muted-foreground">{selected.length} of {sections.length} sections selected</Text>
            </View>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed, disabled: busy }} disabled={busy}
                accessibilityLabel="I reviewed the selected text and its formatting. It preserves the meaning of my module."
                onPress={() => setConfirmed(value => !value)} className="min-h-12 flex-row items-start gap-3 rounded-xl border border-border bg-card p-4 active:bg-secondary focus:border-foreground">
                <View className={`mt-1 h-5 w-5 items-center justify-center rounded border ${confirmed ? 'border-[#001428] bg-[#001428]' : 'border-muted-foreground'}`}>
                    {confirmed && <IconCheck size={16} color={THEME.primaryForeground} accessible={false} />}
                </View>
                <Text className="flex-1 font-geist text-sm leading-6 text-foreground">I reviewed the selected text and its formatting. It preserves the meaning of my module.</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: approveDisabled, busy }} disabled={approveDisabled} onPress={submit}
                className={`min-h-14 flex-row items-center justify-center gap-3 rounded-lg bg-[#001428] px-5 py-4 active:opacity-80 focus:border-2 focus:border-muted-foreground ${approveDisabled ? 'opacity-40' : ''}`}>
                {busy && <ActivityIndicator color={THEME.primaryForeground} accessible={false} />}
                <Text className="font-geist-semibold text-base text-primary-foreground">{busy ? 'Saving…' : 'Approve module'}</Text>
            </Pressable>
        </View>}
        {ready && <View className="gap-2 rounded-xl border border-border bg-card p-5">
            <Text accessibilityRole="header" className="font-geist-semibold text-base text-[#001428]">Review complete</Text>
            <Text className="font-geist text-sm leading-6 text-muted-foreground">Your selected text is approved. Quiz generation is not available yet.</Text>
        </View>}
        <AuthMessage message={message} isError />
    </View>;
}
