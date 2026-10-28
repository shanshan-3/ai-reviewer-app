import { getOwnProfile } from "../models/profileModel.js";

export async function getProfile(supabase, userId) {
    const profile = await getOwnProfile(supabase, userId);

    if (!profile) {
        const error = new Error("Profile not found");
        error.status = 404;
        throw error;
    }

    return profile;
}