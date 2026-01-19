import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { leaveService } from '../../../services/leaves';
import { profileService } from '../../../services/profile';
import { documentService } from '../../../services/documents';

const TYPES = [
    { id: 'FERIAS', label: 'Férias', icon: 'airplane', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'FOLGA', label: 'Folga', icon: 'happy', color: 'bg-blue-100 text-blue-700' },
    { id: 'FALTA', label: 'Falta', icon: 'alert-circle', color: 'bg-red-100 text-red-700' },
    { id: 'ATESTADO', label: 'Atestado', icon: 'medkit', color: 'bg-cyan-100 text-cyan-700' },
];

export default function NewRequestScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('FERIAS');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [attachment, setAttachment] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    // ... (existing date helpers)

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;
            setAttachment(result.assets[0]);
        } catch (err) {
            Alert.alert('Erro', 'Falha ao selecionar arquivo.');
        }
    };

    const handleSubmit = async () => {
        if (!startDate) { // endDate can be same as start
            Alert.alert('Erro', 'Preencha a data de início.');
            return;
        }

        // Strict requirement for ATESTADO
        if (type === 'ATESTADO' && !attachment) {
            Alert.alert('Obrigatório', 'Para Atestados, é necessário anexar um comprovante (Foto ou PDF).');
            return;
        }

        const isoStart = convertToISO(startDate);
        const isoEnd = endDate ? convertToISO(endDate) : isoStart; // Single day default

        if (!isoStart || !isoEnd) {
            Alert.alert('Erro', 'Datas inválidas.');
            return;
        }

        // ... (existing validation)

        const start = new Date(isoStart + 'T00:00:00');
        const end = new Date(isoEnd + 'T00:00:00');
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (end < start) {
            Alert.alert('Erro', 'Data final inválida.');
            return;
        }

        setLoading(true);
        try {
            let fileUrl = '';
            if (attachment) {
                fileUrl = await documentService.uploadDocument(
                    attachment.uri,
                    attachment.name,
                    attachment.mimeType || 'application/octet-stream',
                    'requests'
                );
            }

            const profile = await profileService.getMyProfile();
            const finalReason = fileUrl ? `${reason}\n\n[Anexo]: ${fileUrl}` : reason;

            await leaveService.createRequest({
                collaborator_id: profile.id,
                type: type as any,
                start_date: isoStart,
                end_date: isoEnd,
                days_count: diffDays,
                reason: finalReason,
                status: 'PENDING'
            });

            Alert.alert('Sucesso', 'Solicitação enviada!');
            router.back();
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao enviar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
            {/* ... (Type Selector) ... */}
            <Text className="text-sm font-bold text-gray-400 uppercase mb-2">Tipo de Solicitação</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
                {TYPES.map(t => (
                    <TouchableOpacity
                        key={t.id}
                        onPress={() => setType(t.id)}
                        className="px-4 py-3 rounded-xl border flex-row items-center gap-2"
                        style={{
                            backgroundColor: type === t.id ? '#ffffff' : '#f3f4f6',
                            borderColor: type === t.id ? '#4f46e5' : 'transparent',
                        }}
                    >
                        <Ionicons name={t.icon as any} size={16} color={type === t.id ? '#4f46e5' : '#9ca3af'} />
                        <Text className={`font-bold ${type === t.id ? 'text-indigo-600' : 'text-gray-500'}`}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Dates */}
            <Text className="text-sm font-bold text-gray-400 uppercase mb-2">Período</Text>
            <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Início (DD/MM/AAAA)</Text>
                    <TextInput
                        className="bg-white p-3 rounded-xl border border-gray-200 font-bold text-gray-800"
                        value={startDate}
                        onChangeText={(text) => handleDateChange(text, setStartDate)}
                        placeholder="01/01/2024"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Fim (Opcional se 1 dia)</Text>
                    <TextInput
                        className="bg-white p-3 rounded-xl border border-gray-200 font-bold text-gray-800"
                        value={endDate}
                        onChangeText={(text) => handleDateChange(text, setEndDate)}
                        placeholder="Ignorar se mesmo dia"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                </View>
            </View>

            {/* File Upload (Conditional) */}
            {['ATESTADO', 'LICENCA', 'FALTA'].includes(type) && (
                <View className="mb-6 animate-fade-in-up">
                    <Text className="text-sm font-bold text-gray-400 uppercase mb-2">Comprovante {type === 'ATESTADO' && '(Obrigatório)'}</Text>
                    <TouchableOpacity
                        onPress={pickDocument}
                        className={`border-2 border-dashed rounded-xl p-6 items-center justify-center ${attachment ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-300'}`}
                    >
                        {attachment ? (
                            <View className="items-center">
                                <Ionicons name="document-text" size={32} color="#4f46e5" />
                                <Text className="font-bold text-indigo-700 mt-2 text-center" numberOfLines={1}>
                                    {attachment.name}
                                </Text>
                                <Text className="text-xs text-indigo-400">Clique para alterar</Text>
                            </View>
                        ) : (
                            <View className="items-center">
                                <Ionicons name="cloud-upload-outline" size={32} color="#9ca3af" />
                                <Text className="font-bold text-gray-500 mt-2">Toque para selecionar arquivo (PDF/Foto)</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <Text className="text-sm font-bold text-gray-400 uppercase mb-2">Motivo / Observação</Text>
            <TextInput
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800 mb-8 min-h-[100px]"
                value={reason}
                onChangeText={setReason}
                placeholder="Descreva o motivo..."
                multiline
                textAlignVertical="top"
            />

            <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className={`w-full py-4 rounded-xl flex-row justify-center items-center shadow-lg mb-10 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text className="text-white font-bold text-lg">Enviar Solicitação</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}
