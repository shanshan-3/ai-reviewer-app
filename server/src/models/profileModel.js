export async function getOwnProfile(supabase, userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}