import { supabase } from '../lib/supabase';

export const profileService = {
    async getMyProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Assuming the 'collaborators' table has a 'user_id' column linked to auth.users
        // OR we match by email if user_id is not set (legacy/migration case)
        // For this implementation, we try matching by user_id first, then email.


        // Attempt 1: Match by user_id
        console.log('[ProfileService] Searching for profile with user_id:', user.id);
        let { data, error } = await supabase
            .from('collaborators')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error || !data) {
            console.warn('[ProfileService] user_id match failed or empty. Trying email fallback:', user.email);

            // Attempt 2: Match by email (Fallback for legacy/manual inserts)
            const { data: dataByEmail, error: errorByEmail } = await supabase
                .from('collaborators')
                .select('*')
                .eq('email', user.email)
                .single();

            if (errorByEmail) {
                console.error('[ProfileService] Profile not found by ID or Email.', errorByEmail);
                throw errorByEmail;
            }

            data = dataByEmail;
            console.log('[ProfileService] Profile found via EMAIL:', data.id);
        } else {
            console.log('[ProfileService] Profile found via USER_ID:', data.id);
        }

        return data;
    },

    async updateAvatar(url: string) {
        const profile = await this.getMyProfile();
        if (!profile) throw new Error('Perfil não encontrado');

        const { error } = await supabase
            .from('collaborators')
            .update({ avatar_url: url })
            .eq('id', profile.id);

        if (error) throw error;
    }
};
