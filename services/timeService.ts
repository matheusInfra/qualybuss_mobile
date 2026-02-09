import { supabase } from '../lib/supabase';

export interface TimeEntry {
  id: string;
  clock_in: string;
  type: 'ENTRY' | 'BREAK_START' | 'BREAK_END' | 'EXIT';
  status: 'VALID' | 'FLAGGED' | 'ADJUSTED';
  day_date?: string;
  is_mocked?: boolean;
}

export const timeService = {
  /**
   * Registers a time entry (Clock-in/out)
   */
  async clockIn({
    type,
    location,
    deviceInfo
  }: {
    type: string;
    location: any;
    deviceInfo: any;
  }) {
    const { data, error } = await supabase.from('time_entries').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      type,
      location,
      device_info: deviceInfo,
      clock_in: new Date().toISOString(),
      status: location?.is_mocked ? 'FLAGGED' : 'VALID'
    }).select().single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches user history for a period using the optimized RPC
   */
  async getHistory(startDate: Date, endDate: Date) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('get_user_time_history', {
      p_user_id: user.user.id,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });

    if (error) throw error;
    return data as TimeEntry[];
  }
};
