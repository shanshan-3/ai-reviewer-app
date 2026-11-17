import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const AVATAR_KEY_PREFIX = '@candidate_avatar_uri:';

function getStorageKey(userId) {
    return `${AVATAR_KEY_PREFIX}${userId || 'default'}`;
}

export async function getLocalAvatarUri(userId) {
    try {
        const key = getStorageKey(userId);
        const uri = await AsyncStorage.getItem(key);
        if (!uri) return null;

        const info = await FileSystem.getInfoAsync(uri).catch(() => ({ exists: false }));
        if (!info.exists) {
            await AsyncStorage.removeItem(key);
            return null;
        }
        return uri;
    } catch {
        return null;
    }
}

export async function pickAndSaveAvatar(userId) {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['image/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return null;
        }

        const asset = result.assets[0];
        const key = getStorageKey(userId);

        // Remove old avatar file if present
        const oldUri = await AsyncStorage.getItem(key).catch(() => null);
        if (oldUri) {
            await FileSystem.deleteAsync(oldUri, { idempotent: true }).catch(() => null);
        }

        // Cache-busting timestamped filename
        const ext = asset.name?.split('.').pop()?.toLowerCase() || 'jpg';
        const filename = `avatar_${userId || 'current'}_${Date.now()}.${ext}`;
        const destUri = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.copyAsync({
            from: asset.uri,
            to: destUri,
        });

        await AsyncStorage.setItem(key, destUri);
        return destUri;
    } catch (error) {
        throw new Error(error.message || 'Could not save the selected image.');
    }
}

export async function removeLocalAvatar(userId) {
    try {
        const key = getStorageKey(userId);
        const oldUri = await AsyncStorage.getItem(key).catch(() => null);
        if (oldUri) {
            await FileSystem.deleteAsync(oldUri, { idempotent: true }).catch(() => null);
        }
        await AsyncStorage.removeItem(key);
        return null;
    } catch {
        return null;
    }
}
