import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import { THEME } from '@/lib/theme';

const STATUS_LABELS = {
    processing: 'Processing', needs_review: 'Needs review', ready: 'Ready', failed: 'Import failed', deleting: 'Deletion pending',
};

export default function MaterialCard({ material, onPress, onDelete, deleting = false, disabled = false }) {
    const openDisabled = disabled || deleting || material.status === 'deleting';
    const deleteDisabled = disabled || deleting || material.status === 'processing';
    const deleteLabel = deleting ? `Deleting ${material.title}`
        : material.status === 'deleting' ? `Retry deletion of ${material.title}` : `Delete ${material.title}`;

    return <View className="flex-row items-start gap-2 rounded-2xl border border-[#E4E8EE] bg-card p-3" style={{ borderCurve: 'continuous' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${material.title}. ${material.original_filename}. ${STATUS_LABELS[material.status]}`}
            accessibilityHint="Opens module details and extracted content."
            disabled={openDisabled} accessibilityState={{ disabled: openDisabled }}
            onPress={onPress} className={`min-h-12 min-w-0 flex-1 gap-4 rounded-xl p-2 active:bg-[#F1F4F8] focus:bg-[#F1F4F8] ${openDisabled ? 'opacity-40' : ''}`}>
            <View className="gap-2">
                <Text numberOfLines={2} className="font-geist-semibold text-lg leading-7 tracking-tight text-[#001428]">{material.title}</Text>
                <View className="flex-row items-center gap-2">
                    <IconFileText size={15} color="#526071" accessible={false} />
                    <Text numberOfLines={1} className="flex-1 font-geist text-xs leading-5 text-[#526071]">{material.original_filename}</Text>
                </View>
            </View>
            <View className="flex-row items-center justify-between gap-2">
                <View className="shrink rounded-md bg-[#EDF0F5] px-2 py-1">
                    <Text className="font-geist-medium text-xs leading-5 text-[#526071]">{STATUS_LABELS[material.status]}</Text>
                </View>
                <IconChevronRight size={18} color={THEME.mutedForeground} accessible={false} />
            </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={deleteLabel} accessibilityHint="Opens a confirmation dialog."
            disabled={deleteDisabled} accessibilityState={{ disabled: deleteDisabled, busy: deleting }}
            onPress={onDelete} className={`h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-transparent active:bg-[#FEF2F2] focus:border-destructive ${deleteDisabled ? 'opacity-40' : ''}`}>
            {deleting ? <ActivityIndicator size="small" color={THEME.destructive} accessible={false} />
                : <IconTrash size={20} color={THEME.destructive} accessible={false} />}
        </Pressable>
    </View>;
}
