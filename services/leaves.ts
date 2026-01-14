import { supabase } from '../lib/supabase';

export type LeaveRequest = {
    id: string;
    collaborator_id: string;
    type: 'FERIAS' | 'FOLGA' | 'LICENCA' | 'FALTA' | 'ATESTADO';
    start_date: string;
    end_date: string;
    days_count: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    created_at: string;
};

export const leaveService = {
    async getMyRequests(collaboratorId: string) {
        const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('collaborator_id', collaboratorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as LeaveRequest[];
    },

    async createRequest(request: Partial<LeaveRequest>) {
        const { data, error } = await supabase
            .from('leave_requests')
            .insert([request])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getUpcomingStats(collaboratorId: string) {
        const today = new Date().toISOString().split('T')[0];

        // Fetch upcoming approved leaves
        const { data, error } = await supabase
            .from('leave_requests')
            .select('days_count, type, start_date')
            .eq('collaborator_id', collaboratorId)
            .eq('status', 'APPROVED')
            .gte('start_date', today)
            .order('start_date', { ascending: true });

        if (error) throw error;
        return data;
    }
};
