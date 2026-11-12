import { Pressable, Text, View } from 'react-native';
import IconFlame from '@tabler/icons-react-native/IconFlame';
import IconCircleCheck from '@tabler/icons-react-native/IconCircleCheck';
import IconTrophy from '@tabler/icons-react-native/IconTrophy';
import IconCalendar from '@tabler/icons-react-native/IconCalendar';
import { getCurrentWeekDays } from '@/lib/study-date';

/**
 * Compact Streak Badge Pill for headers and navigation bars.
 * Pure vector Tabler icons, zero emojis, tabular numerals, continuous curves.
 */
export function StreakBadge({
    count = 0,
    hasStudiedToday = false,
    onPress,
    style,
}) {
    const isLit = hasStudiedToday && count > 0;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${count} day study streak. ${hasStudiedToday ? 'Goal completed today' : 'Study today to maintain streak'}.`}
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [
                {
                    borderCurve: 'continuous',
                    transform: [{ scale: pressed && onPress ? 0.97 : 1 }],
                },
                style,
            ]}
            className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                isLit
                    ? 'border-amber-200 bg-amber-50/70'
                    : 'border-[#E4E8EE] bg-white'
            }`}
        >
            <IconFlame
                size={14}
                color={isLit ? '#D97706' : '#94A3B8'}
                fill={isLit ? '#FDE68A' : 'none'}
                strokeWidth={2}
            />
            <Text
                style={{ fontVariant: ['tabular-nums'] }}
                className={`font-geist-bold text-xs ${
                    isLit ? 'text-amber-900' : 'text-[#526071]'
                }`}
            >
                {count} {count === 1 ? 'day' : 'days'}
            </Text>
        </Pressable>
    );
}

/**
 * Weekly Calendar Date Strip:
 * Displays the 7 days of the current week with day-of-week on top,
 * date number below, and active streak status indicator.
 */
export function WeeklyDateStrip({
    recentDays = [],
    timeZone,
    onDayPress,
}) {
    const days = getCurrentWeekDays(timeZone);
    const studiedSet = new Set(recentDays || []);

    return (
        <View className="flex-row items-center justify-between gap-1.5">
            {days.map(day => {
                const isStudied = studiedSet.has(day.dateString);
                const isToday = day.isToday;

                return (
                    <Pressable
                        key={day.dateString}
                        accessibilityRole="button"
                        accessibilityLabel={`${day.dayLabel}, ${day.dayNumber}: ${
                            isStudied
                                ? 'Study goal completed'
                                : isToday
                                ? 'Due today'
                                : day.isPast
                                ? 'No study activity'
                                : 'Upcoming'
                        }`}
                        onPress={() => onDayPress?.(day)}
                        disabled={!onDayPress}
                        className={`flex-1 items-center justify-center py-2 px-0.5 rounded-xl border ${
                            isStudied
                                ? 'border-amber-200 bg-amber-50/80 shadow-2xs'
                                : isToday
                                ? 'border-[#001428]/25 bg-white shadow-2xs'
                                : 'border-[#E4E8EE]/70 bg-[#F8F8FF]/80'
                        }`}
                        style={({ pressed }) => [
                            {
                                borderCurve: 'continuous',
                                transform: [{ scale: pressed && onDayPress ? 0.95 : 1 }],
                            },
                        ]}
                    >
                        {/* Day of Week Label on Top */}
                        <Text
                            className={`font-geist-medium text-[10px] uppercase tracking-wider ${
                                isStudied
                                    ? 'text-amber-800'
                                    : isToday
                                    ? 'text-[#001428] font-geist-bold'
                                    : 'text-[#64748B]'
                            }`}
                        >
                            {day.dayLabel}
                        </Text>

                        {/* Date Number Below */}
                        <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className={`mt-0.5 font-geist-bold text-sm ${
                                isStudied
                                    ? 'text-amber-950'
                                    : isToday
                                    ? 'text-[#001428]'
                                    : day.isPast
                                    ? 'text-[#475569]'
                                    : 'text-[#94A3B8]'
                            }`}
                        >
                            {day.dayNumber}
                        </Text>

                        {/* Status Glyph / Vector Indicator */}
                        <View className="mt-1.5 h-3.5 items-center justify-center">
                            {isStudied ? (
                                <IconFlame
                                    size={13}
                                    color="#D97706"
                                    fill="#FDE68A"
                                    strokeWidth={2}
                                />
                            ) : isToday ? (
                                <View className="h-1.5 w-1.5 rounded-full border border-slate-500 bg-slate-300" />
                            ) : day.isPast ? (
                                <View className="h-0.5 w-1.5 rounded-full bg-slate-300" />
                            ) : (
                                <View className="h-0.5 w-0.5 rounded-full bg-slate-200" />
                            )}
                        </View>
                    </Pressable>
                );
            })}
        </View>
    );
}

