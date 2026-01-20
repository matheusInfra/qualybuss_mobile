import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    const router = useRouter();

    useEffect(() => {
        checkBiometricSupport();
        checkSavedCredentials();
    }, []);

    const checkBiometricSupport = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(compatible && enrolled);
    };

    const checkSavedCredentials = async () => {
        try {
            const bioEnabled = await AsyncStorage.getItem('biometricsEnabled');
            if (bioEnabled === 'true') {
                const savedEmail = await SecureStore.getItemAsync('userEmail');
                const savedPassword = await SecureStore.getItemAsync('userPassword');

                if (savedEmail && savedPassword) {
                    authenticateBiometric(savedEmail, savedPassword);
                }
            }
        } catch (error) {
            console.log('Error checking credentials', error);
        }
    };

    const authenticateBiometric = async (savedEmail: string, savedPassword: string) => {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Autenticação Biométrica',
            fallbackLabel: 'Usar Senha',
        });

        if (result.success) {
            setEmail(savedEmail);
            performLogin(savedEmail, savedPassword);
        }
    };

    const performLogin = async (e: string, p: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: e,
            password: p,
        });

        if (error) {
            Alert.alert('Erro no login', error.message);
            setLoading(false);
        } else {
            handleLoginSuccess(e, p);
        }
    };

    const handleLoginSuccess = async (e: string, p: string) => {
        setShowWelcome(true);

        // Check if we should ask about biometrics
        const bioStatus = await AsyncStorage.getItem('biometricsEnabled');

        if (bioStatus === null && isBiometricSupported) {
            Alert.alert(
                "Biometria",
                "Deseja ativar o login com biometria para acessos futuros?",
                [
                    {
                        text: "Não",
                        onPress: async () => {
                            await AsyncStorage.setItem('biometricsEnabled', 'false');
                            finishLogin();
                        }
                    },
                    {
                        text: "Sim",
                        onPress: async () => {
                            await AsyncStorage.setItem('biometricsEnabled', 'true');
                            await SecureStore.setItemAsync('userEmail', e);
                            await SecureStore.setItemAsync('userPassword', p);
                            finishLogin();
                        }
                    }
                ]
            );
        } else if (bioStatus === 'true') {
            // Update password in case it changed
            await SecureStore.setItemAsync('userPassword', p);
            finishLogin();
        } else {
            finishLogin();
        }
    };

    const finishLogin = () => {
        setTimeout(() => {
            setLoading(false);
            // Use replace to avoid going back to login
            // The _layout will handle the redirect, but we can force it or wait for session update
            // We'll wait a brief moment for the animation
        }, 2000);
    };

    // If welcome animation is showing, render that instead
    if (showWelcome) {
        return (
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80' }}
                className="flex-1 justify-center items-center"
            >
                <View className="absolute inset-0 bg-black/60" />
                <Animated.View
                    entering={ZoomIn.duration(1000)}
                    className="bg-white/95 p-8 rounded-3xl items-center shadow-2xl"
                >
                    <View className="mb-4 bg-indigo-100 p-4 rounded-full">
                        <Ionicons name="checkmark-circle" size={64} color="#4f46e5" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo!</Text>
                    <Text className="text-gray-500">Acessando seus documentos...</Text>
                </Animated.View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80' }}
            className="flex-1 justify-center items-center"
            resizeMode="cover"
        >
            <View className="absolute inset-0 bg-black/40" />

            <Animated.View
                entering={FadeIn.duration(1000)}
                className="w-[90%] max-w-sm bg-white/90 p-6 rounded-3xl shadow-lg"
            >
                <View className="items-center mb-8">
                    <View className="bg-white p-3 rounded-2xl shadow-sm mb-4">
                        <Text className="text-2xl font-bold text-indigo-600">QB</Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">Bem-vindo</Text>
                    <Text className="text-gray-500 text-sm">Acesse sua conta corporativa</Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Email</Text>
                        <TextInput
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 text-gray-800"
                            placeholder="seu@email.com"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />
                    </View>

                    <View>
                        <View className="flex-row justify-between items-center mb-1 ml-1">
                            <Text className="text-xs font-bold text-gray-600 uppercase">Senha</Text>
                            <Link href="/forgot-password" asChild>
                                <TouchableOpacity>
                                    <Text className="text-xs text-indigo-600 font-semibold">Esqueceu?</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                        <TextInput
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 text-gray-800"
                            placeholder="••••••••"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={() => performLogin(email, password)}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl flex-row justify-center items-center shadow-md mt-2 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-base">Entrar</Text>
                        )}
                    </TouchableOpacity>

                    {isBiometricSupported && (
                        <TouchableOpacity
                            onPress={checkSavedCredentials}
                            className="w-full py-3 rounded-xl flex-row justify-center items-center mt-2 border border-indigo-200"
                        >
                            <Ionicons name="finger-print" size={20} color="#4f46e5" style={{ marginRight: 8 }} />
                            <Text className="text-indigo-600 font-semibold text-sm">Usar Biometria</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            <View className="absolute bottom-8">
                <Text className="text-white/60 text-xs text-center">© 2026 QualyBuss Mobile</Text>
            </View>
        </ImageBackground>
    );
}
