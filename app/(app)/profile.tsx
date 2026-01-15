import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profile';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
    const { signOut, user } = useAuth();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        profileService.getMyProfile().then(setProfile).catch(console.error);
    }, []);

    return (
        <View className="flex-1 bg-gray-50 p-6">
            <View className="items-center mb-8 mt-4">
                <View className="w-24 h-24 bg-white rounded-full shadow-sm mb-4 justify-center items-center overflow-hidden border-4 border-white">
                    {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
                    ) : (
                        <Ionicons name="person" size={40} color="#d1d5db" />
                    )}
                </View>
                <Text className="text-xl font-bold text-gray-900">{profile?.full_name || 'Carregando...'}</Text>
                <Text className="text-gray-500">{user?.email}</Text>
            </View>

            <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <View className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                    <Text className="font-bold text-gray-500 uppercase text-xs">Informações Profissionais</Text>
                </View>
                <View className="p-4 border-b border-gray-50 flex-row justify-between">
                    <Text className="text-gray-500">Cargo</Text>
                    <Text className="font-bold text-gray-800">{profile?.role || '-'}</Text>
                </View>
                <View className="p-4 border-b border-gray-50 flex-row justify-between">
                    <Text className="text-gray-500">Departamento</Text>
                    <Text className="font-bold text-gray-800">{profile?.department || '-'}</Text>
                </View>
                <View className="p-4 flex-row justify-between">
                    <Text className="text-gray-500">Admissão</Text>
                    <Text className="font-bold text-gray-800">
                        {profile?.admission_date ? new Date(profile.admission_date).toLocaleDateString() : '-'}
                    </Text>
                </View>
            </View>

            <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <View className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                    <Text className="font-bold text-gray-500 uppercase text-xs">Documentos Pessoais</Text>
                </View>
                <View className="p-4 border-b border-gray-50 flex-row justify-between">
                    <Text className="text-gray-500">CPF</Text>
                    <Text className="font-bold text-gray-800">{profile?.cpf || '-'}</Text>
                </View>
                <View className="p-4 border-b border-gray-50 flex-row justify-between">
                    <Text className="text-gray-500">RG</Text>
                    <Text className="font-bold text-gray-800">{profile?.rg || '-'}</Text>
                </View>
                <View className="p-4 border-b border-gray-50 flex-row justify-between">
                    <Text className="text-gray-500">PIS</Text>
                    <Text className="font-bold text-gray-800">{profile?.pis || '-'}</Text>
                </View>
                <View className="p-4 flex-row justify-between">
                    <Text className="text-gray-500">Nascimento</Text>
                    <Text className="font-bold text-gray-800">
                        {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : '-'}
                    </Text>
                </View>
            </View>

            <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <View className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                    <Text className="font-bold text-gray-500 uppercase text-xs">Contato & Endereço</Text>
                </View>
                <View className="p-4 border-b border-gray-50">
                    <Text className="text-gray-500 text-xs mb-1">Email Corporativo</Text>
                    <Text className="font-bold text-gray-800">{profile?.corporate_email || '-'}</Text>
                </View>
                <View className="p-4">
                    <Text className="text-gray-500 text-xs mb-1">Endereço</Text>
                    <Text className="font-bold text-gray-800">
                        {profile?.address_street}, {profile?.address_number}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                        {profile?.address_city} - {profile?.address_state}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">CEP: {profile?.address_zip_code}</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => signOut()}
                className="bg-red-50 py-4 px-4 rounded-xl flex-row justify-center items-center gap-2 border border-red-100"
            >
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                <Text className="text-red-600 font-bold">Sair do Aplicativo</Text>
            </TouchableOpacity>
        </View>
    );
}
