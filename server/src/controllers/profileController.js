import { getProfile } from "../services/profileService.js";

export async function getOwnProfile(req, res) {
    try {
        const profile = await getProfile(req.supabase, req.user.id);
        return res.status(200).json(profile);
    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
}