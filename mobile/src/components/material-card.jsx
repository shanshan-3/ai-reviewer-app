import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import { THEME } from '@/lib/theme';

const STATUS_LABELS = {
    processing: 'Processing', needs_review: 'Needs review', ready: 'Ready', failed: 'Import failed', deleting: 'Deletion pending',
};

export default function MaterialCard({ material, onPress, onDelete, deleting = false, disabled = false }) {
    const openDisabled = disabled || deleting || material.status === 'deleting';
    const deleteDisabled = disabled || deleting || material.status === 'processing';
    const deleteLabel = deleting ? `Deleting ${material.title}`
        : material.status === 'deleting' ? `Retry deletion of ${material.title}` : `Delete ${material.title}`;

    return <View className="flex-row items-start gap-3 rounded-xl border border-border bg-card p-4">
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${material.title}. ${material.original_filename}. ${STATUS_LABELS[material.status]}`}
            accessibilityHint="Opens module details and extracted content."
            disabled={openDisabled} accessibilityState={{ disabled: openDisabled }}
            onPress={onPress} className="min-h-12 min-w-0 flex-1 gap-3 rounded-lg border-2 border-transparent active:bg-background focus:border-muted-foreground">
            <View className="gap-1">
                <Text numberOfLines={2} className="font-geist-semibold text-base leading-6 text-[#001428]">{material.title}</Text>
                <Text numberOfLines={1} className="font-geist text-xs leading-5 text-foreground/70">{material.original_filename}</Text>
            </View>
            <View className="flex-row items-center justify-between gap-2">
                <View className="shrink rounded-md bg-background px-2 py-1">
                    <Text className="font-geist-medium text-xs leading-5 text-foreground/70">{STATUS_LABELS[material.status]}</Text>
                </View>
                <IconChevronRight size={18} color={THEME.mutedForeground} accessible={false} />
            </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={deleteLabel} accessibilityHint="Opens a confirmation dialog."
            disabled={deleteDisabled} accessibilityState={{ disabled: deleteDisabled, busy: deleting }}
            onPress={onDelete} className="h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-transparent active:scale-[0.97] active:opacity-80 focus:border-destructive">
            {deleting ? <ActivityIndicator size="small" color={THEME.destructive} accessible={false} />
                : <IconTrash size={20} color={THEME.destructive} accessible={false} />}
        </Pressable>
    </View>;
}
