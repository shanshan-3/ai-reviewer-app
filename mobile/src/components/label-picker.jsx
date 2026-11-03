import { Pressable, Text, View } from 'react-native';
import AuthButton from '@/components/AuthButton';
import FormField from '@/components/FormField';

export default function LabelPicker({ labels, subjectId, topicId, subjectName, topicName,
    selectSubject, setTopicId, setSubjectName, setTopicName, addLabel, busy, ready }) {
    return <>
        <View className="gap-3">
            <Text className="font-geist-medium text-base text-foreground">Subject</Text>
            {ready ? <Text className="font-geist text-base text-foreground">{labels.subjects.find(label => label.id === subjectId)?.name || 'Subject unavailable'}</Text>
                : labels.subjects.map(label => <Pressable key={label.id} accessibilityRole="radio"
                    accessibilityState={{ selected: subjectId === label.id, disabled: busy }} disabled={busy}
                    onPress={() => selectSubject(label.id)} className="min-h-12 justify-center rounded-lg border border-muted-foreground px-4 py-3">
                    <Text className="font-geist text-base text-foreground">{subjectId === label.id ? 'Selected: ' : ''}{label.name}</Text>
                </Pressable>)}
            {!ready && <>
                <FormField label="New subject" labelId="new-subject" value={subjectName} onChangeText={setSubjectName} maxLength={120} editable={!busy} />
                <AuthButton submitLabel="Add subject" disabled={busy || !subjectName.trim()} onSubmit={() => addLabel('subjects')} />
            </>}
        </View>
        <View className="gap-3">
            <Text className="font-geist-medium text-base text-foreground">Topic</Text>
            {!subjectId && <Text className="font-geist text-sm text-foreground/70">Choose a subject first.</Text>}
            {ready ? <Text className="font-geist text-base text-foreground">{labels.topics.find(label => label.id === topicId)?.name || 'Topic unavailable'}</Text>
                : labels.topics.filter(label => label.subject_id === subjectId).map(label => <Pressable key={label.id} accessibilityRole="radio"
                    accessibilityState={{ selected: topicId === label.id, disabled: busy }} disabled={busy}
                    onPress={() => setTopicId(label.id)} className="min-h-12 justify-center rounded-lg border border-muted-foreground px-4 py-3">
                    <Text className="font-geist text-base text-foreground">{topicId === label.id ? 'Selected: ' : ''}{label.name}</Text>
                </Pressable>)}
            {!ready && Boolean(subjectId) && <>
                <FormField label="New topic" labelId="new-topic" value={topicName} onChangeText={setTopicName} maxLength={120} editable={!busy} />
                <AuthButton submitLabel="Add topic" disabled={busy || !topicName.trim()} onSubmit={() => addLabel('topics')} />
            </>}
        </View>
    </>;
}
