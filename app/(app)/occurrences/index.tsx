import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { occurrenceService, Occurrence } from '../../../services/occurrences';
import { profileService } from '../../../services/profile';

const TYPE_CONFIG: any = {
    'ADVERTENCIA_VERBAL': { label: 'Adv. Verbal', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'ADVERTENCIA_ESCRITA': { label: 'Adv. Escrita', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    'SUSPENSAO': { label: 'Suspensão', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    'MERITO': { label: 'Mérito', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    'FEEDBACK': { label: 'Feedback', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    'OUTROS': { label: 'Outros', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
};

export default function OccurrencesScreen() {
    const [loading, setLoading] = useState(true);
    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const profile = await profileService.getMyProfile();
            const data = await occurrenceService.getMyOccurrences(profile.id);
            setOccurrences(data);
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

    const renderItem = ({ item }: { item: Occurrence }) => {
        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG['OUTROS'];

        return (
            <View className={`bg-white p-0 rounded-xl border mb-3 shadow-sm overflow-hidden ${config.border}`}>
                <View className={`px-4 py-2 border-b flex-row justify-between items-center ${config.bg} ${config.border}`}>
                    <Text className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
                        {config.label}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                        {new Date(item.date_event).toLocaleDateString()}
                    </Text>
                </View>

                <View className="p-4">
                    <Text className="font-bold text-gray-900 text-lg mb-1">{item.title}</Text>
                    <Text className="text-gray-600 text-sm leading-relaxed">{item.description}</Text>

                    {item.severity_level > 0 && item.type !== 'MERITO' && (
                        <View className="mt-3 flex-row items-center gap-2">
                            <Text className="text-xs text-gray-400 font-bold uppercase">Gravidade</Text>
                            <View className="flex-row gap-1">
                                {[1, 2, 3, 4, 5].map(lvl => (
                                    <View
                                        key={lvl}
                                        className={`w-1.5 h-4 rounded-sm ${lvl <= item.severity_level ? 'bg-orange-400' : 'bg-gray-100'}`}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <FlatList
                data={occurrences}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center py-10">
                            <Ionicons name="happy-outline" size={48} color="#d1d5db" />
                            <Text className="text-gray-400 mt-2">Sem registros no prontuário.</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}
