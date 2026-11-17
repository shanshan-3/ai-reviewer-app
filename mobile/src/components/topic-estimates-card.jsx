import { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import IconTarget from '@tabler/icons-react-native/IconTarget';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconCircleCheck from '@tabler/icons-react-native/IconCircleCheck';

/**
 * Topic Practice Estimates Card:
 * Minimal, high-craft Apple HIG accuracy widget focusing purely on topic mastery signal.
 */
export default function TopicEstimatesCard({
    estimates = [],
    loading = false,
    limit = 5,
    onViewAllPress,
}) {
    const displayList = useMemo(() => {
        if (!estimates) return [];
        return limit ? estimates.slice(0, limit) : estimates;
    }, [estimates, limit]);

    const masteredCount = useMemo(() => {
        return estimates.filter(e => e.eligible && e.accuracy >= 80).length;
    }, [estimates]);

    const hasMore = estimates.length > displayList.length;

    if (loading) {
        return (
            <View
                className="overflow-hidden rounded-3xl border border-[#E5E9F0] bg-white p-4 shadow-2xs"
                style={{ borderCurve: 'continuous' }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                        <View
                            className="h-7 w-7 items-center justify-center rounded-lg bg-[#001428]"
                            style={{ borderCurve: 'continuous' }}
                        >
                            <IconTarget size={15} color="#FFFFFF" strokeWidth={2} />
                        </View>
                        <Text className="font-geist-bold text-sm text-[#001428]">
                            Topic Mastery
                        </Text>
                    </View>
                    <ActivityIndicator size="small" color="#001428" />
                </View>
            </View>
        );
    }

    if (!estimates || estimates.length === 0) {
        return (
            <View
                className="items-center rounded-3xl border border-[#E5E9F0] bg-white p-5 shadow-2xs text-center"
                style={{ borderCurve: 'continuous' }}
            >
                <View
                    className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-[#F1F4F8]"
                    style={{ borderCurve: 'continuous' }}
                >
                    <IconTarget size={18} color="#001428" strokeWidth={2} />
                </View>
                <Text className="font-geist-bold text-sm text-[#001428]">
                    No Topic Data
                </Text>
                <Text className="mt-0.5 text-center font-geist text-xs text-[#64748B]">
                    Take quizzes to track topic accuracy.
                </Text>
            </View>
        );
    }

    return (
        <View
            className="overflow-hidden rounded-3xl border border-[#E5E9F0] bg-white p-4 shadow-2xs"
            style={{ borderCurve: 'continuous' }}
        >
            {/* Minimal Header */}
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5">
                    <View
                        className="h-7 w-7 items-center justify-center rounded-lg bg-[#001428]"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <IconTarget size={15} color="#FFFFFF" strokeWidth={2} />
                    </View>
                    <View>
                        <Text className="font-geist-bold text-sm text-[#001428]">
                            Topic Mastery
                        </Text>
                    </View>
                    <View
                        className="rounded-full bg-[#F1F4F8] px-2 py-0.5"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="font-geist-semibold text-[10px] text-[#64748B]"
                        >
                            {masteredCount}/{estimates.length}
                        </Text>
                    </View>
                </View>

                {onViewAllPress && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="View full topic report"
                        onPress={onViewAllPress}
                        className="flex-row items-center gap-0.5 rounded-full bg-[#F1F4F8] px-2.5 py-1"
                        style={({ pressed }) => [
                            {
                                borderCurve: 'continuous',
                                transform: [{ scale: pressed ? 0.96 : 1 }],
                                backgroundColor: pressed ? '#E2E8F0' : '#F1F4F8',
                            },
                        ]}
                    >
                        <Text className="font-geist-semibold text-[11px] text-[#001428]">
                            {hasMore ? `All (${estimates.length})` : 'See All'}
                        </Text>
                        <IconChevronRight size={12} color="#001428" strokeWidth={2.5} />
                    </Pressable>
                )}
            </View>

            {/* Compact Estimates Rows */}
            <View className="mt-3 gap-3 divide-y divide-[#F1F3F6]">
                {displayList.map(item => {
                    const isEligible = item.eligible;
                    const accuracy = item.accuracy;
                    const statusLabel = !isEligible
                        ? 'Learning'
                        : accuracy >= 80
                        ? 'Mastered'
                        : accuracy >= 60
                        ? 'Proficient'
                        : 'Needs Practice';

                    const badgeStyle = !isEligible
                        ? 'bg-slate-100 text-slate-600 border-slate-200/80'
                        : accuracy >= 80
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                        : accuracy >= 60
                        ? 'bg-blue-50 text-blue-800 border-blue-200/80'
                        : 'bg-amber-50 text-amber-900 border-amber-200/80';

                    const progressColor = !isEligible
                        ? 'bg-slate-300'
                        : accuracy >= 80
                        ? 'bg-emerald-500'
                        : accuracy >= 60
                        ? 'bg-blue-500'
                        : 'bg-amber-500';

                    const progressWidth = isEligible
                        ? Math.min(100, Math.max(0, accuracy))
                        : Math.min(100, Math.round((item.sampleCount / 5) * 100));

                    return (
                        <View key={item.topicId} className="pt-3 first:pt-0">
                            {/* Topic Name & Badge */}
                            <View className="flex-row items-center justify-between gap-2">
                                <View className="flex-1 pr-2">
                                    <Text
                                        numberOfLines={1}
                                        className="font-geist-semibold text-xs text-[#001428]"
                                    >
                                        {item.topicName}
                                    </Text>
                                    <Text numberOfLines={1} className="font-geist text-[10px] text-[#64748B]">
                                        {item.subjectName}
                                    </Text>
                                </View>

                                <View
                                    className={`flex-row items-center gap-1 rounded-full border px-2 py-0.5 ${badgeStyle}`}
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    {isEligible && accuracy >= 80 && (
                                        <IconCircleCheck size={10} color="#059669" strokeWidth={2.5} />
                                    )}
                                    <Text className="font-geist-semibold text-[10px]">
                                        {statusLabel}
                                    </Text>
                                </View>
                            </View>

                            {/* Minimal Meter Bar */}
                            <View className="mt-2 gap-1">
                                <View
                                    className="h-1.5 w-full overflow-hidden rounded-full bg-[#F1F3F6]"
                                    style={{ borderCurve: 'continuous' }}
                                >
                                    <View
                                        className={`h-full rounded-full ${progressColor}`}
                                        style={{ width: `${progressWidth}%`, borderCurve: 'continuous' }}
                                    />
                                </View>

                                <View className="flex-row items-center justify-between">
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist text-[10px] text-[#64748B]"
                                    >
                                        {isEligible
                                            ? `${item.correctCount}/${item.sampleCount}`
                                            : `${item.sampleCount}/5 samples`}
                                    </Text>
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-xs text-[#001428]"
                                    >
                                        {isEligible ? `${accuracy}%` : `${progressWidth}%`}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
