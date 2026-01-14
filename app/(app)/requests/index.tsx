import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { leaveService, LeaveRequest } from '../../services/leaves';
import { profileService } from '../../services/profile';

const STATUS_COLORS = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Reprovado',
    CANCELLED: 'Cancelado',
};

export default function RequestsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [collaboratorId, setCollaboratorId] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            let cId = collaboratorId;
            if (!cId) {
                const profile = await profileService.getMyProfile();
                cId = profile.id;
                setCollaboratorId(profile.id);
            }

            const data = await leaveService.getMyRequests(cId!);
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const renderItem = ({ item }: { item: LeaveRequest }) => (
        <View className="bg-white p-4 rounded-xl border border-gray-100 mb-3 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="font-bold text-gray-800 text-base">{item.type}</Text>
                    <Text className="text-gray-500 text-xs mt-1">
                        {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                    </Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${STATUS_COLORS[item.status].split(' ')[0]}`}>
                    <Text className={`text-xs font-bold ${STATUS_COLORS[item.status].split(' ')[1]}`}>
                        {STATUS_LABELS[item.status]}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-50">
                <Text className="text-gray-600 text-sm italic flex-1 mr-4" numberOfLines={1}>
                    {item.reason || 'Sem observação'}
                </Text>
                <Text className="text-gray-400 text-xs font-medium">
                    {item.days_count} dias
                </Text>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <FlatList
                data={requests}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center py-10">
                            <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
                            <Text className="text-gray-400 mt-2">Nenhuma solicitação encontrada.</Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity
                onPress={() => router.push('/(app)/requests/new')}
                className="absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}
