import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';

const TERMS_VERSION = '1.0';

export function TermsGuard({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkTerms();
    }, []);

    const checkTerms = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setChecking(false);
                return;
            }

            const { data, error } = await supabase
                .from('user_term_acceptances')
                .select('*')
                .eq('user_id', user.id)
                .eq('term_version', TERMS_VERSION)
                .single();

            if (!data) {
                setVisible(true);
            }
        } catch (error) {
            console.log('Terms check error (likely not accepted):', error);
            // If error is "row not found", we show modal.
            // If network error, we might want to retry, but for safety blocking is better?
            // For now, assuming any error means "not validly accepted" or "offline", 
            // but let's be lenient on network errors if needed. 
            // Here: Show modal if we can't verify.
            setVisible(true);
        } finally {
            setChecking(false);
        }
    };

    const handleAccept = async () => {
        setLoading(true);

        // 1. Get Location
        let locationData = null;
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão Necessária', 'Para aceitar os termos e garantir a conformidade legal, precisamos da sua localização.', [
                    { text: 'Entendi' }
                ]);
                setLoading(false);
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            locationData = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy: loc.coords.accuracy,
                timestamp: loc.timestamp
            };
        } catch (e) {
            console.warn('Location error:', e);
            Alert.alert('Erro', 'Não foi possível obter sua localização. Tente novamente.');
            setLoading(false);
            return;
        }

        // 2. Save to DB
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Should not happen

            const { error } = await supabase
                .from('user_term_acceptances')
                .insert([
                    {
                        user_id: user.id,
                        term_version: TERMS_VERSION,
                        accepted_at: new Date().toISOString(),
                        ip_address: 'MOBILE_APP',
                        location: locationData,
                    }
                ]);

            if (error) throw error;

            setVisible(false);
            Alert.alert('Sucesso', 'Termos aceitos. Bem-vindo de volta!');

        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao registrar aceite. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (checking) return null; // Or a spinner

    return (
        <>
            {children}
            <Modal visible={visible} animationType="slide" transparent>
                <View className="flex-1 bg-black/80 justify-center px-6">
                    <View className="bg-white rounded-2xl overflow-hidden">
                        <View className="bg-indigo-600 p-6 items-center">
                            <Text className="text-white text-xl font-bold">Atualização de Termos</Text>
                            <Text className="text-indigo-100 text-center text-sm mt-2">Versão {TERMS_VERSION}</Text>
                        </View>

                        <View className="p-6">
                            <Text className="text-gray-600 mb-4 leading-6">
                                Para continuar utilizando o QualyBuss Mobile, você deve aceitar os novos termos de uso.
                            </Text>
                            <Text className="text-gray-500 text-xs mb-6 italic">
                                * Ao aceitar, sua localização será registrada para fins de auditoria.
                            </Text>

                            <TouchableOpacity
                                onPress={handleAccept}
                                disabled={loading}
                                className={`py-4 rounded-xl items-center ${loading ? 'bg-indigo-300' : 'bg-indigo-600'}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Li e Aceito</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}
