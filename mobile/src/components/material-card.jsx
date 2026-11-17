import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconFileText from '@tabler/icons-react-native/IconFileText';

const STATUS_CONFIG = {
    ready: { label: 'Ready', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200/80' },
    processing: { label: 'Processing', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200/80' },
    needs_review: { label: 'Needs review', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200/80' },
    failed: { label: 'Import failed', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200/80' },
    deleting: { label: 'Deleting...', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export default function MaterialCard({ material, onPress, onDelete, deleting = false, disabled = false }) {
    const openDisabled = disabled || deleting || material.status === 'deleting';
    const deleteDisabled = disabled || deleting || material.status === 'processing';
    const statusInfo = STATUS_CONFIG[material.status] || {
        label: material.status,
        bg: 'bg-[#F1F4F8]',
        text: 'text-[#526071]',
        border: 'border-[#E4E8EE]',
    };
    const deleteLabel = deleting ? `Deleting ${material.title}`
        : material.status === 'deleting' ? `Retry deletion of ${material.title}` : `Delete ${material.title}`;

    return (
        <View
            className="flex-row items-start gap-2 rounded-2xl border border-[#E4E8EE] bg-white p-3 shadow-xs"
            style={{ borderCurve: 'continuous' }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${material.title}. ${material.original_filename}. ${statusInfo.label}`}
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
                className={`min-h-12 min-w-0 flex-1 gap-4 rounded-xl p-2 active:bg-[#F8FAFC] ${
                    openDisabled ? 'opacity-40' : ''
                }`}
            >
                <View className="gap-2">
                    <Text
                        numberOfLines={2}
                        className="font-geist-semibold text-lg leading-7 tracking-tight text-[#001428]"
                    >
                        {material.title}
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <IconFileText size={15} color="#526071" accessible={false} />
                        <Text numberOfLines={1} className="flex-1 font-geist text-xs leading-5 text-[#526071]">
                            {material.original_filename}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center justify-between gap-2">
                    <View
                        className={`shrink rounded-full border px-2.5 py-0.5 ${statusInfo.bg} ${statusInfo.border}`}
                        style={{ borderCurve: 'continuous' }}
                    >
                        <Text className={`font-geist-medium text-[11px] leading-4 ${statusInfo.text}`}>
                            {statusInfo.label}
                        </Text>
                    </View>
                    <IconChevronRight size={18} color="#94A3B8" accessible={false} />
                </View>
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={deleteLabel}
                accessibilityHint="Opens a confirmation dialog."
                disabled={deleteDisabled}
                accessibilityState={{ disabled: deleteDisabled, busy: deleting }}
                onPress={onDelete}
                style={({ pressed }) => [
                    {
                        borderCurve: 'continuous',
                        transform: [{ scale: pressed && !deleteDisabled ? 0.92 : 1 }],
                    },
                ]}
                className={`h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-transparent active:bg-rose-50 ${
                    deleteDisabled ? 'opacity-40' : ''
                }`}
            >
                {deleting ? (
                    <ActivityIndicator size="small" color="#DC2626" accessible={false} />
                ) : (
                    <IconTrash size={19} color="#DC2626" strokeWidth={1.8} accessible={false} />
                )}
            </Pressable>
        </View>
    );
}
