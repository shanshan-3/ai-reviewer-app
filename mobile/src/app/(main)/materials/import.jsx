import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import * as DocumentPicker from 'expo-document-picker';
import AuthButton from '@/components/AuthButton';
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
            <MaterialScreenHeader title="Upload material" />
            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text accessibilityRole="header" className="font-geist-semibold text-2xl text-foreground">Add your study material</Text>
                <Text className="mt-2 font-geist text-sm leading-6 text-foreground/70">Choose a text-based PDF or DOCX. Maximum size: 5 MiB.</Text>
                <AuthButton submitLabel={picking ? 'Opening files…' : 'Choose file'} onSubmit={chooseFile} disabled={busy} />
                {asset && <>
                    <Text className="mt-6 font-geist-medium text-base text-foreground">{asset.name}</Text>
                    <Text className="mt-1 font-geist text-sm text-foreground/70">{(size / 1024 / 1024).toFixed(2)} MiB</Text>
                    <AuthButton submitLabel={uploading ? 'Uploading and extracting…' : 'Upload material'} onSubmit={handleUpload} disabled={busy} />
                </>}
                {uploading && <ActivityIndicator className="mt-4" color={THEME.primary} accessibilityLabel="Uploading and extracting" />}
                {uploading && takingLong && <AuthMessage message="Your module is still processing. Larger or complex documents may take longer. Please keep this screen open." />}
                <AuthMessage message={message} isError />
            </ScrollView>
        </SafeAreaView>
    );
}
