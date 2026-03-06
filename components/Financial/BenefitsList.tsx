import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Benefit {
    id: string;
    name: string;
    category: string;
    value: number;
}

interface BenefitsListProps {
    benefits: Benefit[];
}

const getIconName = (category: string) => {
    switch (category) {
        case 'HEALTH': return 'heart-outline';
        case 'TRANSPORT': return 'bus-outline';
        case 'MEAL': return 'restaurant-outline';
        default: return 'gift-outline';
    }
}

const getIconColor = (category: string) => {
    switch (category) {
        case 'HEALTH': return '#e11d48'; // rose-600
        case 'TRANSPORT': return '#2563eb'; // blue-600
        case 'MEAL': return '#d97706'; // amber-600
        default: return '#64748b'; // slate-500
    }
}

export const BenefitsList = ({ benefits }: BenefitsListProps) => {
    return (
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="font-bold text-gray-800 text-lg mb-4">Meus Benefícios</Text>

            {benefits.length === 0 ? (
                <Text className="text-gray-400 text-center py-4">Nenhum benefício ativo.</Text>
            ) : (
                <View className="space-y-4">
                    {benefits.map(benefit => (
                        <View key={benefit.id} className="flex-row items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <View className="flex-row items-center space-x-3">
                                <View className="p-2 rounded-lg bg-gray-50">
                                    <Ionicons
                                        name={getIconName(benefit.category) as any}
                                        size={20}
                                        color={getIconColor(benefit.category)}
                                    />
                                </View>
                                <View>
                                    <Text className="font-medium text-gray-700">{benefit.name}</Text>
                                    <Text className="text-xs text-gray-400">{benefit.category}</Text>
                                </View>
                            </View>
                            <Text className="text-sm font-semibold text-gray-600">
                                {benefit.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};
