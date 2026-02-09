import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import { timeService, TimeEntry } from '../../../services/timeService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device'; // You might need to install expo-device, or use basic Platform info

// Simple Tab Component
const Tabs = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (t: string) => void }) => (
    <View style={styles.tabContainer}>
        <TouchableOpacity
            style={[styles.tabButton, activeTab === 'register' && styles.activeTab]}
            onPress={() => onTabChange('register')}
        >
            <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>Registrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
            onPress={() => onTabChange('history')}
        >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Histórico</Text>
        </TouchableOpacity>
    </View>
);

export default function PontoScreen() {
    const [activeTab, setActiveTab] = useState('register');
    const queryClient = useQueryClient();
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'denied'>('loading');

    // Check Hardware
    useEffect(() => {
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricSupported(compatible);

            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationStatus(status === 'granted' ? 'ready' : 'denied');
        })();
    }, []);

    // --- REGISTER TAB LOGIC ---
    const clockInMutation = useMutation({
        mutationFn: async (type: string) => {
            // 1. Biometric Auth
            if (isBiometricSupported) {
                const authResult = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Confirme sua identidade para registrar o ponto',
                    fallbackLabel: 'Usar Senha'
                });
                if (!authResult.success) throw new Error('Falha na autenticação biométrica.');
            }

            // 2. Get Location
            if (locationStatus !== 'ready') throw new Error('Permissão de localização necessária.');
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

            // 3. Device Info (Mocked for now as expo-device needs install, or simple Platform)
            const deviceInfo = {
                os: 'mobile', // logic to detect OS
                biometric_method: 'biometrics',
                device_id: 'device-id-placeholder'
            };

            // 4. Send
            return await timeService.clockIn({
                type,
                location: {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                    is_mocked: location.mocked
                },
                deviceInfo
            });
        },
        onSuccess: () => {
            Alert.alert('Sucesso', 'Ponto registrado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['timeHistory'] });
            setActiveTab('history');
        },
        onError: (err: Error) => {
            Alert.alert('Erro', err.message);
        }
    });

    // --- HISTORY TAB LOGIC ---
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1); // 1st of month
    const currentMonthEnd = new Date();

    const { data: history = [], isLoading, refetch } = useQuery({
        queryKey: ['timeHistory'],
        queryFn: () => timeService.getHistory(currentMonthStart, currentMonthEnd),
        enabled: activeTab === 'history'
    });

    // --- RENDER ---
    return (
        <View style={styles.container}>
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'register' ? (
                <View style={styles.content}>
                    <View style={styles.headerCard}>
                        <Text style={styles.timeLabel}>Horário de Brasília</Text>
                        <Text style={styles.bigClock}>
                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.dateLabel}>
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Text>

                        <View style={styles.statusRow}>
                            <View style={styles.badge}>
                                <Ionicons name={locationStatus === 'ready' ? "location" : "location-outline"} size={14} color="#059669" />
                                <Text style={styles.badgeText}>{locationStatus === 'ready' ? 'GPS Preciso' : 'GPS Pendente'}</Text>
                            </View>
                            <View style={styles.badge}>
                                <Ionicons name="finger-print" size={14} color="#4f46e5" />
                                <Text style={styles.badgeText}>Biometria</Text>
                            </View>
                        </View>
                    </View>

                    {/* SMART ACTION CONTAINER */}
                    <SmartAction
                        onClockIn={(type) => clockInMutation.mutate(type)}
                        isLoading={clockInMutation.isPending}
                        todayEntries={history.filter((h: TimeEntry) => {
                            const d = new Date(h.clock_in);
                            const t = new Date();
                            return d.getDate() === t.getDate() && d.getMonth() === t.getMonth();
                        })}
                    />
                </View>
            ) : (
                <ScrollView
                    style={styles.historyList}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                >
                    <Text style={styles.sectionTitle}>Este Mês</Text>
                    {history.map((item: TimeEntry) => (
                        <View key={item.id} style={styles.historyItem}>
                            <View>
                                <Text style={styles.historyDate}>
                                    {new Date(item.clock_in).toLocaleDateString('pt-BR')}
                                </Text>
                                <Text style={styles.historyTime}>
                                    {new Date(item.clock_in).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            <View style={styles.historyRight}>
                                <View style={[
                                    styles.typeBadge,
                                    item.type === 'ENTRY' ? styles.bgGreen : styles.bgRed
                                ]}>
                                    <Text style={styles.typeText}>
                                        {item.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'}
                                    </Text>
                                </View>
                                {item.is_mocked && <Text style={styles.mockWarning}>Fake GPS</Text>}
                            </View>
                        </View>
                    ))}
                    {history.length === 0 && !isLoading && (
                        <Text style={styles.emptyText}>Nenhum registro este mês.</Text>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const SmartAction = ({ onClockIn, isLoading, todayEntries }: { onClockIn: (t: string) => void, isLoading: boolean, todayEntries: TimeEntry[] }) => {
    // 1. Determine Suggestion
    const lastEntry = todayEntries.length > 0 ? todayEntries[0] : null; // Assumes DESC order from API

    let suggestedType = 'ENTRY';
    let label = 'ENTRADA';
    let subtext = 'Vamos começar o dia?';
    let iconName: any = 'log-in-outline';

    if (lastEntry) {
        if (lastEntry.type === 'ENTRY') {
            suggestedType = 'BREAK_START';
            label = 'SAÍDA ALMOÇO';
            subtext = 'Bom descanso!';
            iconName = 'cafe-outline';
        } else if (lastEntry.type === 'BREAK_START') {
            suggestedType = 'BREAK_END';
            label = 'VOLTA ALMOÇO';
            subtext = 'Bom retorno!';
            iconName = 'restaurant-outline';
        } else if (lastEntry.type === 'BREAK_END') {
            suggestedType = 'EXIT';
            label = 'SAÍDA END';
            subtext = 'Até amanhã!';
            iconName = 'log-out-outline';
        } else if (lastEntry.type === 'EXIT') {
            suggestedType = 'ENTRY';
            label = 'NOVA ENTRADA';
            subtext = 'Hora extra?';
            iconName = 'add-circle-outline';
        }
    }

    return (
        <View style={styles.actionContainer}>
            {/* MAIN SMART BUTTON */}
            <TouchableOpacity
                style={[styles.bigButton, { backgroundColor: getButtonColor(suggestedType) }]}
                onPress={() => onClockIn(suggestedType)}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" size="large" />
                ) : (
                    <>
                        <Ionicons name={iconName} size={48} color="#fff" />
                        <Text style={styles.bigButtonText}>{label}</Text>
                        <Text style={styles.bigButtonSubtext}>{subtext}</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* MANUAL OVERRIDES */}
            <Text style={styles.manualLabel}>Ou selecione manualmente:</Text>
            <View style={styles.manualRow}>
                <ManualBtn type="ENTRY" label="Entrada" icon="log-in" onPress={() => onClockIn('ENTRY')} disabled={isLoading} />
                <ManualBtn type="BREAK_START" label="Almoço" icon="cafe" onPress={() => onClockIn('BREAK_START')} disabled={isLoading} />
                <ManualBtn type="BREAK_END" label="Retorno" icon="restaurant" onPress={() => onClockIn('BREAK_END')} disabled={isLoading} />
                <ManualBtn type="EXIT" label="Saída" icon="log-out" onPress={() => onClockIn('EXIT')} disabled={isLoading} />
            </View>
        </View>
    );
};

const getButtonColor = (type: string) => {
    switch (type) {
        case 'ENTRY': return '#4f46e5'; // Indigo
        case 'BREAK_START': return '#f59e0b'; // Amber
        case 'BREAK_END': return '#10b981'; // Emerald
        case 'EXIT': return '#ef4444'; // Red
        default: return '#4f46e5';
    }
};

const ManualBtn = ({ type, label, icon, onPress, disabled }: any) => (
    <TouchableOpacity style={styles.manualBtn} onPress={onPress} disabled={disabled}>
        <View style={[styles.manualIcon, { backgroundColor: getButtonColor(type) }]}>
            <Ionicons name={icon as any} size={16} color="#fff" />
        </View>
        <Text style={styles.manualText}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
    tabButton: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#4f46e5' },
    tabText: { fontWeight: '600', color: '#6b7280' },
    activeTabText: { color: '#4f46e5' },

    headerCard: { alignItems: 'center', marginBottom: 20 }, // Reduced margin
    timeLabel: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 },
    bigClock: { fontSize: 40, fontWeight: 'bold', color: '#111827', marginVertical: 4 }, // Smaller clock
    dateLabel: { fontSize: 14, color: '#374151', textTransform: 'capitalize' },
    statusRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 10, color: '#059669', fontWeight: 'bold' },

    actionContainer: { width: '100%', alignItems: 'center', gap: 24 },
    bigButton: {
        width: 200, height: 200, borderRadius: 100, // Smaller button
        alignItems: 'center', justifyContent: 'center',
        elevation: 8, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 16,
    },
    bigButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginTop: 8 },
    bigButtonSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },

    manualLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
    manualRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
    manualBtn: { alignItems: 'center', gap: 4 },
    manualIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    manualText: { fontSize: 10, color: '#6b7280', fontWeight: '500' },

    historyList: { flex: 1, padding: 16 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase' },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1 },
    historyDate: { fontSize: 12, color: '#6b7280' },
    historyTime: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    historyRight: { alignItems: 'flex-end', gap: 4 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    bgGreen: { backgroundColor: '#d1fae5' },
    bgRed: { backgroundColor: '#fee2e2' },
    typeText: { fontSize: 10, fontWeight: 'bold', color: '#1f2937' },
    mockWarning: { fontSize: 10, color: 'red', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 40 }
});
