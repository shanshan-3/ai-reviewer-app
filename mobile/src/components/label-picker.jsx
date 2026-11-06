import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Pressable, SectionList, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import FormField from '@/components/FormField';
import AuthMessage from '@/components/AuthMessage';
import { filterCurriculum } from '@/lib/curriculum';
import { THEME } from '@/lib/theme';

export default function LabelPicker({ labels, subjectId, selectSubject, busy, ready, message, onOpen }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const { height } = useWindowDimensions();
    const current = labels.subjects.find(label => label.id === subjectId);
    const sections = filterCurriculum(search);

    function close() {
        if (!busy) setOpen(false);
    }

    async function choose(name) {
        if (!busy && await selectSubject(name)) setOpen(false);
    }

    return <>
        <View className="overflow-hidden rounded-xl border border-border bg-card" style={{ borderCurve: 'continuous' }}>
            {ready ? <Text selectable className="px-5 py-4 font-geist-medium text-base leading-6 text-foreground">{current?.name || 'Subject unavailable'}</Text>
                : <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, expanded: open }} disabled={busy}
                    onPress={() => { onOpen(); setSearch(''); setOpen(true); }}
                    className="min-h-14 flex-row items-center gap-3 px-5 py-4 active:bg-secondary focus:bg-secondary">
                    <Text className="flex-1 font-geist-medium text-base leading-6 text-[#001428]">{current?.name || 'Choose a subject'}</Text>
                    <IconChevronRight size={20} color={THEME.mutedForeground} accessible={false} />
                </Pressable>}
        </View>
        <Modal visible={open} transparent animationType="fade" presentationStyle="overFullScreen" onRequestClose={close}>
            <SafeAreaProvider>
                <View className="flex-1">
                    <Pressable accessibilityRole="button" accessibilityLabel="Dismiss subject picker" disabled={busy}
                        accessibilityState={{ disabled: busy }} onPress={close} className="absolute inset-0 bg-black/50" />
                    <KeyboardAvoidingView className="flex-1 justify-end" pointerEvents="box-none" behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
                        <SafeAreaView edges={['bottom', 'left', 'right']} accessibilityViewIsModal
                            style={{ maxHeight: height * 0.8, flexShrink: 1, borderCurve: 'continuous' }} className="overflow-hidden rounded-t-2xl bg-card">
                            <View className="flex-row items-center gap-3 border-b border-border px-5 py-3">
                                <Text accessibilityRole="header" className="flex-1 font-geist-semibold text-lg text-[#001428]">Choose a subject</Text>
                                <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={close}
                                    className={`min-h-12 justify-center rounded-lg px-3 active:bg-secondary focus:bg-secondary ${busy ? 'opacity-40' : ''}`}>
                                    <Text className="font-geist-medium text-base text-[#001428]">Cancel</Text>
                                </Pressable>
                            </View>
                            <View className="gap-3 px-5 py-4">
                                <FormField label="Search subjects" labelId="subject-search" value={search} onChangeText={setSearch}
                                    placeholder="Search the BSIT subject list" maxLength={120} autoCapitalize="none" autoCorrect={false} editable={!busy} />
                                <AuthMessage message={message} isError />
                                {busy && <View accessibilityLiveRegion="polite" className="flex-row items-center gap-3">
                                    <ActivityIndicator color={THEME.primary} />
                                    <Text className="font-geist text-sm text-foreground">Saving subject…</Text>
                                </View>}
                            </View>
                            <SectionList sections={sections} keyExtractor={item => item} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                                style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                                renderSectionHeader={({ section }) => <View className="bg-card px-3 py-3">
                                    <Text accessibilityRole="header" className="font-geist-semibold text-sm leading-6 text-muted-foreground">{section.title}</Text>
                                </View>}
                                renderItem={({ item }) => <Pressable accessibilityRole="radio"
                                    accessibilityState={{ selected: current?.name.toLowerCase() === item.toLowerCase(), disabled: busy }} disabled={busy} onPress={() => choose(item)}
                                    className="min-h-14 flex-row items-center gap-3 border-b border-border px-3 py-4 active:bg-secondary focus:bg-secondary">
                                    <Text className="flex-1 font-geist-medium text-base leading-6 text-foreground">{item}</Text>
                                    {current?.name.toLowerCase() === item.toLowerCase() && <IconCheck size={20} color={THEME.foreground} accessible={false} />}
                                </Pressable>}
                                ListEmptyComponent={<Text accessibilityLiveRegion="polite" className="px-3 py-5 font-geist text-sm leading-6 text-muted-foreground">No matching subjects. Try another name.</Text>} />
                        </SafeAreaView>
                    </KeyboardAvoidingView>
                </View>
            </SafeAreaProvider>
        </Modal>
    </>;
}
