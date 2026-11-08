import { Pressable, ScrollView, Text, View } from 'react-native';

export default function QuestionCard({
    question,
    selectedOptionId,
    onSelectOption,
    disabled = false,
}) {
    if (!question) return null;

    const options = question.options ?? [];

    return (
        <View className="gap-5">
            {/* Prompt Card */}
            <View className="overflow-hidden rounded-3xl border border-[#E4E8EE] bg-white p-5">
                <View className="mb-2 flex-row items-center justify-between">
                    <View className="rounded-full bg-[#F1F4F8] px-2.5 py-0.5">
                        <Text className="font-geist-medium text-xs capitalize text-[#526071]">
                            {question.difficulty}
                        </Text>
                    </View>
                </View>

                <Text className="font-geist-medium text-base leading-6 text-[#001428]">
                    {question.prompt}
                </Text>

                {/* Code Block if present */}
                {question.code?.text && (
                    <View className="mt-4 overflow-hidden rounded-2xl bg-[#001428] p-4">
                        {question.code.language && (
                            <Text className="mb-2 font-geist text-xs uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
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
                            className={`min-h-[56px] flex-row items-center rounded-2xl border p-4 ${
                                isSelected
                                    ? 'border-[#001428] bg-[#F1F4F8]'
                                    : 'border-[#E4E8EE] bg-white active:bg-[#F1F4F8]'
                            }`}
                            style={{ borderCurve: 'continuous' }}
                        >
                            {/* Radio indicator */}
                            <View
                                className={`mr-3.5 h-6 w-6 items-center justify-center rounded-full border ${
                                    isSelected ? 'border-[#001428] bg-[#001428]' : 'border-[#E4E8EE] bg-white'
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
                                    isSelected ? 'font-geist-medium text-[#001428]' : 'text-[#001428]'
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