/**
 * Full Progress & Streak Summary Card.
 * Adheres to Apple HIG and Emil Kowalski design engineering principles:
 * - Fluid pointer feedback (active:scale-[0.985])
 * - Optical alignment & tabular figures
 * - Weekly calendar date strip on top
 * - Crisp borders and high-contrast semantic palette
 */
export default function ProgressSummary({
    streak = {},
    timeZone,
    onPress,
}) {
    const {
        currentStreak = 0,
        longestStreak = 0,
        hasStudiedToday = false,
        totalStudyDays = 0,
        recentDays = [],
    } = streak;

    const isLit = hasStudiedToday && currentStreak > 0;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Study progress summary: ${currentStreak} days current streak, ${longestStreak} days best streak, ${totalStudyDays} total study days.`}
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [
                {
                    borderCurve: 'continuous',
                    transform: [{ scale: pressed && onPress ? 0.985 : 1 }],
                },
            ]}
            className={`overflow-hidden rounded-2xl border p-4 shadow-2xs ${
                isLit
                    ? 'border-amber-200/90 bg-amber-50/40'
                    : 'border-[#E4E8EE] bg-white'
            }`}
        >
            {/* Header row */}
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                    <View
                        className={`h-9 w-9 items-center justify-center rounded-xl border ${
                            isLit
                                ? 'border-amber-200 bg-amber-100/70'
                                : 'border-[#E4E8EE] bg-[#F8F8FF]'
                        }`}
                        style={{ borderCurve: 'continuous' }}
                    >
                        <IconFlame
                            size={20}
                            color={isLit ? '#D97706' : '#64748B'}
                            fill={isLit ? '#FDE68A' : 'none'}
                            strokeWidth={2}
                        />
                    </View>
                    <View>
                        <View className="flex-row items-baseline gap-1.5">
                            <Text
                                style={{ fontVariant: ['tabular-nums'] }}
                                className="font-geist-bold text-2xl tracking-tight text-[#001428]"
                            >
                                {currentStreak}
                            </Text>
                            <Text className="font-geist-semibold text-xs uppercase tracking-wider text-[#526071]">
                                {currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Status indicator badge */}
                <View
                    className={`flex-row items-center gap-1 rounded-full border px-2.5 py-1 ${
                        hasStudiedToday
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-slate-200 bg-slate-50'
                    }`}
                >
                    {hasStudiedToday ? (
                        <>
                            <IconCircleCheck size={12} color="#059669" strokeWidth={2.5} />
                            <Text className="font-geist-medium text-[11px] text-emerald-800">
                                Completed Today
                            </Text>
                        </>
                    ) : (
                        <>
                            <View className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <Text className="font-geist-medium text-[11px] text-slate-600">
                                Due Today
                            </Text>
                        </>
                    )}
                </View>
            </View>

            {/* Weekly Calendar Date Strip */}
            <View className="mt-4 pt-3 border-t border-[#E4E8EE]/80">
                <View className="mb-2 flex-row items-center justify-between">
                    <Text className="font-geist-semibold text-[11px] uppercase tracking-wider text-[#526071]">
                        {"This Week's Activity"}
                    </Text>

                    <Text className="font-geist text-[11px] text-[#526071]">
                        {hasStudiedToday ? 'Goal reached' : '1 review to complete'}
                    </Text>
                </View>
                <WeeklyDateStrip recentDays={recentDays} timeZone={timeZone} />
            </View>

            {/* Motivational subtext */}
            <Text className="mt-3.5 font-geist text-xs leading-4 text-[#526071]">
                {hasStudiedToday
                    ? 'Daily study goal accomplished! Keep reviewing tomorrow to extend your streak.'
                    : 'Complete a quiz or review every flashcard in a deck today to maintain your streak.'}
            </Text>

            {/* Metrics Breakdown Grid */}
            <View
                className="mt-3.5 flex-row items-center divide-x divide-[#E4E8EE] rounded-xl border border-[#E4E8EE] bg-white py-2"
                style={{ borderCurve: 'continuous' }}
            >
                <View className="flex-1 items-center px-2">
                    <View className="flex-row items-center gap-1">
                        <IconTrophy size={13} color="#94A3B8" />
                        <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="font-geist-bold text-sm text-[#001428]"
                        >
                            {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                        </Text>
                    </View>
                    <Text className="mt-0.5 font-geist text-[10px] uppercase tracking-wider text-[#526071]">
                        Longest
                    </Text>
                </View>

                <View className="flex-1 items-center px-2">
                    <View className="flex-row items-center gap-1">
                        <IconCalendar size={13} color="#94A3B8" />
                        <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="font-geist-bold text-sm text-[#001428]"
                        >
                            {totalStudyDays} {totalStudyDays === 1 ? 'day' : 'days'}
                        </Text>
                    </View>
                    <Text className="mt-0.5 font-geist text-[10px] uppercase tracking-wider text-[#526071]">
                        Total Active
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
