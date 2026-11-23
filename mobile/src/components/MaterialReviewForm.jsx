import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconMinus from '@tabler/icons-react-native/IconMinus';
import IconChevronLeft from '@tabler/icons-react-native/IconChevronLeft';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconCircleCheck from '@tabler/icons-react-native/IconCircleCheck';
import IconSparkles from '@tabler/icons-react-native/IconSparkles';
import IconCards from '@tabler/icons-react-native/IconCards';
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
    const approveDisabled = busy || !labels || !subjectId || !topicId || !selected.length;

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
        if (working.current || !subjectId || !topicId || !selected.length) return;
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

    return <View className="gap-8">
        {!labels && !message && <ActivityIndicator color={THEME.primary} accessibilityLabel="Loading subjects" />}
        {!labels && Boolean(message) && <AuthButton submitLabel="Retry loading labels" onSubmit={() => { setMessage(''); setAttempt(value => value + 1); }} />}
        {labels && <LabelPicker labels={labels} subjectId={subjectId}
            selectSubject={selectSubject} message={message} onOpen={() => setMessage('')}
            busy={busy} ready={ready} />}
        <View className="gap-4" onLayout={event => { readerTop.current = event.nativeEvent.layout.y; }}>
            <View className="gap-1">
                <Text accessibilityRole="header" className="font-geist-semibold text-2xl leading-8 tracking-tight text-[#001428]">Extracted text</Text>
                {pages.some(item => !item.sections[0].reference.page) && <Text className="font-geist text-xs text-[#526071]">DOCX pages grouped by paragraph.</Text>}
            </View>
            {!ready && <Pressable accessibilityRole="checkbox" accessibilityLabel="Select all pages"
                    accessibilityState={{ checked: allSelection.checked, disabled: busy || !allSelection.usableIds.length }}
                    disabled={busy || !allSelection.usableIds.length}
                    onPress={() => { setSelected(value => togglePageSelection({ sections }, value)); }}
                    className={`min-h-12 flex-row items-center gap-3 rounded-xl px-2 py-3 active:bg-secondary focus:bg-secondary ${busy || !allSelection.usableIds.length ? 'opacity-40' : ''}`}>
                    <View className={`h-6 w-6 items-center justify-center rounded-md border ${allSelection.checked ? 'border-[#001428] bg-[#001428]' : 'border-muted-foreground bg-card'}`}>
                        {allSelection.checked === true && <IconCheck size={16} color={THEME.primaryForeground} accessible={false} />}
                        {allSelection.checked === 'mixed' && <IconMinus size={16} color={THEME.primaryForeground} accessible={false} />}
                    </View>
                    <Text className="flex-1 font-geist-medium text-sm leading-6 text-[#001428]">Select all pages</Text>
                </Pressable>}
            {!page && <View className="rounded-2xl border border-[#E5E9F0] bg-white p-6 shadow-2xs">
                <Text className="font-geist text-sm text-[#526071]">No text available.</Text>
            </View>}
            {page && <View className="overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white shadow-2xs"
                style={{ borderCurve: 'continuous' }}>
                <View className="gap-3 border-b border-[#E5E9F0] bg-[#F8FAFC] p-2">
                    <View className="flex-row items-center gap-2">
                        <Pressable accessibilityRole="button" accessibilityLabel="Previous page" accessibilityState={{ disabled: pageIndex === 0 }} disabled={pageIndex === 0}
                            onPress={() => changePage(pageIndex - 1)} className={`h-10 w-10 items-center justify-center rounded-xl active:bg-[#E2E8F0] ${pageIndex === 0 ? 'opacity-30' : ''}`}
                            style={{ borderCurve: 'continuous' }}>
                            <IconChevronLeft size={20} color="#001428" accessible={false} />
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Go to page. ${page.title}, ${pageIndex + 1} of ${pages.length}`} accessibilityState={{ expanded: showJump }}
                            onPress={() => { setShowJump(value => !value); setPageError(''); }} className="min-h-10 flex-1 items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 active:bg-[#E2E8F0]"
                            style={{ borderCurve: 'continuous' }}>
                            <Text accessibilityLiveRegion="polite" style={{ fontVariant: ['tabular-nums'] }} className="text-center font-geist-semibold text-xs text-[#001428]">
                                {page.title.startsWith('Reader') ? 'Reader page' : 'Page'} {pageIndex + 1} of {pages.length}
                            </Text>
                            <Text className="text-center font-geist text-[10px] text-[#526071]">
                                {showJump ? 'Cancel' : 'Tap to jump'}
                            </Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel="Next page" accessibilityState={{ disabled: pageIndex === pages.length - 1 }} disabled={pageIndex === pages.length - 1}
                            onPress={() => changePage(pageIndex + 1)} className={`h-10 w-10 items-center justify-center rounded-xl active:bg-[#E2E8F0] ${pageIndex === pages.length - 1 ? 'opacity-30' : ''}`}
                            style={{ borderCurve: 'continuous' }}>
                            <IconChevronRight size={20} color="#001428" accessible={false} />
                        </Pressable>
                    </View>
                    {showJump && <View className="gap-2 px-3 pb-3">
                        <View className="flex-row items-end gap-3">
                            <FormField label="Go to page" labelId="reader-page" value={jump} onChangeText={setJump} autoFocus
                                invalid={Boolean(pageError)} keyboardType="number-pad" returnKeyType="go" onSubmitEditing={jumpToPage} containerClassName="flex-1" />
                            <Pressable accessibilityRole="button" onPress={jumpToPage} className="min-h-12 justify-center rounded-xl bg-[#001428] px-5 py-2.5 active:opacity-85" style={{ borderCurve: 'continuous' }}>
                                <Text className="font-geist-semibold text-sm text-white">Go</Text>
                            </Pressable>
                        </View>
                        {Boolean(pageError) && <Text accessibilityLiveRegion="polite" className="font-geist text-xs leading-5 text-destructive">{pageError}</Text>}
                    </View>}
                </View>
                <View className="px-5 pt-3">
                    {ready ? <View className="min-h-12 flex-row items-center gap-2 py-3">
                            {selection.checked === true && <IconCircleCheck size={18} color="#001428" accessible={false} />}
                            <Text className="flex-1 font-geist-medium text-sm leading-6 text-[#526071]">{selection.checked === true ? 'Approved' : selection.checked === 'mixed' ? 'Partial' : 'Excluded'}</Text>
                        </View>
                        : <Pressable accessibilityRole="checkbox" accessibilityLabel={`Include ${page.title} for questions`}
                            accessibilityState={{ checked: selection.checked, disabled: busy || !selection.usableIds.length }} disabled={busy || !selection.usableIds.length}
                            onPress={() => { setSelected(value => togglePageSelection(page, value)); }}
                            className={`min-h-12 flex-row items-center gap-3 rounded-xl py-3 active:bg-secondary focus:bg-secondary ${busy || !selection.usableIds.length ? 'opacity-40' : ''}`}>
                            <View className={`h-6 w-6 items-center justify-center rounded-md border ${selection.checked ? 'border-[#001428] bg-[#001428]' : 'border-muted-foreground'}`}>
                                {selection.checked === true && <IconCheck size={16} color={THEME.primaryForeground} accessible={false} />}
                                {selection.checked === 'mixed' && <IconMinus size={16} color={THEME.primaryForeground} accessible={false} />}
                            </View>
                            <Text className="flex-1 font-geist-medium text-sm leading-6 text-[#001428]">{!selection.usableIds.length ? 'No selectable text' : selection.checked === 'mixed' ? 'Select all on page' : 'Include page'}</Text>
                        </Pressable>}
                </View>
                <View className="gap-5 px-6 pb-8 pt-5">
                    {page.sections.map(section => <Text key={section.id} selectable className="font-geist text-base leading-8 text-[#243447]">
                        {section.text || 'Empty page.'}
                    </Text>)}
                </View>
            </View>}
        </View>
        {!ready && (
            <View
                className="overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white p-5 shadow-2xs gap-4"
                style={{ borderCurve: 'continuous' }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                        <Text accessibilityRole="header" className="font-geist-bold text-sm text-[#001428]">
                            Approve Module
                        </Text>
                        <Text
                            accessibilityLiveRegion="polite"
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="font-geist text-xs text-[#526071]"
                        >
                            {selected.length} of {sections.length} sections selected
                        </Text>
                    </View>
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: approveDisabled, busy }}
                    disabled={approveDisabled}
                    onPress={submit}
                    style={({ pressed }) => [
                        {
                            borderCurve: 'continuous',
                            transform: [{ scale: pressed && !approveDisabled ? 0.98 : 1 }],
                        },
                    ]}
                    className={`min-h-12 flex-row items-center justify-center gap-2.5 rounded-xl bg-[#001428] px-5 py-3.5 shadow-2xs active:opacity-90 ${
                        approveDisabled ? 'opacity-40' : ''
                    }`}
                >
                    {busy ? (
                        <ActivityIndicator color={THEME.primaryForeground} accessible={false} />
                    ) : (
                        <IconCircleCheck size={18} color="#FFFFFF" strokeWidth={2} accessible={false} />
                    )}
                    <Text className="font-geist-semibold text-sm text-white">
                        {busy ? 'Saving…' : 'Approve Module'}
                    </Text>
                </Pressable>
            </View>
        )}
        {ready && (
            <View
                className="overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white p-5 shadow-2xs gap-4"
                style={{ borderCurve: 'continuous' }}
            >
                <View className="flex-row items-center gap-2.5">
                    <IconCircleCheck size={20} color="#059669" strokeWidth={2} accessible={false} />
                    <View className="flex-1">
                        <Text accessibilityRole="header" className="font-geist-bold text-sm text-[#001428]">
                            Module Approved
                        </Text>
                        <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="font-geist text-xs text-[#526071]"
                        >
                            {selected.length} of {sections.length} sections ready for study
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-2.5 pt-1">
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Start a practice quiz from this module"
                        onPress={() => router.push({
                            pathname: '/(main)/quizzes/create',
                            params: { sourceKind: 'module', materialId: material.id },
                        })}
                        style={({ pressed }) => [
                            {
                                borderCurve: 'continuous',
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                            },
                        ]}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-[#001428] py-3 active:opacity-90"
                    >
                        <IconSparkles size={15} color="#FFFFFF" strokeWidth={2} />
                        <Text className="font-geist-semibold text-xs text-white">Start Quiz</Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Generate flashcards from this module"
                        onPress={() => router.push({
                            pathname: '/(main)/flashcards/create',
                            params: { sourceKind: 'module', materialId: material.id },
                        })}
                        style={({ pressed }) => [
                            {
                                borderCurve: 'continuous',
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                            },
                        ]}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-[#E4E8EE] bg-white py-3 active:bg-[#F8FAFC]"
                    >
                        <IconCards size={15} color="#001428" strokeWidth={2} />
                        <Text className="font-geist-semibold text-xs text-[#001428]">Flashcards</Text>
                    </Pressable>
                </View>
            </View>
        )}
        <AuthMessage message={message} isError />
    </View>;
}
