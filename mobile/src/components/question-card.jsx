import { Pressable, ScrollView, Text, View } from 'react-native';

const DIFFICULTY_CONFIG = {
    easy: {
        label: 'Easy',
        bg: 'bg-[#ECFDF5]',
        text: 'text-[#065F46]',
        barBg: 'bg-[#065F46]',
        border: 'border-[#A7F3D0]',
        dots: 1,
    },
    medium: {
        label: 'Medium',
        bg: 'bg-[#EFF6FF]',
        text: 'text-[#1E40AF]',
        barBg: 'bg-[#1E40AF]',
        border: 'border-[#BFDBFE]',
        dots: 2,
    },
    hard: {
        label: 'Hard',
        bg: 'bg-[#FAF5FF]',
        text: 'text-[#6B21A8]',
        barBg: 'bg-[#6B21A8]',
        border: 'border-[#E9D5FF]',
        dots: 3,
    },
};

export default function QuestionCard({
    question,
    selectedOptionId,
    onSelectOption,
    disabled = false,
}) {
    if (!question) return null;

    const diff = question.difficulty?.toLowerCase() || 'medium';
    const config = DIFFICULTY_CONFIG[diff] || DIFFICULTY_CONFIG.medium;
    const options = question.options ?? [];

    return (
        <View className="gap-5">
            {/* Prompt Card */}
            <View
                className="overflow-hidden rounded-3xl border border-[#E4E8EE] bg-white p-5 shadow-sm"
                style={{ borderCurve: 'continuous' }}
            >
                {/* Header with Difficulty Pill */}
                <View className="mb-3.5 flex-row items-center justify-between">
                    <View
                        className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1 ${config.bg} ${config.border}`}
                    >
                        {/* Difficulty Indicator Bars */}
                        <View className="flex-row items-center gap-0.5">
                            {[1, 2, 3].map((step) => (
                                <View
                                    key={step}
                                    className={`h-2 w-1 rounded-full ${
                                        step <= config.dots ? config.barBg : 'bg-black/10'
                                    }`}
                                />
                            ))}
                        </View>
                        <Text className={`font-geist-semibold text-xs capitalize ${config.text}`}>
                            {config.label}
                        </Text>
                    </View>

                    <Text className="font-geist text-xs text-[#526071]">
                        Difficulty
                    </Text>
                </View>

                <Text className="font-geist-medium text-base leading-6 text-[#001428]">
                    {question.prompt}
                </Text>

                {/* Code Block if present */}
                {question.code?.text && (
                    <View
                        className="mt-4 overflow-hidden rounded-2xl bg-[#001428] p-4 shadow-sm"
                        style={{ borderCurve: 'continuous' }}
                    >
                        {question.code.language && (
                            <Text
                                className="mb-2 font-geist text-xs uppercase tracking-wider"
                                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                            >
                                {question.code.language}
                            </Text>
                        )}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <Text selectable className="font-mono text-sm leading-5 text-white">
                                {question.code.text}
                            </Text>
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Options List */}
            <View className="gap-3">
                {options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                        <Pressable
                            key={opt.id}
                            disabled={disabled}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: isSelected, disabled }}
                            accessibilityLabel={`Option ${opt.id.toUpperCase()}: ${opt.text}`}
                            onPress={() => onSelectOption(opt.id)}
                            style={({ pressed }) => [
                                {
                                    borderCurve: 'continuous',
                                    transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
                                },
                            ]}
                            className={`min-h-[56px] flex-row items-center rounded-2xl border p-4 ${
                                isSelected
                                    ? 'border-[#001428] bg-[#F1F4F8] shadow-sm'
                                    : 'border-[#E4E8EE] bg-white active:bg-[#F8FAFC]'
                            }`}
                        >
                            {/* Radio indicator */}
                            <View
                                className={`mr-3.5 h-6 w-6 items-center justify-center rounded-full border ${
                                    isSelected
                                        ? 'border-[#001428] bg-[#001428]'
                                        : 'border-[#CBD5E1] bg-white'
                                }`}
                            >
                                {isSelected ? (
                                    <View className="h-2.5 w-2.5 rounded-full bg-white" />
                                ) : (
                                    <Text className="font-geist-medium text-xs text-[#526071]">
                                        {opt.id.toUpperCase()}
                                    </Text>
                                )}
                            </View>

                            {/* Option Text */}
                            <Text
                                className={`flex-1 font-geist text-sm leading-5 ${
                                    isSelected ? 'font-geist-semibold text-[#001428]' : 'text-[#1E293B]'
                                }`}
                            >
                                {opt.text}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
