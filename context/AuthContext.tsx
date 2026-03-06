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
        // 2. Listen for kicks - SIMPLIFIED FILTER
        // Filter string 'user_id=eq.UUID' can be tricky with RLS. 
        // We listen to ALL updates we can see and filter in client.
        const channel = supabase.channel(`session_guard_${currentSession.user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_active_sessions',
                    // Removing strict filter string to debug/ensure delivery
                    // If RLS works, we only see our own rows anyway.
                },
                (payload: any) => {
                    // Double check if this update belongs to us
                    if (payload.new.user_id !== currentSession.user.id) return;

                    const remoteSessionId = payload.new.session_id;
                    const mySessionId = currentSession.access_token;

                    // console.log("Session Guard Event:", remoteSessionId, mySessionId); 

                    if (remoteSessionId && remoteSessionId !== mySessionId) {
                        console.warn("Mobile Session invalidated by:", payload.new.device_info);
                        const Alert = require('react-native').Alert;
                        Alert.alert("Aviso de Segurança", `Sua conta foi conectada em outro dispositivo (${payload.new.device_info}). Esta sessão será encerrada.`);
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
