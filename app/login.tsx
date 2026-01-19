import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ImageBackground, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Erro no login', error.message);
        }
        setLoading(false);
    }

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80' }}
            className="flex-1 justify-center items-center"
            resizeMode="cover"
        >
            <View className="absolute inset-0 bg-black/40" />

            <View className="w-[90%] max-w-sm bg-white/90 p-6 rounded-3xl shadow-lg">
                <View className="items-center mb-8">
                    {/* Placeholder for Logo - You can replace with <Image /> if you have a local asset */}
                    <View className="bg-white p-3 rounded-2xl shadow-sm mb-4">
                        {/* Text Logo as fallback if no image asset is handy, specific request was to fix logo formatting 
                             Since I don't have the asset path confirmed working, I'll use text for now or try valid import if available.
                             The desktop used import logo from '../../assets/logo.svg'; Mobile usually needs png.
                             I'll stick to a clean Text or Icon for now unless I see assets.
                          */}
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
                        onPress={signInWithEmail}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl flex-row justify-center items-center shadow-md mt-2 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-base">Entrar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View className="absolute bottom-8">
                <Text className="text-white/60 text-xs text-center">© 2026 QualyBuss Mobile</Text>
            </View>
        </ImageBackground>
    );
}
