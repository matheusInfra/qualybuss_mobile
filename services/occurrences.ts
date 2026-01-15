import { supabase } from '../lib/supabase';

export type Occurrence = {
    id: string;
    type: string;
    title: string;
    description: string;
    date_event: string;
    severity_level: number;
    created_at: string;
};

export const occurrenceService = {
    async getMyOccurrences(collaboratorId: string) {
        const { data, error } = await supabase
            .from('occurrences')
            .select('*')
            .eq('collaborator_id', collaboratorId)
            // .eq('archived', false) // Removed: Column does not exist
            .order('date_event', { ascending: false });

        if (error) throw error;
        return data as Occurrence[];
    }
};
