import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';

interface SalaryCardProps {
    grossSalary: number;
    netSalary: number;
    discounts: number;
}

export const SalaryCard = ({ grossSalary, netSalary, discounts }: SalaryCardProps) => {
    return (
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center space-x-2">
                    <View className="bg-indigo-100 p-2 rounded-full">
                        <Ionicons name="wallet-outline" size={20} color="#4f46e5" />
                    </View>
                    <Text className="font-bold text-gray-800 text-lg">Resumo Mensal</Text>
                </View>
                <Text className="text-xs text-gray-400">Referência: Nov/2026</Text>
            </View>

            <View className="flex-row">
                {/* Gross */}
                <View className="flex-1 border-r border-gray-100 pr-4">
                    <Text className="text-xs text-gray-400 uppercase font-bold mb-1">Salário Bruto</Text>
                    <Text className="text-base font-semibold text-gray-700">
                        {grossSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                </View>

                {/* Net */}
                <View className="flex-1 pl-4">
                    <Text className="text-xs text-emerald-600 uppercase font-bold mb-1">Líquido Estimado</Text>
                    <Text className="text-xl font-bold text-emerald-600">
                        {netSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                </View>
            </View>

            {/* Discount Summary */}
            <View className="mt-4 pt-3 border-t border-gray-50 flex-row justify-between items-center">
                <Text className="text-xs text-gray-500">Total de Descontos (INSS/IRRF + Benefícios)</Text>
                <Text className="text-xs font-medium text-rose-500">
                    - {discounts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
            </View>
        </View>
    );
};
