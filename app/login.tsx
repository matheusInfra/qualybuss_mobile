import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Erro no login', error.message);
        setLoading(false);
    }

    return (
        <View className="flex-1 justify-center items-center bg-gray-50 px-4">
            <View className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <Text className="text-2xl font-bold text-center text-gray-900 mb-8">QualyBuss</Text>

                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                        <TextInput
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="seu@email.com"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-1">Senha</Text>
                        <TextInput
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="••••••••"
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={signInWithEmail}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg flex-row justify-center items-center ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-semibold">Entrar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
