import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface CollaboratorDocument {
    id: string;
    name: string;
    url: string;
    category: string;
    created_at: string;
    competence_month?: number;
    competence_year?: number;
    signed_at?: string;
    signature_url?: string;
}

export const documentService = {
    // 1. Get My Documents (Holerites, Contracts, etc.)
    async getMyDocuments(filters?: { month?: number; year?: number; category?: string }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Get Collaborator ID from Profile
        const { data: collaborator, error: profileError } = await supabase
            .from('collaborators')
            .select('id')
            .eq('user_id', user.id)
            .single();
        
        if (profileError || !collaborator) {
            console.error('Collaborator profile not found');
            return [];
        }

        let query = supabase
            .from('collaborator_documents')
            .select('*')
            .eq('collaborator_id', collaborator.id) // Correct ID usage
            .order('created_at', { ascending: false });

        if (filters?.category) {
            query = query.eq('category', filters.category);
        } else {
            // Default: specific categories or filtering logic if needed
            // For now, fetch all. System logic usually tags Holerites as 'Holerite'
        }

        if (filters?.year) {
            query = query.eq('competence_year', filters.year);
        }
        if (filters?.month) {
            query = query.eq('competence_month', filters.month);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as CollaboratorDocument[];
    },

    // 2. Upload Document (For Leave Requests / Occurrences)
    async uploadDocument(fileUri: string, fileName: string, fileType: string, folder: string = 'requests') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Resolve Collaborator ID
        const { data: collaborator } = await supabase
            .from('collaborators')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!collaborator) throw new Error('Profile not found');

        try {
            // Read file as Base64
            const base64 = await FileSystem.readAsStringAsync(fileUri, {
                encoding: 'base64',
            });

            // Generate unique path: collaborator_id/timestamp_filename
            const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
            const filePath = `${collaborator.id}/${Date.now()}_${cleanName}`;

            const { data, error } = await supabase.storage
                .from('documentos_pessoais') // Ensure this bucket exists
                .upload(filePath, decode(base64), {
                    contentType: fileType,
                    upsert: false
                });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documentos_pessoais')
                .getPublicUrl(filePath);

            const { data: recordData, error: dbError } = await supabase
                .from('collaborator_documents')
                .insert([
                    {
                        collaborator_id: collaborator.id, // Correct ID
                        name: fileName,
                        url: publicUrl,
                        category: folder === 'requests' ? 'Atestado' : 'Outros',
                        size_bytes: 0,
                        type: fileType,
                    }
                ])
                .select()
                .single();

            if (dbError) throw dbError;

            return publicUrl;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    },
    // 3. Sign Document (Upload Signature & Update Record)
    async signDocument(documentId: string, signatureBase64: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Resolve Collaborator ID (Optional context check, but strict ID match is safer)
        const { data: collaborator } = await supabase
            .from('collaborators')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!collaborator) throw new Error('Profile not found');

        try {
            // 1. Upload Signature Image
            // Ensure no data:image/png;base64 prefix
            const cleanBase64 = signatureBase64.replace('data:image/png;base64,', '');
            const filePath = `${collaborator.id}/signature_${documentId}_${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('documentos_pessoais')
                .upload(filePath, decode(cleanBase64), {
                    contentType: 'image/png',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documentos_pessoais')
                .getPublicUrl(filePath);

            // 3. Update Document Record
            const { error: updateError } = await supabase
                .from('collaborator_documents')
                .update({
                    signed_at: new Date().toISOString(),
                    signature_url: publicUrl,
                    // Optional: signed_ip, signed_device_info if passed
                })
                .eq('id', documentId)
                .eq('collaborator_id', collaborator.id); // Security check

            if (updateError) throw updateError;

            return true;
        } catch (error) {
            console.error('Signature failed:', error);
            throw error;
        }
    }
};
