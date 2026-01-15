import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { leaveService } from '../../../services/leaves';
import { profileService } from '../../../services/profile';

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
    // State now stores DD/MM/YYYY for display
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    // Helper to mask date input
    const handleDateChange = (text: string, setter: (val: string) => void) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length > 2) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        }
        if (cleaned.length > 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        }
        setter(formatted);
    };

    // Helper to convert DD/MM/YYYY to YYYY-MM-DD for Database
    const convertToISO = (dateStr: string) => {
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    };

    const handleSubmit = async () => {
        if (!startDate || !endDate) {
            Alert.alert('Erro', 'Preencha as datas.');
            return;
        }

        const isoStart = convertToISO(startDate);
        const isoEnd = convertToISO(endDate);

        if (!isoStart || !isoEnd || startDate.length !== 10 || endDate.length !== 10) {
            Alert.alert('Erro', 'Datas inválidas. Use o formato DD/MM/AAAA.');
            return;
        }

        const start = new Date(isoStart + 'T00:00:00');
        const end = new Date(isoEnd + 'T00:00:00');

        // Calculate difference including start day
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (end < start) {
            Alert.alert('Erro', 'Data final deve ser posterior à data inicial.');
            return;
        }

        setLoading(true);
        try {
            const profile = await profileService.getMyProfile();
            await leaveService.createRequest({
                collaborator_id: profile.id,
                type: type as any,
                start_date: isoStart,
                end_date: isoEnd,
                days_count: diffDays,
                reason,
                status: 'PENDING'
            });

            Alert.alert('Sucesso', 'Solicitação enviada!');
            router.back();
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao enviar solicitação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>

            <Text className="text-sm font-bold text-gray-400 uppercase mb-2">Tipo de Solicitação</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
                {TYPES.map(t => (
                    <TouchableOpacity
                        key={t.id}
                        onPress={() => setType(t.id)}
                        className={`px-4 py-3 rounded-xl border flex-row items-center gap-2 ${type === t.id ? `bg-white border-indigo-500 shadow-sm` : 'bg-gray-100 border-transparent'}`}
                    >
                        <Ionicons name={t.icon as any} size={16} color={type === t.id ? '#4f46e5' : '#9ca3af'} />
                        <Text className={`font-bold ${type === t.id ? 'text-indigo-600' : 'text-gray-500'}`}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

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
                    <Text className="text-xs text-gray-500 mb-1">Fim (DD/MM/AAAA)</Text>
                    <TextInput
                        className="bg-white p-3 rounded-xl border border-gray-200 font-bold text-gray-800"
                        value={endDate}
                        onChangeText={(text) => handleDateChange(text, setEndDate)}
                        placeholder="15/01/2024"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                </View>
            </View>

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
