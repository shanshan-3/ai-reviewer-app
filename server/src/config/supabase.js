import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient(accessToken) {
    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publishableKey) {
        throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.");
    }

    if (typeof accessToken !== "string" || !accessToken.trim()) {
        throw new Error("A user access token is required.");
    }

    return createClient(url, publishableKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            headers: { Authorization: `Bearer ${accessToken}` },
        },
    });
}
