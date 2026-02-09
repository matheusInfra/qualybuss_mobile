import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Terms() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="pt-12 pb-4 px-6 bg-white border-b border-gray-100 flex-row items-center gap-4 shadow-sm z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Termos de Uso</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
                <Text className="text-gray-500 text-sm mb-6">Última atualização: {new Date().toLocaleDateString()}</Text>

                <View className="space-y-6">
                    <View>
                        <Text className="text-lg font-bold text-gray-800 mb-2">1. Introdução</Text>
                        <Text className="text-gray-600 leading-6">
                            Bem-vindo ao QualyBuss Mobile. Ao acessar ou usar nosso sistema, você concorda em cumprir estes Termos de Uso.
                            O uso deste aplicativo é estritamente corporativo.
                        </Text>
                    </View>

                    <View>
                        <Text className="text-lg font-bold text-gray-800 mb-2">2. Acesso e Segurança</Text>
                        <Text className="text-gray-600 leading-6 mb-2">
                            Ao utilizar recursos de autenticação biométrica, você reconhece que a segurança do dispositivo é de sua responsabilidade via token.
                        </Text>
                        <Text className="text-gray-600 leading-6">
                            • Mantenha suas credenciais seguras.{'\n'}
                            • Reporte imediatamente qualquer acesso suspeito.{'\n'}
                            • O acesso é registrado e auditável.
                        </Text>
                    </View>

                    <View>
                        <Text className="text-lg font-bold text-gray-800 mb-2">3. Propriedade Intelectual</Text>
                        <Text className="text-gray-600 leading-6">
                            Todo o conteúdo, design e código deste aplicativo são propriedade exclusiva da QualyBuss.
                        </Text>
                    </View>

                    <View>
                        <Text className="text-lg font-bold text-gray-800 mb-2">4. Disposições Gerais</Text>
                        <Text className="text-gray-600 leading-6">
                            Este serviço é fornecido para facilitar suas atividades profissionais. O uso indevido pode incorrer em penalidades administrativas.
                        </Text>
                    </View>
                </View>

                <View className="mt-8 pt-6 border-t border-gray-200 items-center">
                    <Text className="text-gray-400 text-xs">© {new Date().getFullYear()} QualyBuss. Todos os direitos reservados.</Text>
                </View>
            </ScrollView>
        </View>
    );
}
