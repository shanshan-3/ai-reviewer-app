import { Pressable, Text, View } from 'react-native';
import IconPlayerPlay from '@tabler/icons-react-native/IconPlayerPlay';

export default function TopicEstimateCard({
    estimate,
    onPractice,
}) {
    if (!estimate) return null;

    const {
        topicName,
        subjectName,
        sampleCount = 0,
        accuracy = 0,
        eligible = false,
        status = 'insufficient_data',
    } = estimate;

    const isMastered = status === 'mastered';
    const isNeedsPractice = status === 'needs_practice';

    return (
        <View
            className="overflow-hidden rounded-3xl border border-[#E4E8EE] bg-white p-5 shadow-sm"
            style={{ borderCurve: 'continuous' }}
        >
            {/* Header: Subject & Status Pill */}
            <View className="mb-2.5 flex-row items-center justify-between">
                <Text numberOfLines={1} className="flex-1 font-geist text-xs text-[#526071] pr-2">
                    {subjectName}
                </Text>

                {eligible ? (
                    <View
                        className={`rounded-full border px-2.5 py-0.5 ${
                            isMastered
                                ? 'border-emerald-200 bg-emerald-50'
                                : isNeedsPractice
                                ? 'border-amber-200 bg-amber-50'
                                : 'border-blue-200 bg-blue-50'
                        }`}
                    >
                        <Text
                            className={`font-geist-semibold text-[11px] capitalize ${
                                isMastered
                                    ? 'text-emerald-800'
                                    : isNeedsPractice
                                    ? 'text-amber-800'
                                    : 'text-blue-800'
                            }`}
                        >
                            {isMastered ? 'Mastered' : isNeedsPractice ? 'Needs Practice' : 'Proficient'}
                        </Text>
                    </View>
                ) : (
                    <View className="rounded-full bg-[#F1F4F8] px-2.5 py-0.5">
                        <Text className="font-geist-medium text-[11px] text-[#526071]">
                            {sampleCount}/5 questions
                        </Text>
                    </View>
                )}
            </View>

            {/* Topic Title */}
            <Text numberOfLines={1} className="font-geist-bold text-base text-[#001428]">
                {topicName}
            </Text>

            {/* Progress / Accuracy Bar */}
            {eligible ? (
                <View className="mt-3 gap-1.5">
                    <View className="flex-row items-center justify-between">
                        <Text className="font-geist text-xs text-[#526071]">
                            Practice accuracy ({sampleCount} questions)
                        </Text>
                        <Text className="font-geist-bold text-xs text-[#001428]">
                            {accuracy}%
                        </Text>
                    </View>
                    <View className="h-2 w-full overflow-hidden rounded-full bg-[#F1F4F8]">
                        <View
                            className={`h-full rounded-full ${
                                isMastered
                                    ? 'bg-emerald-500'
                                    : isNeedsPractice
                                    ? 'bg-amber-500'
                                    : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, accuracy)}%` }}
                        />
                    </View>
                </View>
            ) : (
                <Text className="mt-2 font-geist text-xs leading-4 text-[#526071]">
                    Practice {5 - sampleCount} more {5 - sampleCount === 1 ? 'question' : 'questions'} to unlock accuracy mastery estimate.
                </Text>
            )}

            {/* Action Trigger */}
            {onPractice && (
                <View className="mt-4 pt-2 border-t border-[#F1F4F8]">
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Practice quiz for ${topicName}`}
                        onPress={() => onPractice(estimate)}
                        style={({ pressed }) => [
                            {
                                borderCurve: 'continuous',
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                            },
                        ]}
                        className="flex-row items-center justify-center gap-2 rounded-2xl bg-[#001428] py-3 active:opacity-90 shadow-sm"
                    >
                        <IconPlayerPlay size={16} color="white" />
                        <Text className="font-geist-semibold text-xs text-white">Practice Topic</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
