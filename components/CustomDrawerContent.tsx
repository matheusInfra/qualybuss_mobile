import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { profileService } from '../services/profile';
import { useRouter } from 'expo-router';

export default function CustomDrawerContent(props: any) {
    const { signOut, user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        profileService.getMyProfile().then(setProfile).catch(err => console.log('Drawer Profile Load Error:', err));
    }, []);

    return (
        <View className="flex-1 bg-white">
            <View className="bg-indigo-600 pt-16 pb-6 px-4">
                <View className="flex-row items-center gap-4">
                    <View className="w-16 h-16 bg-white rounded-full items-center justify-center border-2 border-indigo-200 overflow-hidden">
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
                        ) : (
                            <Text className="text-indigo-600 font-bold text-2xl">
                                {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-lg" numberOfLines={1}>
                            {profile?.full_name || 'Bem-vindo'}
                        </Text>
                        <Text className="text-indigo-100 text-xs" numberOfLines={1}>
                            {user?.email}
                        </Text>
                    </View>
                </View>
            </View>

            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 10 }}>
                <DrawerItemList {...props} />
            </DrawerContentScrollView>

            <View className="p-4 border-t border-gray-100 mb-4">
                <TouchableOpacity
                    onPress={() => signOut()}
                    className="flex-row items-center gap-3 p-2 rounded-lg"
                >
                    <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                    <Text className="text-red-500 font-medium">Sair da Conta</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
