import { createSupabaseClient } from '../config/supabase.js';

export default async function authMiddleware(req, res, next) {
    const match = req.get('Authorization')?.match(/^Bearer +(\S+)$/i);

    if (!match) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const accessToken = match[1];

    try {
        const supabase = createSupabaseClient(accessToken);
        const { data, error } = await supabase.auth.getUser(accessToken);

        if (error) {
            const invalidCredentials =
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 429;

            return res.status(invalidCredentials ? 401 : 503).json({
                error: invalidCredentials
                    ? 'Unauthorized'
                    : 'Authentication service unavailable',
            });
        }

        if (!data.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        req.user = data.user;
        req.supabase = supabase;
    } catch {
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    return next();
}