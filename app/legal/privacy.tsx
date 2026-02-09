import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Privacy() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="pt-12 pb-4 px-6 bg-white border-b border-gray-100 flex-row items-center gap-4 shadow-sm z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Política de Privacidade</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
                <Text className="text-gray-500 text-sm mb-6">Última atualização: {new Date().toLocaleDateString()}</Text>

                <View className="space-y-6">
                    <View>
                        <Text className="text-lg font-bold text-gray-800 mb-2">1. Coleta de Dados</Text>
                        <Text className="text-gray-600 leading-6 mb-2">
                            Este aplicativo coleta dados necessários para sua operação e cumprimento de obrigações legais (LGPD).
                        </Text>
                        <Text className="text-gray-600 leading-6">
                            • Dados de identificação (Email, ID).{'\n'}
                            • Biometria (Armazenada apenas localmente no dispositivo).{'\n'}
                            • Metadados de acesso (Logs, Modelo do aparelho).
                        </Text>
                    </View>

                    <View>
                        <Text className="text-lg font-bold text-gray-800 mb-2">2. Uso da Biometria</Text>
                        <Text className="text-gray-600 leading-6">
                            A autenticação biométrica (FaceID/TouchID) é utilizada apenas para facilitar seu login.
                            Os dados biométricos NUNCA são enviados para nossos servidores.
                        </Text>
                    </View>

                    <View>
                        <Text className="text-lg font-bold text-gray-800 mb-2">3. Armazenamento Seguro</Text>
                        <Text className="text-gray-600 leading-6">
                            Suas credenciais são armazenadas de forma criptografada utilizando o Secure Storage do dispositivo.
                        </Text>
                    </View>

                    <View>
                        <Text className="text-lg font-bold text-gray-800 mb-2">4. Seus Direitos</Text>
                        <Text className="text-gray-600 leading-6">
                            Você tem direito de saber quais dados estão sendo processados. Para solicitações relacionadas à LGPD, contate o DPO da empresa.
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
