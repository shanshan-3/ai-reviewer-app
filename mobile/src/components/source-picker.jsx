import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconBook from '@tabler/icons-react-native/IconBook';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconChevronDown from '@tabler/icons-react-native/IconChevronDown';

export default function SourcePicker({
    sourceKind,
    onSelectKind,
    selectedMaterialId,
    onSelectMaterial,
    selectedTopicId,
    onSelectTopic,
    materials = [],
    labels = { subjects: [], topics: [] },
    loading = false,
}) {
    const [materialModalOpen, setMaterialModalOpen] = useState(false);
    const [topicModalOpen, setTopicModalOpen] = useState(false);

    const readyMaterials = materials.filter(m => m.status === 'ready');
    const selectedMaterial = readyMaterials.find(m => m.id === selectedMaterialId);
    const selectedTopic = labels.topics.find(t => t.id === selectedTopicId);

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
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5 ${
                        sourceKind === 'module' ? 'bg-white' : ''
                    }`}
                >
                    <IconFileText size={18} color={sourceKind === 'module' ? '#001428' : '#526071'} />
                    <Text
                        className={`font-geist-medium text-sm ${
                            sourceKind === 'module' ? 'text-[#001428]' : 'text-[#526071]'
                        }`}
                    >
                        School Module
                    </Text>
                </Pressable>

                <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: sourceKind === 'topic' }}
                    onPress={() => onSelectKind('topic')}
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5 ${
                        sourceKind === 'topic' ? 'bg-white' : ''
                    }`}
                >
                    <IconBook size={18} color={sourceKind === 'topic' ? '#001428' : '#526071'} />
                    <Text
                        className={`font-geist-medium text-sm ${
                            sourceKind === 'topic' ? 'text-[#001428]' : 'text-[#526071]'
                        }`}
                    >
                        IT Topic
                    </Text>
                </Pressable>
            </View>

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
                    ) : labels.topics.length === 0 ? (
                        <View className="rounded-2xl border border-dashed border-[#E4E8EE] bg-white p-4">
                            <Text className="font-geist text-sm leading-5 text-[#526071]">
                                No personal topics found. Approve a module to create topics or select one from the curriculum.
                            </Text>
                        </View>
                    ) : (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Topic: ${selectedTopic?.name || 'Choose a topic'}`}
                            onPress={() => setTopicModalOpen(true)}
                            className="min-h-14 flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white px-4 py-3"
                        >
                            <View className="flex-1 pr-2">
                                <Text className="font-geist text-xs text-[#526071]">Selected Topic</Text>
                                <Text numberOfLines={1} className="font-geist-medium text-sm text-[#001428]">
                                    {selectedTopic?.name || 'Select an IT topic'}
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

            {/* Topic Modal */}
            <Modal visible={topicModalOpen} transparent animationType="slide" onRequestClose={() => setTopicModalOpen(false)}>
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                    <Pressable className="flex-1" onPress={() => setTopicModalOpen(false)} />
                    <View className="max-h-[70%] rounded-t-3xl bg-white p-5 border border-[#E4E8EE]">
                        <Text className="mb-4 font-geist-semibold text-lg text-[#001428]">Select IT Topic</Text>
                        <ScrollView contentContainerStyle={{ gap: 8 }}>
                            {labels.topics.map(t => (
                                <Pressable
                                    key={t.id}
                                    onPress={() => {
                                        onSelectTopic(t.id);
                                        setTopicModalOpen(false);
                                    }}
                                    className={`flex-row items-center justify-between rounded-xl p-3 ${
                                        selectedTopicId === t.id ? 'bg-[#F1F4F8]' : 'active:opacity-80'
                                    }`}
                                >
                                    <View className="flex-1 pr-2">
                                        <Text className="font-geist-medium text-sm text-[#001428]">{t.name}</Text>
                                    </View>
                                    {selectedTopicId === t.id && <IconCheck size={20} color="#001428" />}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
