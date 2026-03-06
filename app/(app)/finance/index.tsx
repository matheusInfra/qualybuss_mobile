import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { payrollService } from '../../../services/payrollService';
import { SalaryCard } from '../../../components/Financial/SalaryCard';
import { BenefitsList } from '../../../components/Financial/BenefitsList';

export default function FinanceScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [salaryData, setSalaryData] = useState<{
        gross: number;
        net: number;
        discounts: number;
        benefits: any[];
    }>({
        gross: 0,
        net: 0,
        discounts: 0,
        benefits: []
    });

    const fetchData = async () => {
        try {
            // If user is not fully loaded yet
            if (!user?.id) return;

            // Integrity Fix: Pass Email for Fallback Lookup
            const data = await payrollService.getMySalaryData(user.id, user.email);

            setSalaryData({
                gross: data.gross,
                net: data.net,
                discounts: (data.inss + data.irrf + data.benefitsCost),
                benefits: data.benefits
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar os dados financeiros.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [user?.id]);

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ title: 'Meus Salários', headerShadowVisible: false }} />

            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header Info */}
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-gray-900">Olá, {user?.user_metadata?.full_name?.split(' ')[0] || 'Colaborador'}</Text>
                    <Text className="text-gray-500">Veja seu demonstrativo resumido.</Text>
                </View>

                {/* Cards */}
                <SalaryCard
                    grossSalary={salaryData.gross}
                    netSalary={salaryData.net}
                    discounts={salaryData.discounts}
                />

                <BenefitsList benefits={salaryData.benefits} />

                {/* Footer Disclaimer */}
                <Text className="text-center text-xs text-gray-400 mt-8">
                    * Valores calculados com base na folha atual. Para o holerite oficial, consulte o RH ou o PDF no portal.
                </Text>
            </ScrollView>
        </View>
    );
}
