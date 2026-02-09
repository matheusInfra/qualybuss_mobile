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
    size_bytes?: number;
    type?: string;
    collaborator_id: string;
}

export const documentService = {
    // 1. Get Documents (Unified)
    async getDocuments(filters?: { month?: number; year?: number; category?: string }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: collaborator } = await supabase
            .from('collaborators')
            .select('id')
            .eq('user_id', user.id)
            .single();
        
        if (!collaborator) return [];

        let query = supabase
            .from('collaborator_documents')
            .select('*')
            .eq('collaborator_id', collaborator.id)
            .order('created_at', { ascending: false });

        if (filters?.category) query = query.eq('category', filters.category);
        if (filters?.year) query = query.eq('competence_year', filters.year);
        if (filters?.month) query = query.eq('competence_month', filters.month);

        const { data, error } = await query;
        if (error) throw error;
        
        return data as CollaboratorDocument[];
    },

    // 2. Upload Document (Unified Logic)
    async uploadDocument(fileUri: string, fileName: string, fileType: string, category: string = 'Outros') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: collaborator } = await supabase
            .from('collaborators')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!collaborator) throw new Error('Profile not found');

        // Logic matched with Desktop: Clean Filename & Path
        const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${collaborator.id}/${Date.now()}_${cleanName}`;
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });

        const { error: storageError } = await supabase.storage
            .from('documentos_pessoais')
            .upload(filePath, decode(base64), { contentType: fileType });

        if (storageError) throw storageError;

        const { data: { publicUrl } } = supabase.storage
            .from('documentos_pessoais')
            .getPublicUrl(filePath);

        const { data, error } = await supabase
            .from('collaborator_documents')
            .insert([{
                collaborator_id: collaborator.id,
                name: fileName,
                url: publicUrl,
                category,
                type: fileType,
                size_bytes: 0 // Expo FS could get size if needed
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 3. Sign Document (Updated with Location/IP placeholders for future Edge Function)
    async signDocument(documentId: string, signatureBase64: string, locationData?: any) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Verify ownership (Double check)
        const { data: collaborator } = await supabase
            .from('collaborators')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
        if (!collaborator) throw new Error('Profile not found');

        const cleanBase64 = signatureBase64.replace('data:image/png;base64,', '');
        const filePath = `${collaborator.id}/signature_${documentId}_${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
            .from('documentos_pessoais')
            .upload(filePath, decode(cleanBase64), { contentType: 'image/png' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('documentos_pessoais')
            .getPublicUrl(filePath);

        const { error } = await supabase
            .from('collaborator_documents')
            .update({
                signed_at: new Date().toISOString(),
                signature_url: publicUrl,
                signing_location: locationData,
                signing_ip: 'MOBILE_CLIENT' // Pending: Move to Edge Function
            })
            .eq('id', documentId)
            .eq('collaborator_id', collaborator.id);

        if (error) throw error;
        return true;
    }
};
