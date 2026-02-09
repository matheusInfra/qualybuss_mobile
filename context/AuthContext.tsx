import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session on load
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.warn("Session error detected:", error.message);
            }
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session) registerSession(session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session) registerSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- Single Device Enforcement ---
    const registerSession = async (currentSession: Session) => {
        if (!currentSession?.user?.id) return;

        const sessionToken = currentSession.access_token;

        // 1. Register this session
        const { error } = await supabase
            .from('user_active_sessions')
            .upsert({
                user_id: currentSession.user.id,
                session_id: sessionToken,
                device_info: 'Mobile App',
                last_seen: new Date().toISOString()
            });

        if (error) console.error("Failed to register mobile session:", error);

        // 2. Listen for kicks
        const channel = supabase.channel(`session_guard_${currentSession.user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_active_sessions',
                    filter: `user_id=eq.${currentSession.user.id}`
                },
                (payload: any) => {
                    const remoteSessionId = payload.new.session_id;
                    if (remoteSessionId && remoteSessionId !== sessionToken) {
                        console.warn("Mobile Session invalidated.");
                        // Determine native Alert or web alert (since this is Expo)
                        // Ideally import { Alert } from 'react-native';
                        // For now we use console and signOut, assuming UI handles logout state
                        const Alert = require('react-native').Alert;
                        Alert.alert("Aviso de Segurança", "Você conectou em outro dispositivo. Esta sessão será encerrada.");
                        signOut();
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    };

    // Auto-logout logic based on App State (Background/Inactive)
    // Simplified for mobile: Check validity on becoming active?
    // For now, let's stick to standard session expiry behavior or keep simple.
    // The desktop had complex 15m inactivity timer. On mobile, this is trickier with backgrounding.
    // We'll omit the aggressive auto-logout for now to ensure usability, 
    // relying on Supabase token refresh logic.

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
