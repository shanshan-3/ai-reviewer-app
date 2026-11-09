import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconBook from '@tabler/icons-react-native/IconBook';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconChevronDown from '@tabler/icons-react-native/IconChevronDown';
import IconSearch from '@tabler/icons-react-native/IconSearch';
import IconX from '@tabler/icons-react-native/IconX';
import { filterCurriculum } from '@/lib/curriculum';
import { createMaterialLabel, getMaterialLabels } from '@/lib/materials';

export default function SourcePicker({
    sourceKind,
    onSelectKind,
    selectedMaterialId,
    onSelectMaterial,
    selectedTopicId,
    onSelectTopic,
    materials = [],
    labels = { subjects: [], topics: [] },
    onLabelsChange,
    loading = false,
}) {
    const [materialModalOpen, setMaterialModalOpen] = useState(false);
    const [topicModalOpen, setTopicModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [savingSubject, setSavingSubject] = useState(null);

    const readyMaterials = materials.filter(m => m.status === 'ready');
    const selectedMaterial = readyMaterials.find(m => m.id === selectedMaterialId);
    const selectedTopic = labels.topics?.find(t => t.id === selectedTopicId);
    const parentSubject = labels.subjects?.find(s => s.id === selectedTopic?.subject_id);

    const displayTopicName = parentSubject
        ? `${parentSubject.name} • ${selectedTopic?.name}`
        : (selectedTopic?.name || 'Select an IT topic or BSIT subject');

    const filteredSections = useMemo(() => filterCurriculum(searchTerm), [searchTerm]);

    async function handleSelectCurriculumSubject(subjectName) {
        if (savingSubject) return;
        setSavingSubject(subjectName);
        try {
            let currentLabels = labels;

            async function ensureLabel(kind, body) {
                const find = () => (currentLabels[kind] ?? []).find(label =>
                    label.name.toLowerCase() === body.name.toLowerCase()
                    && (kind === 'subjects' || label.subject_id === body.subjectId)
                );
                const existing = find();
                if (existing) return existing;
                try {
                    const label = await createMaterialLabel(kind, body);
                    currentLabels = {
                        ...currentLabels,
                        [kind]: [...(currentLabels[kind] ?? []), label],
                    };
                    return label;
                } catch (error) {
                    const refreshed = await getMaterialLabels().catch(() => null);
                    if (refreshed) {
                        currentLabels = refreshed;
                        const saved = find();
                        if (saved) return saved;
                    }
                    throw error;
                }
            }

            const subject = await ensureLabel('subjects', { name: subjectName });
            const topic = await ensureLabel('topics', { name: 'General', subjectId: subject.id });

            onLabelsChange?.(currentLabels);
            onSelectTopic(topic.id);
            setTopicModalOpen(false);
            setSearchTerm('');
        } catch {
            // non-fatal error fallback
        } finally {
            setSavingSubject(null);
        }
    }

    return (
        <View className="gap-3">
            <Text className="font-geist-medium text-xs uppercase tracking-wider text-[#526071]">
                Study Source
            </Text>

            {/* Segmented Control */}
            <View className="flex-row rounded-xl bg-[#F1F4F8] p-1">
                <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: sourceKind === 'module' }}
                    onPress={() => onSelectKind('module')}
                    className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                        sourceKind === 'module' ? 'bg-white' : ''
                    }`}
                >
                    <View className="flex-row items-center gap-2">
                        <IconFileText size={18} color={sourceKind === 'module' ? '#001428' : '#526071'} />
                        <Text
                            className={`font-geist-medium text-sm ${
                                sourceKind === 'module' ? 'text-[#001428]' : 'text-[#526071]'
                            }`}
                        >
                            School Module
                        </Text>
                    </View>
                </Pressable>

                <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: sourceKind === 'topic' }}
                    onPress={() => onSelectKind('topic')}
                    className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                        sourceKind === 'topic' ? 'bg-white' : ''
                    }`}
                >
                    <View className="flex-row items-center gap-2">
                        <IconBook size={18} color={sourceKind === 'topic' ? '#001428' : '#526071'} />
                        <Text
                            className={`font-geist-medium text-sm ${
                                sourceKind === 'topic' ? 'text-[#001428]' : 'text-[#526071]'
                            }`}
                        >
                            IT Topic
                        </Text>
                    </View>
                </Pressable>
            </View>

            {/* Subtitle helper */}
            <Text className="font-geist text-xs text-[#526071]">
                {sourceKind === 'module'
                    ? 'Questions and citations strictly grounded in your uploaded PDF/DOCX.'
                    : 'AI-generated practice based on standard BSIT curriculum subjects.'}
            </Text>

            {/* Source Content */}
            {sourceKind === 'module' ? (
                <View>
                    {loading ? (
                        <View className="min-h-14 items-center justify-center rounded-2xl bg-white p-4">
                            <ActivityIndicator color="#001428" />
                        </View>
                    ) : readyMaterials.length === 0 ? (
                        <View className="rounded-2xl border border-dashed border-[#E4E8EE] bg-white p-4">
                            <Text className="font-geist text-sm leading-5 text-[#526071]">
                                No approved modules available. Import a module first, or choose IT Topic above.
                            </Text>
                        </View>
                    ) : (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Module: ${selectedMaterial?.title || 'Choose a module'}`}
                            onPress={() => setMaterialModalOpen(true)}
                            className="min-h-14 flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white px-4 py-3"
                        >
                            <View className="flex-1 pr-2">
                                <Text className="font-geist text-xs text-[#526071]">Selected Module</Text>
                                <Text numberOfLines={1} className="font-geist-medium text-sm text-[#001428]">
                                    {selectedMaterial?.title || 'Select an approved module'}
                                </Text>
                            </View>
                            <IconChevronDown size={20} color="#526071" />
                        </Pressable>
                    )}
                </View>
            ) : (
                <View>
                    {loading ? (
                        <View className="min-h-14 items-center justify-center rounded-2xl bg-white p-4">
                            <ActivityIndicator color="#001428" />
                        </View>
                    ) : (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Topic: ${displayTopicName}`}
                            onPress={() => setTopicModalOpen(true)}
                            className="min-h-14 flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white px-4 py-3"
                        >
                            <View className="flex-1 pr-2">
                                <Text className="font-geist text-xs text-[#526071]">Selected IT Subject & Topic</Text>
                                <Text numberOfLines={1} className="font-geist-medium text-sm text-[#001428]">
                                    {displayTopicName}
                                </Text>
                            </View>
                            <IconChevronDown size={20} color="#526071" />
                        </Pressable>
                    )}
                </View>
            )}

            {/* Material Modal */}
            <Modal visible={materialModalOpen} transparent animationType="slide" onRequestClose={() => setMaterialModalOpen(false)}>
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                    <Pressable className="flex-1" onPress={() => setMaterialModalOpen(false)} />
                    <View className="max-h-[70%] rounded-t-3xl bg-white p-5 border border-[#E4E8EE]">
                        <Text className="mb-4 font-geist-semibold text-lg text-[#001428]">Select Approved Module</Text>
                        <ScrollView contentContainerStyle={{ gap: 8 }}>
                            {readyMaterials.map(m => (
                                <Pressable
                                    key={m.id}
                                    onPress={() => {
                                        onSelectMaterial(m.id);
                                        setMaterialModalOpen(false);
                                    }}
                                    className={`flex-row items-center justify-between rounded-xl p-3 ${
                                        selectedMaterialId === m.id ? 'bg-[#F1F4F8]' : 'active:opacity-80'
                                    }`}
                                >
                                    <View className="flex-1 pr-2">
                                        <Text className="font-geist-medium text-sm text-[#001428]">{m.title}</Text>
                                        <Text className="font-geist text-xs text-[#526071]">{m.original_filename}</Text>
                                    </View>
                                    {selectedMaterialId === m.id && <IconCheck size={20} color="#001428" />}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Topic & BSIT Curriculum Modal */}
            <Modal visible={topicModalOpen} transparent animationType="slide" onRequestClose={() => setTopicModalOpen(false)}>
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                    <Pressable className="flex-1" onPress={() => setTopicModalOpen(false)} />
                    <View className="max-h-[85%] rounded-t-3xl bg-white p-5 border border-[#E4E8EE]">
                        <View className="flex-row items-center justify-between pb-3">
                            <View>
                                <Text className="font-geist-semibold text-lg text-[#001428]">Select IT Topic</Text>
                                <Text className="font-geist text-xs text-[#526071]">Choose from your saved topics or any BSIT subject</Text>
                            </View>
                            <Pressable onPress={() => setTopicModalOpen(false)} className="p-1">
                                <IconX size={20} color="#526071" />
                            </Pressable>
                        </View>

                        {/* Search Bar */}
                        <View className="my-2 flex-row items-center rounded-xl bg-[#F1F4F8] px-3 py-2">
                            <IconSearch size={18} color="#526071" />
                            <TextInput
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                placeholder="Search BSIT subjects or topics..."
                                placeholderTextColor="#8A99AD"
                                className="ml-2 flex-1 font-geist text-sm text-[#001428]"
                            />
                        </View>

                        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
                            {/* Saved Topics Section */}
                            {(labels.topics ?? []).length > 0 && !searchTerm && (
                                <View className="gap-2">
                                    <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                        Your Saved Topics
                                    </Text>
                                    {labels.topics.map(t => {
                                        const sub = labels.subjects?.find(s => s.id === t.subject_id);
                                        const labelText = sub ? `${sub.name} • ${t.name}` : t.name;
                                        return (
                                            <Pressable
                                                key={t.id}
                                                onPress={() => {
                                                    onSelectTopic(t.id);
                                                    setTopicModalOpen(false);
                                                }}
                                                className={`flex-row items-center justify-between rounded-xl p-3 border border-[#E4E8EE] ${
                                                    selectedTopicId === t.id ? 'bg-[#F1F4F8] border-[#001428]' : 'bg-white active:bg-[#F1F4F8]'
                                                }`}
                                            >
                                                <View className="flex-1 pr-2">
                                                    <Text className="font-geist-medium text-sm text-[#001428]">{labelText}</Text>
                                                </View>
                                                {selectedTopicId === t.id && <IconCheck size={18} color="#001428" />}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            {/* BSIT Curriculum Subjects Section */}
                            <View className="gap-3">
                                <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                    BSIT Curriculum Subjects
                                </Text>
                                {filteredSections.map(sec => (
                                    <View key={sec.title} className="gap-2">
                                        <Text className="font-geist-medium text-xs text-[#001428] bg-[#F1F4F8] px-3 py-1.5 rounded-lg">
                                            {sec.title}
                                        </Text>
                                        {sec.data.map(subjName => {
                                            const isSaving = savingSubject === subjName;
                                            const existingSub = labels.subjects?.find(s => s.name.toLowerCase() === subjName.toLowerCase());
                                            const isSelected = existingSub && labels.topics?.some(t => t.subject_id === existingSub.id && t.id === selectedTopicId);

                                            return (
                                                <Pressable
                                                    key={subjName}
                                                    disabled={isSaving}
                                                    onPress={() => handleSelectCurriculumSubject(subjName)}
                                                    className={`flex-row items-center justify-between rounded-xl p-3 border border-[#E4E8EE] ${
                                                        isSelected ? 'bg-[#F1F4F8] border-[#001428]' : 'bg-white active:bg-[#F1F4F8]'
                                                    }`}
                                                >
                                                    <View className="flex-1 pr-2">
                                                        <Text className="font-geist text-sm text-[#001428]">{subjName}</Text>
                                                    </View>
                                                    {isSaving ? (
                                                        <ActivityIndicator size="small" color="#001428" />
                                                    ) : isSelected ? (
                                                        <IconCheck size={18} color="#001428" />
                                                    ) : null}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
