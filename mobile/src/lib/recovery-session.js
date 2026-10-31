let recoveryUserId = /** @type {string | null} */ (null);

/** @param {import('@supabase/supabase-js').Session} session */
export function markRecoverySession(session) {
    recoveryUserId = session.user.id;
}

/** @param {import('@supabase/supabase-js').Session | null} session */
export function isRecoverySession(session) {
    return Boolean(recoveryUserId && session?.user?.id === recoveryUserId);
}

export function clearRecoverySession() {
    const hadRecovery = recoveryUserId !== null;
    recoveryUserId = null;
    return hadRecovery;
}
