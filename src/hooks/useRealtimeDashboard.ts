import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function useRealtimeDashboard(userId: string | undefined, onUpdate: () => void) {
    useEffect(() => {
        if (!userId) return;

        console.log(`Subscribing to realtime updates for user ${userId}`);

        const channel = supabase.channel(`dashboard_user_${userId}`)
            // Listen for profile changes (Collaborators table)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'collaborators',
                    filter: `id=eq.${userId}`
                },
                (payload) => {
                    console.log('Profile updated realtime:', payload);
                    onUpdate();
                }
            )
            // Listen for Leave Request changes
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'leave_requests',
                    filter: `collaborator_id=eq.${userId}`
                },
                (payload) => {
                    console.log('Leaves updated realtime:', payload);
                    onUpdate();
                }
            )
            .subscribe();

        return () => {
            console.log('Unsubscribing from realtime updates');
            supabase.removeChannel(channel);
        };
    }, [userId, onUpdate]);
}
