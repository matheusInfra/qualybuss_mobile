import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleResetPassword() {
        if (!email) {
            Alert.alert('Erro', 'Por favor, informe seu e-mail.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // Note: Mobile deep linking setup would be needed for seamless redirect back to app
            // For now, we rely on the standard Supabase behavior (email link)
        });

        setLoading(false);

        if (error) {
            Alert.alert('Erro', error.message);
        } else {
            Alert.alert(
                'Sucesso',
                'Link de redefinição enviado! Verifique seu e-mail.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }
    }

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80' }}
            className="flex-1 justify-center items-center px-4"
            resizeMode="cover"
        >
            <View className="absolute inset-0 bg-black/40" />

            <View className="w-full max-w-sm bg-white/90 p-8 rounded-3xl shadow-lg">
                <Text className="text-2xl font-bold text-center text-gray-900 mb-2">Recuperar Senha</Text>
                <Text className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
                    Digite seu e-mail corporativo para receber as instruções.
                </Text>

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

                    <TouchableOpacity
                        onPress={handleResetPassword}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl flex-row justify-center items-center shadow-md mt-2 ${loading ? 'opacity-70' : 'bg-indigo-600'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-base">Enviar Link</Text>
                        )}
                    </TouchableOpacity>

                    <Link href="../" asChild>
                        <TouchableOpacity className="w-full py-3 items-center">
                            <Text className="text-indigo-600 font-semibold">Voltar para Login</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </ImageBackground>
    );
}
