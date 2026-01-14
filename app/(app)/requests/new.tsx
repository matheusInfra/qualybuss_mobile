import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { leaveService } from '../../services/leaves';
import { profileService } from '../../services/profile';

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
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState('');

    const handleSubmit = async () => {
        if (!startDate || !endDate) {
            Alert.alert('Erro', 'Preencha as datas.');
            return;
        }

        // Basic date validation
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays <= 0) {
            Alert.alert('Erro', 'Data final deve ser posterior à data inicial.');
            return;
        }

        setLoading(true);
        try {
            const profile = await profileService.getMyProfile();
            await leaveService.createRequest({
                collaborator_id: profile.id,
                type: type as any,
                start_date: startDate,
                end_date: endDate,
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
                    <Text className="text-xs text-gray-500 mb-1">Início (AAAA-MM-DD)</Text>
                    <TextInput
                        className="bg-white p-3 rounded-xl border border-gray-200 font-bold text-gray-800"
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="2024-01-01"
                        keyboardType="numeric"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Fim (AAAA-MM-DD)</Text>
                    <TextInput
                        className="bg-white p-3 rounded-xl border border-gray-200 font-bold text-gray-800"
                        value={endDate}
                        onChangeText={setEndDate}
                        placeholder="2024-01-01"
                        keyboardType="numeric"
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
