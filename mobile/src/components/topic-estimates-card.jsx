import { Pressable, Text, View } from 'react-native';
import IconTarget from '@tabler/icons-react-native/IconTarget';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';

/**
 * Topic Practice Estimates Card:
 * Displays rolling 20-answer accuracy percentages, 5-answer eligibility thresholds,
 * and semantic mastery badges for IT topics.
 */
export default function TopicEstimatesCard({
    estimates = [],
    loading = false,
    limit = 5,
    onViewAllPress,
}) {
    if (loading) {
        return (
            <View
                className="overflow-hidden rounded-2xl border border-[#E4E8EE] bg-white p-4 shadow-2xs"
                style={{ borderCurve: 'continuous' }}
            >
                <View className="flex-row items-center gap-2">
                    <IconTarget size={18} color="#64748B" />
                    <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                        Topic Practice Estimates
                    </Text>
                </View>
                <Text className="mt-3 font-geist text-xs text-[#526071]">
                    Loading accuracy metrics...
                </Text>
            </View>
        );
    }

    if (!estimates || estimates.length === 0) {
        return (
            <View
                className="overflow-hidden rounded-2xl border border-[#E4E8EE] bg-white p-4 shadow-2xs"
                style={{ borderCurve: 'continuous' }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <IconTarget size={18} color="#64748B" />
                        <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                            Topic Practice Estimates
                        </Text>
                    </View>
                </View>
                <Text className="mt-2.5 font-geist text-xs leading-5 text-[#526071]">
                    Complete practice quizzes to establish topic accuracy estimates and identify your strengths.
                </Text>
            </View>
        );
    }

    const displayList = limit ? estimates.slice(0, limit) : estimates;
    const hasMore = estimates.length > displayList.length;

    return (
        <View
            className="overflow-hidden rounded-2xl border border-[#E4E8EE] bg-white p-4 shadow-2xs"
            style={{ borderCurve: 'continuous' }}
        >
            {/* Header */}
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                    <IconTarget size={18} color="#001428" />
                    <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                        Topic Practice Estimates
                    </Text>
                </View>
                {onViewAllPress && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="View full performance report"
                        onPress={onViewAllPress}
                        className="flex-row items-center gap-1 active:opacity-75"
                    >
                        <Text className="font-geist-medium text-[11px] text-[#2563EB]">
                            {hasMore ? `See All (${estimates.length})` : 'Details →'}
                        </Text>
                    </Pressable>
                )}
            </View>

            <Text className="mt-1 font-geist text-[11px] text-[#526071]">
                Latest 20 first-submission answers per topic (min. 5 answers for estimate).
            </Text>

            {/* Estimates List */}
            <View className="mt-3.5 gap-3 divide-y divide-[#E4E8EE]/80">
                {displayList.map(item => {
                    const isEligible = item.eligible;
                    const accuracy = item.accuracy;
                    const statusLabel = !isEligible
                        ? 'Pending (<5)'
                        : accuracy >= 80
                        ? 'Mastered'
                        : accuracy >= 60
                        ? 'Proficient'
                        : 'Needs Practice';

                    const badgeStyle = !isEligible
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : accuracy >= 80
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : accuracy >= 60
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200';

                    const progressColor = !isEligible
                        ? 'bg-slate-300'
                        : accuracy >= 80
                        ? 'bg-emerald-500'
                        : accuracy >= 60
                        ? 'bg-blue-500'
                        : 'bg-amber-500';

                    const progressWidth = isEligible ? accuracy : Math.round((item.sampleCount / 5) * 100);

                    return (
                        <View key={item.topicId} className="pt-3 first:pt-0">
                            <View className="flex-row items-start justify-between gap-2">
                                <View className="flex-1 pr-2">
                                    <Text
                                        numberOfLines={1}
                                        className="font-geist-semibold text-xs text-[#001428]"
                                    >
                                        {item.topicName}
                                    </Text>
                                    <Text numberOfLines={1} className="font-geist text-[10px] text-[#526071]">
                                        {item.subjectName}
                                    </Text>
                                </View>

                                <View className={`rounded-full border px-2 py-0.5 ${badgeStyle}`}>
                                    <Text className="font-geist-semibold text-[10px]">
                                        {statusLabel}
                                    </Text>
                                </View>
                            </View>

                            {/* Progress bar & stats */}
                            <View className="mt-2 gap-1">
                                <View className="h-1.5 w-full overflow-hidden rounded-full bg-[#F1F4F8]">
                                    <View
                                        className={`h-full ${progressColor}`}
                                        style={{ width: `${progressWidth}%` }}
                                    />
                                </View>
                                <View className="flex-row items-center justify-between">
                                    <Text className="font-geist text-[10px] text-[#526071]">
                                        {isEligible
                                            ? `${item.correctCount}/${item.sampleCount} correct`
                                            : `${item.sampleCount} of 5 required answers`}
                                    </Text>
                                    <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className="font-geist-bold text-xs text-[#001428]"
                                    >
                                        {isEligible ? `${accuracy}%` : 'Data Building'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Disclaimer Footer */}
            <View className="mt-3.5 flex-row items-center gap-1.5 border-t border-[#E4E8EE]/80 pt-2.5">
                <IconInfoCircle size={12} color="#64748B" />
                <Text className="flex-1 font-geist text-[10px] text-[#526071]">
                    Practice estimates reflect self-study progress and do not certify exam readiness.
                </Text>
            </View>
        </View>
    );
}
