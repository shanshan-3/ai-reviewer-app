import { fetch } from 'expo/fetch';
import { supabase } from '@/lib/supabase';

export async function getOwnProfile() {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
    if (!baseUrl) throw new Error('The server address is not configured.');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('Please sign in again.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(`${baseUrl}/api/profile`, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.session.access_token}`,
            },
        });
        if (!response.ok) return null;
        return response.json().catch(() => null);
    } finally {
        clearTimeout(timeout);
    }
}
