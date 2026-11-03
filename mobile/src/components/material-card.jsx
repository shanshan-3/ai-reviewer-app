import { Pressable, Text } from 'react-native';

const STATUS_LABELS = {
    processing: 'Processing', needs_review: 'Needs review', ready: 'Ready', failed: 'Import failed',
};

export default function MaterialCard({ material, onPress }) {
    return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${material.title}. ${STATUS_LABELS[material.status]}`}
        onPress={onPress} className="min-h-12 gap-2 rounded-lg border border-border bg-card p-4 active:opacity-80 focus:border-muted-foreground">
        <Text className="font-geist-semibold text-base text-foreground">{material.title}</Text>
        <Text className="font-geist text-sm text-foreground/70">{material.original_filename}</Text>
        <Text className="font-geist-medium text-sm text-foreground">{STATUS_LABELS[material.status]}</Text>
    </Pressable>;
}
