import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { supabase } from '@/lib/supabase';

const MIME_TYPES = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function validateSelectedFile(asset) {
    if (!asset || typeof asset.name !== 'string' || typeof asset.uri !== 'string') {
        throw new Error('This file cannot be read.');
    }
    const extension = asset.name.split('.').pop()?.toLowerCase();
    const mime = Object.hasOwn(MIME_TYPES, extension ?? '') ? MIME_TYPES[extension] : null;
    if (!mime) throw new Error('Choose a PDF or DOCX file.');
    const file = new File(asset.uri);
    const size = file.size;
    if (!file.exists || !Number.isFinite(size) || size <= 0) throw new Error('This file is empty or cannot be read.');
    if (size > 5242880) throw new Error('Maximum file size is 5 MiB.');
    return { file, mime, size };
}

async function request(path, options = {}) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
    if (!baseUrl) throw new Error('The server address is not configured.');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('Please sign in again.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
        const response = await fetch(`${baseUrl}${path}`, {
            ...options, signal: controller.signal,
            headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` },
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(response.status === 401 ? 'Please sign in again.'
                : typeof result?.error === 'string' ? result.error : 'The request failed. Try again later.');
        }
        if (!result) throw new Error('The server returned an unreadable response.');
        return result;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(path === '/api/materials' && options.method === 'POST'
                ? 'The upload timed out and may still have completed. Avoid immediately uploading the same file again.'
                : 'The request timed out. Reload to check whether your changes were saved.');
        }
        if (error instanceof TypeError) throw new Error('Could not reach the server. Check your connection.');
        throw error;
    } finally { clearTimeout(timeout); }
}

export async function uploadMaterial(asset) {
    const { file, mime } = validateSelectedFile(asset);
    const result = await request('/api/materials', {
        method: 'POST', headers: { 'Content-Type': mime, 'X-Filename': encodeURIComponent(asset.name) }, body: file,
    });
    if (typeof result.material?.id !== 'string') throw new Error('The server returned an unreadable response.');
    return result;
}

export async function getMaterial(id) {
    const result = await request(`/api/materials/${encodeURIComponent(id)}`);
    if (!result.material || !Array.isArray(result.material.warnings) || !Array.isArray(result.sections)) {
        throw new Error('The server returned an unreadable response.');
    }
    return result;
}

export async function getMaterialLabels() {
    const result = await request('/api/materials/labels');
    if (!Array.isArray(result.subjects) || !Array.isArray(result.topics)) throw new Error('The server returned unreadable labels.');
    return result;
}

export async function createMaterialLabel(kind, body) {
    if (!['subjects', 'topics'].includes(kind)) throw new Error('Invalid label type.');
    const result = await request(`/api/materials/labels/${kind}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (typeof result.label?.id !== 'string') throw new Error('The server returned an unreadable label.');
    return result.label;
}

export async function approveMaterial(id, review) {
    const result = await request(`/api/materials/${encodeURIComponent(id)}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review),
    });
    if (result.status !== 'ready') throw new Error('The server did not confirm approval. Reload the preview.');
}
