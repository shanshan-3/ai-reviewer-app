import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconFileText from '@tabler/icons-react-native/IconFileText';

const STATUS_CONFIG = {
    ready: { label: 'Ready', dot: 'bg-emerald-500', text: 'text-emerald-700' },
    processing: { label: 'Processing', dot: 'bg-amber-500', text: 'text-amber-700' },
    needs_review: { label: 'Needs review', dot: 'bg-indigo-500', text: 'text-indigo-700' },
    failed: { label: 'Import failed', dot: 'bg-rose-500', text: 'text-rose-700' },
    deleting: { label: 'Deleting…', dot: 'bg-slate-400', text: 'text-slate-600' },
};

export default function MaterialCard({ material, onPress, onDelete, deleting = false, disabled = false }) {
    const openDisabled = disabled || deleting || material.status === 'deleting';
    const deleteDisabled = disabled || deleting || material.status === 'processing';
    const statusInfo = STATUS_CONFIG[material.status] || {
        label: material.status,
        dot: 'bg-slate-400',
        text: 'text-[#526071]',
    };
    const deleteLabel = deleting ? `Deleting ${material.title}`
        : material.status === 'deleting' ? `Retry deletion of ${material.title}` : `Delete ${material.title}`;

    return (
        <View
            className={`flex-row items-center justify-between rounded-2xl border border-[#E4E8EE] bg-white p-3.5 shadow-2xs ${
                deleting ? 'opacity-50' : ''
            }`}
            style={{ borderCurve: 'continuous' }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${material.title}. ${material.original_filename}. Status: ${statusInfo.label}`}
                accessibilityHint="Opens module details and extracted content."
                disabled={openDisabled}
                accessibilityState={{ disabled: openDisabled }}
                onPress={onPress}
                style={({ pressed }) => [
                    {
                        borderCurve: 'continuous',
                        transform: [{ scale: pressed && !openDisabled ? 0.985 : 1 }],
                    },
                ]}
                className={`min-w-0 flex-1 flex-row items-center justify-between pr-2 active:opacity-75 ${
                    openDisabled ? 'opacity-40' : ''
                }`}
            >
                <View className="min-w-0 flex-1 pr-3">
                    <Text
                        numberOfLines={1}
                        className="font-geist-semibold text-base text-[#001428]"
                    >
                        {material.title}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1.5">
                        <View className="flex-row items-center gap-1.5">
                            <View className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                            <Text className={`font-geist-medium text-xs ${statusInfo.text}`}>
                                {statusInfo.label}
                            </Text>
                        </View>
                        <Text className="font-geist text-xs text-[#94A3B8]">•</Text>
                        <View className="min-w-0 flex-1 flex-row items-center gap-1 pr-1">
                            <IconFileText size={13} color="#526071" accessible={false} />
                            <Text numberOfLines={1} className="font-geist text-xs text-[#526071]">
                                {material.original_filename}
                            </Text>
                        </View>
                    </View>
                </View>

                <IconChevronRight size={18} color="#94A3B8" accessible={false} />
            </Pressable>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel={deleteLabel}
                accessibilityHint="Opens confirmation dialog to delete this module."
                disabled={deleteDisabled}
                accessibilityState={{ disabled: deleteDisabled, busy: deleting }}
                hitSlop={10}
                onPress={onDelete}
                className={`h-9 w-9 shrink-0 items-center justify-center rounded-xl active:bg-[#FEF2F2] ${
                    deleteDisabled ? 'opacity-40' : ''
                }`}
                style={({ pressed }) => [
                    {
                        borderCurve: 'continuous',
                        transform: [{ scale: pressed && !deleteDisabled ? 0.92 : 1 }],
                    },
                ]}
            >
                {deleting ? (
                    <ActivityIndicator size="small" color="#DC2626" accessible={false} />
                ) : (
                    <IconTrash size={16} color="#DC2626" strokeWidth={1.8} accessible={false} />
                )}
            </Pressable>
        </View>
    );
}
