import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import IconTrash from '@tabler/icons-react-native/IconTrash';

export default function DeleteConfirmationModal({
    visible,
    title = 'Delete this item?',
    description = 'This action cannot be undone.',
    isDeleting = false,
    onCancel,
    onConfirm,
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => {
                if (!isDeleting && onCancel) onCancel();
            }}
        >
            <View
                className="flex-1 items-center justify-center p-6"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
            >
                <Pressable
                    className="absolute inset-0"
                    onPress={() => {
                        if (!isDeleting && onCancel) onCancel();
                    }}
                />
                <View
                    className="w-full max-w-xs items-center rounded-3xl bg-white p-6 border border-[#E5E9F0] shadow-xl"
                    style={{ borderCurve: 'continuous' }}
                >
                    {/* Centered Red Icon Badge */}
                    <View
                        className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100/80 mb-3.5"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <IconTrash size={24} color="#DC2626" strokeWidth={1.8} />
                    </View>

                    {/* Minimal Centered Title & Description */}
                    <Text
                        className="font-geist-bold text-base text-[#001428] text-center leading-snug tracking-tight"
                    >
                        {title}
                    </Text>
                    {Boolean(description) && (
                        <Text className="mt-1.5 font-geist text-xs text-[#64748B] text-center leading-5">
                            {description}
                        </Text>
                    )}

                    {/* Action Buttons */}
                    <View className="mt-5 flex-row w-full gap-2.5">
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Cancel deletion"
                            disabled={isDeleting}
                            onPress={onCancel}
                            className="flex-1 items-center justify-center rounded-2xl bg-[#F1F4F8] py-3.5 active:bg-[#E2E8F0]"
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed && !isDeleting ? 0.97 : 1 }],
                                },
                            ]}
                        >
                            <Text className="font-geist-semibold text-xs text-[#001428]">
                                Cancel
                            </Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Confirm delete"
                            disabled={isDeleting}
                            onPress={onConfirm}
                            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-rose-600 py-3.5 active:bg-rose-700 shadow-xs"
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed && !isDeleting ? 0.97 : 1 }],
                                    opacity: isDeleting ? 0.7 : 1,
                                },
                            ]}
                        >
                            {isDeleting ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text className="font-geist-semibold text-xs text-white">
                                        Deleting...
                                    </Text>
                                </>
                            ) : (
                                <Text className="font-geist-semibold text-xs text-white">
                                    Delete
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
