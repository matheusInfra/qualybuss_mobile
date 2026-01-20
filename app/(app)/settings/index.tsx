import { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Animated as RNAnimated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const TABS = [
    { id: 'profile', icon: 'person-outline', label: 'Perfil' },
    { id: 'security', icon: 'shield-checkmark-outline', label: 'Segurança' },
    { id: 'notifications', icon: 'notifications-outline', label: 'Notificações' },
    { id: 'appearance', icon: 'color-palette-outline', label: 'Aparência' },
];

export default function SettingsScreen() {
    const [activeTab, setActiveTab] = useState('security');
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(compatible && enrolled);

        if (compatible) {
            const status = await AsyncStorage.getItem('biometricsEnabled');
            setBiometricsEnabled(status === 'true');
        }
    };

    const toggleBiometrics = async (value: boolean) => {
        setBiometricsEnabled(value);
        await AsyncStorage.setItem('biometricsEnabled', value.toString());
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'security':
                return (
                    <Animated.View entering={FadeInRight.springify()} className="flex-1 p-6">
                        <Text className="text-2xl font-bold text-gray-800 mb-6">Segurança</Text>

                        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-800">Login Biométrico</Text>
                                    <Text className="text-gray-500 text-sm mt-1">
                                        Use FaceID ou TouchID para entrar
                                    </Text>
                                </View>
                                {isBiometricSupported ? (
                                    <Switch
                                        value={biometricsEnabled}
                                        onValueChange={toggleBiometrics}
                                        trackColor={{ false: '#d1d5db', true: '#818cf8' }}
                                        thumbColor={biometricsEnabled ? '#4f46e5' : '#f4f3f4'}
                                    />
                                ) : (
                                    <Text className="text-xs text-red-500">Não disponível</Text>
                                )}
                            </View>
                        </View>

                        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <Text className="text-base font-semibold text-gray-800 mb-2">Senha</Text>
                            <TouchableOpacity className="py-2">
                                <Text className="text-indigo-600 font-medium">Alterar senha</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                );
            case 'profile':
                return (
                    <Animated.View entering={FadeInRight.springify()} className="flex-1 p-6">
                        <Text className="text-2xl font-bold text-gray-800 mb-6">Perfil</Text>
                        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center py-8">
                            <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-4">
                                <Ionicons name="person" size={40} color="#4f46e5" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">Usuário QualyBuss</Text>
                            <Text className="text-gray-500">usuario@qualybuss.com</Text>
                        </View>
                    </Animated.View>
                );
            default:
                return (
                    <Animated.View entering={FadeInRight.springify()} className="flex-1 p-6 justify-center items-center">
                        <Ionicons name="construct-outline" size={48} color="#9ca3af" />
                        <Text className="text-gray-400 mt-4 text-center">Configurações de {TABS.find(t => t.id === activeTab)?.label} em breve</Text>
                    </Animated.View>
                );
        }
    };

    return (
        <View className="flex-1 flex-row bg-gray-50">
            {/* Vertical Tabs Sidebar */}
            <View className="w-20 bg-white border-r border-gray-200 py-6 items-center flex-col space-y-8 shadow-sm z-10">
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id)}
                        className={`items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${activeTab === tab.id ? 'bg-indigo-50' : 'bg-transparent'
                            }`}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={24}
                            color={activeTab === tab.id ? '#4f46e5' : '#9ca3af'}
                        />
                        {activeTab === tab.id && (
                            <View className="absolute -right-4 w-1 h-6 bg-indigo-600 rounded-l-full" />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content Area */}
            <View style={{ width: width - 80 }} className="flex-1">
                {renderContent()}
            </View>
        </View>
    );
}
