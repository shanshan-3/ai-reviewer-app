import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import * as DocumentPicker from 'expo-document-picker';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconFolderOpen from '@tabler/icons-react-native/IconFolderOpen';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';
import AuthMessage from '@/components/AuthMessage';
import MaterialScreenHeader from '@/components/MaterialScreenHeader';
import { uploadMaterial, validateSelectedFile } from '@/lib/materials';
import { THEME } from '@/lib/theme';

export default function ImportMaterialPage() {
    const [asset, setAsset] = useState(null);
    const [size, setSize] = useState(0);
    const [picking, setPicking] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [takingLong, setTakingLong] = useState(false);
    const [uploadedId, setUploadedId] = useState(null);
    const [message, setMessage] = useState('');
    const working = useRef(false);
    const active = useRef(true);

    useEffect(() => {
        active.current = true;
        return () => { active.current = false; };
    }, []);

    usePreventRemove(uploading && !uploadedId, () => {
        Alert.alert('Upload in progress', 'Wait for the upload to finish before leaving this screen.');
    });

    useEffect(() => {
        if (uploadedId) router.replace({ pathname: '/(main)/materials/[materialId]', params: { materialId: uploadedId } });
    }, [uploadedId]);

    useEffect(() => {
        if (!uploading) return;
        const timeout = setTimeout(() => setTakingLong(true), 5000);
        return () => clearTimeout(timeout);
    }, [uploading]);

    async function chooseFile() {
        if (working.current) return;
        working.current = true;
        setPicking(true);
        setMessage('');
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                multiple: false, copyToCacheDirectory: true,
            });
            if (result.canceled || !active.current) return;
            const selected = result.assets[0];
            const checked = validateSelectedFile(selected);
            setAsset(selected);
            setSize(checked.size);
        } catch (error) {
            if (active.current) setMessage(error.message || 'Could not select this file.');
        } finally {
            working.current = false;
            if (active.current) setPicking(false);
        }
    }

    async function handleUpload() {
        if (!asset || working.current || uploadedId) return;
        working.current = true;
        setUploading(true);
        setTakingLong(false);
        setMessage('');
        try {
            const result = await uploadMaterial(asset);
            if (active.current) setUploadedId(result.material.id);
        } catch (error) {
            if (active.current) setMessage(error.message || 'Upload failed.');
        } finally {
            working.current = false;
            if (active.current) {
                setUploading(false);
                setTakingLong(false);
            }
        }
    }

    const busy = picking || uploading || Boolean(uploadedId);
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
            <MaterialScreenHeader title="Upload module" />
            <ScrollView className="flex-1" contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{ padding: 20, gap: 28, paddingTop: 28, paddingBottom: 32, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
                <View className="gap-3">
                    <Text accessibilityRole="header" className="font-geist-semibold text-3xl leading-10 tracking-tight text-[#001428]">Select your module</Text>
                    <Text className="font-geist text-base leading-7 text-[#526071]">Choose your notes, then review the extracted text before using it for questions.</Text>
                </View>
                <View className="gap-6 rounded-3xl border border-[#E4E8EE] bg-card p-6" style={{ borderCurve: 'continuous' }}>
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF0F5]">
                        <IconFileText size={28} color="#001428" accessible={false} />
                    </View>
                    <View className="gap-2">
                        <Text accessibilityRole="header" className="font-geist-semibold text-lg leading-7 tracking-tight text-[#001428]">{asset ? 'Selected file' : 'Choose a document'}</Text>
                        {asset ? <>
                            <Text selectable className="font-geist-medium text-base leading-7 text-[#001428]">{asset.name}</Text>
                            <Text className="font-geist text-sm leading-6 text-[#526071]">{asset.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX'} · {(size / 1024 / 1024).toFixed(2)} MiB</Text>
                        </> : <Text className="font-geist text-sm leading-6 text-[#526071]">A PDF or DOCX with selectable text, up to 5 MiB.</Text>}
                    </View>
                    <Pressable accessibilityRole="button" accessibilityHint="Opens your device’s document picker for a PDF or DOCX."
                        accessibilityState={{ disabled: busy, busy: picking }} disabled={busy} onPress={chooseFile}
                        className={`min-h-14 flex-row items-center justify-center gap-3 rounded-xl bg-[#EDF0F5] px-4 py-4 active:bg-[#E1E7EF] focus:bg-[#E1E7EF] ${busy ? 'opacity-40' : ''}`}>
                        <IconFolderOpen size={20} color="#001428" accessible={false} />
                        <Text className="shrink text-center font-geist-semibold text-base text-[#001428]">{picking ? 'Opening files…' : asset ? 'Change file' : 'Choose file'}</Text>
                    </Pressable>
                </View>
                <View className="flex-row items-start gap-3 rounded-2xl bg-[#EDF0F5] p-5" style={{ borderCurve: 'continuous' }}>
                    <IconInfoCircle size={20} color="#526071" style={{ marginTop: 2 }} accessible={false} />
                    <View className="flex-1 gap-2">
                        <Text accessibilityRole="header" className="font-geist-semibold text-sm leading-6 text-[#001428]">Before you upload</Text>
                        <Text className="font-geist text-sm leading-6 text-[#526071]">Scanned pages and images cannot be read as text. Choose a document with selectable text.</Text>
                        <Text className="font-geist text-sm leading-6 text-[#526071]">You can choose a subject in the preview.</Text>
                    </View>
                </View>
            </ScrollView>
            <View className="border-t border-[#E4E8EE] bg-card px-5 py-4">
                <View className="w-full max-w-[680px] self-center gap-3">
                    <AuthMessage message={message} isError />
                    {uploading && takingLong && <Text accessibilityLiveRegion="polite" className="font-geist text-sm leading-6 text-[#526071]">Your module is still processing. Larger or complex documents may take longer. Please keep this screen open.</Text>}
                    <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !asset, busy: uploading }} disabled={busy || !asset} onPress={handleUpload}
                        className={`min-h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-[#001428] px-5 py-4 active:opacity-80 focus:bg-[#243447] ${busy || !asset ? 'opacity-40' : ''}`}>
                        {uploading && <ActivityIndicator color={THEME.primaryForeground} accessible={false} />}
                        <Text className="shrink text-center font-geist-semibold text-base text-primary-foreground">{uploading ? 'Uploading and extracting…' : uploadedId ? 'Opening preview…' : 'Upload module'}</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
