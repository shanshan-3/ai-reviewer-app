import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isRecoverySession } from '@/lib/recovery-session';

const initialState = {
    session: /** @type {import('@supabase/supabase-js').Session | null} */ (null),
    loading: true,
    isRecovery: false,
};

const SessionContext = createContext(initialState);

export default function SessionProvider({ children }) {
    const [state, setState] = useState(initialState);

    useEffect(() => {
        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((event, session) => {
                setState((previous) => ({
                    session,
                    loading: false,
                    isRecovery: Boolean(session) && (
                        event === 'PASSWORD_RECOVERY' ||
                        isRecoverySession(session) ||
                        previous.isRecovery
                    ),
                }));
            });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <SessionContext.Provider value={state}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}