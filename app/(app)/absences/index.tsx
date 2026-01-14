import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { profileService } from '../../../services/profile';
import { leaveService } from '../../../services/leaves';

export default function AbsencesScreen() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [timeInHouse, setTimeInHouse] = useState('');
    const [balance, setBalance] = useState({ available: 0, total: 30 }); // Default 30 days logic for now

    const calculateTimeInHouse = (dateString: string) => {
        if (!dateString) return 'Data não disponível';

        const admission = new Date(dateString);
        const now = new Date();

        let years = now.getFullYear() - admission.getFullYear();
        let months = now.getMonth() - admission.getMonth();

        if (months < 0 || (months === 0 && now.getDate() < admission.getDate())) {
            years--;
            months += 12;
        }

        return `${years} anos e ${months} meses`;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const p = await profileService.getMyProfile();
            setProfile(p);

            if (p?.admission_date) {
                setTimeInHouse(calculateTimeInHouse(p.admission_date));
            }

            // Future: Get real balance from database logic
            // For now, we simulate based on "leaves taken" if complex logic isn't in backend yet
            const requests = await leaveService.getMyRequests(p.id);
            const daysTaken = requests
                .filter((r: any) => r.type === 'FERIAS' && r.status === 'APPROVED')
                .reduce((acc: number, curr: any) => acc + curr.days_count, 0);

            setBalance({
                total: 30, // Default CLT
                available: 30 - daysTaken
            });

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
            className="flex-1 bg-gray-50 p-4"
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        >
            {/* Time in House Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
                <View className="flex-row items-center gap-3 mb-2">
                    <View className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center">
                        <Ionicons name="business-outline" size={20} color="#4f46e5" />
                    </View>
                    <Text className="text-gray-500 font-bold uppercase text-xs tracking-wider">Tempo de Casa</Text>
                </View>
                <Text className="text-3xl font-bold text-gray-900">{timeInHouse || '---'}</Text>
                <Text className="text-gray-400 text-xs mt-1">
                    Admissão: {profile?.admission_date ? new Date(profile.admission_date).toLocaleDateString() : '-'}
                </Text>
            </View>

            {/* Vacation Balance */}
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center">
                        <Ionicons name="sunny-outline" size={20} color="#059669" />
                    </View>
                    <Text className="text-gray-500 font-bold uppercase text-xs tracking-wider">Saldo de Férias</Text>
                </View>

                <View className="flex-row items-end gap-1 mb-2">
                    <Text className="text-4xl font-bold text-gray-900">{balance.available}</Text>
                    <Text className="text-gray-500 text-lg mb-1.5">/ {balance.total} dias</Text>
                </View>

                <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(balance.available / balance.total) * 100}%` }}
                    />
                </View>
                <Text className="text-gray-400 text-xs mt-2 text-right">Período Aquisitivo Vigente</Text>
            </View>

            <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex-row gap-3">
                <Ionicons name="information-circle" size={24} color="#2563eb" />
                <Text className="text-blue-800 flex-1 text-sm leading-5">
                    O saldo de férias é calculado com base nos períodos aquisitivos e dias já gozados. Em caso de dúvidas, consulte o RH.
                </Text>
            </View>

        </ScrollView>
    );
}
