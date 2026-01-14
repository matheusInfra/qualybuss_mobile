import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profile';
import { leaveService } from '../../services/leaves';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const p = await profileService.getMyProfile();
            setProfile(p);

            const up = await leaveService.getUpcomingStats(p.id);
            setUpcoming(up || []);
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

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        >
            {/* Welcome Card */}
            <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-gray-500 text-sm">Olá,</Text>
                        <Text className="text-xl font-bold text-gray-900">{profile?.full_name || user?.email}</Text>
                    </View>
                    <View className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center">
                        <Text className="text-indigo-600 font-bold text-lg">
                            {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View className="flex-row gap-2">
                    <Text className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                        {profile?.role || 'Colaborador'}
                    </Text>
                    {profile?.department && (
                        <Text className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                            {profile.department}
                        </Text>
                    )}
                </View>
            </View>

            {/* Upcoming Stats */}
            <Text className="text-lg font-bold text-gray-800 mb-3">Próximos Eventos</Text>
            {upcoming.length > 0 ? (
                upcoming.map((item, idx) => (
                    <View key={idx} className="bg-white p-4 rounded-xl border border-gray-100 mb-3 flex-row items-center gap-4">
                        <View className={`w-12 h-12 rounded-full items-center justify-center ${item.type === 'FERIAS' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                            <Ionicons name={item.type === 'FERIAS' ? 'airplane' : 'calendar'} size={20} color={item.type === 'FERIAS' ? '#059669' : '#2563eb'} />
                        </View>
                        <View>
                            <Text className="font-bold text-gray-800">{item.type}</Text>
                            <Text className="text-gray-500 text-sm">Inicia em {new Date(item.start_date).toLocaleDateString()}</Text>
                        </View>
                    </View>
                ))
            ) : (
                <View className="bg-white p-6 rounded-xl border border-gray-100 mb-6 items-center border-dashed">
                    <Text className="text-gray-400">Nenhum evento programado.</Text>
                </View>
            )}

            {/* Quick Actions */}
            <Text className="text-lg font-bold text-gray-800 mb-3 mt-4">Acesso Rápido</Text>
            <View className="flex-row flex-wrap justify-between">
                <TouchableOpacity
                    onPress={() => router.push('/(app)/requests/new')}
                    className="w-[48%] bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 aspect-[1.1] justify-center items-center"
                >
                    <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mb-2">
                        <Ionicons name="add" size={24} color="#4f46e5" />
                    </View>
                    <Text className="font-bold text-gray-800">Nova Solicitação</Text>
                    <Text className="text-gray-400 text-xs text-center mt-1">Férias ou Falta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push('/(app)/requests')}
                    className="w-[48%] bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 aspect-[1.1] justify-center items-center"
                >
                    <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-2">
                        <Ionicons name="time" size={24} color="#ea580c" />
                    </View>
                    <Text className="font-bold text-gray-800">Histórico</Text>
                    <Text className="text-gray-400 text-xs text-center mt-1">Meus Pedidos</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
