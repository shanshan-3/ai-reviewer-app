import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconArrowRight from '@tabler/icons-react-native/IconArrowRight';
import QuestionCard from '@/components/question-card';
import { getStudySession, submitStudyAnswer } from '@/lib/quizzes';

export default function AnsweringPage() {
    const { sessionId } = useLocalSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [session, setSession] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const [error, setError] = useState(null);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);

    useEffect(() => {
        async function fetchSession() {
            setLoading(true);
            setError(null);
            try {
                const res = await getStudySession(sessionId);
                if (res.session?.status === 'completed') {
                    router.replace(`/(main)/quizzes/${sessionId}/results`);
                    return;
                }
                setSession(res.session);
                setCurrentQuestion(res.currentQuestion);
            } catch (err) {
                setError(err.message || 'Could not load quiz session.');
            } finally {
                setLoading(false);
            }
        }
        if (sessionId) fetchSession();
    }, [sessionId, router]);

    async function handleSubmit() {
        if (!selectedOptionId || !currentQuestion || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await submitStudyAnswer(sessionId, currentQuestion.id, selectedOptionId);
            if (res.session?.status === 'completed') {
                router.replace(`/(main)/quizzes/${sessionId}/results`);
                return;
            }
            setSession(res.session);
            setCurrentQuestion(res.currentQuestion);
            setSelectedOptionId(null);
        } catch (err) {
            setError(err.message || 'Submission failed. Please retry.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#001428" />
                <Text className="mt-3 font-geist text-sm text-[#526071]">Loading quiz session...</Text>
            </SafeAreaView>
        );
    }

    if (error && !currentQuestion) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-background p-6">
                <Text className="text-center font-geist-semibold text-lg text-[#001428]">Could not load quiz</Text>
                <Text className="mt-2 text-center font-geist text-sm text-[#526071]">{error}</Text>
                <Pressable
                    onPress={() => router.replace('/(main)/(tabs)/quizzes')}
                    className="mt-6 rounded-2xl bg-[#F1F4F8] px-5 py-3"
                >
                    <Text className="font-geist-medium text-sm text-[#001428]">Return to Quizzes</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const currentNumber = (session?.answeredCount ?? session?.answered_count ?? 0) + 1;
    const totalCount = session?.questionCount ?? session?.question_count ?? 1;
    const isLastQuestion = currentNumber >= totalCount;
    const progressPercent = Math.min(100, Math.round((((session?.answeredCount ?? session?.answered_count ?? 0)) / totalCount) * 100));

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
            {/* Header */}
            <View className="border-b border-[#E4E8EE] bg-white px-4 py-3">
                <View className="flex-row items-center justify-between">
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Leave quiz"
                        onPress={() => setLeaveModalOpen(true)}
                        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.92 : 1 }] }]}
                        className="h-10 w-10 items-center justify-center rounded-full active:bg-[#F1F4F8]"
                    >
                        <IconArrowLeft size={22} color="#001428" />
                    </Pressable>

                    <Text className="font-geist-medium text-sm text-[#001428]">
                        Question {currentNumber} of {totalCount}
                    </Text>

                    <View className="w-10" />
                </View>

                {/* Progress bar with Apple continuous curvature */}
                <View className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F1F4F8]">
                    <View
                        className="h-full rounded-full bg-[#001428]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </View>
            </View>

            {/* Question Body */}
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
                {error && (
                    <View
                        className="mb-4 rounded-2xl border border-[#DC2626] bg-white p-4 shadow-sm"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <Text className="font-geist text-sm text-[#DC2626]">{error}</Text>
                    </View>
                )}

                <QuestionCard
                    question={currentQuestion}
                    selectedOptionId={selectedOptionId}
                    onSelectOption={optId => {
                        setSelectedOptionId(optId);
                        setError(null);
                    }}
                    disabled={submitting}
                />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 border-t border-[#E4E8EE] bg-white px-5 py-4">
                <Pressable
                    disabled={!selectedOptionId || submitting}
                    accessibilityRole="button"
                    accessibilityLabel={isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                    onPress={handleSubmit}
                    style={({ pressed }) => [
                        {
                            borderCurve: 'continuous',
                            transform: [{ scale: pressed && selectedOptionId && !submitting ? 0.985 : 1 }],
                        },
                    ]}
                    className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 shadow-sm ${
                        !selectedOptionId || submitting ? 'bg-[#F1F4F8]' : 'bg-[#001428]'
                    }`}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : isLastQuestion ? (
                        <>
                            <IconCheck size={20} color="white" />
                            <Text className="font-geist-semibold text-base text-white">Finish Quiz</Text>
                        </>
                    ) : (
                        <>
                            <Text className="font-geist-semibold text-base text-white">Next Question</Text>
                            <IconArrowRight size={20} color="white" />
                        </>
                    )}
                </Pressable>
            </View>

            {/* Leave Confirmation Modal */}
            <Modal visible={leaveModalOpen} transparent animationType="fade" onRequestClose={() => setLeaveModalOpen(false)}>
                <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                    <View
                        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-[#E4E8EE]"
                        style={{ borderCurve: 'continuous' }}
                    >
                        <Text className="font-geist-bold text-lg text-[#001428]">Leave Quiz?</Text>
                        <Text className="mt-2 font-geist text-sm leading-5 text-[#526071]">
                            Your answered questions are safely stored. You can resume this session anytime from the Quizzes tab.
                        </Text>
                        <View className="mt-6 flex-row gap-3">
                            <Pressable
                                onPress={() => setLeaveModalOpen(false)}
                                style={({ pressed }) => [{ borderCurve: 'continuous', transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                                className="flex-1 items-center justify-center rounded-2xl bg-[#F1F4F8] py-3.5"
                            >
                                <Text className="font-geist-medium text-sm text-[#001428]">Continue</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setLeaveModalOpen(false);
                                    router.replace('/(main)/(tabs)/quizzes');
                                }}
                                style={({ pressed }) => [{ borderCurve: 'continuous', transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                                className="flex-1 items-center justify-center rounded-2xl bg-[#DC2626] py-3.5"
                            >
                                <Text className="font-geist-medium text-sm text-white">Exit</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
