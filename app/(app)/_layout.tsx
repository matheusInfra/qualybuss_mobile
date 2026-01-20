import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from '../../components/CustomDrawerContent';

export default function AppLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={{
                    headerShown: true,
                    drawerActiveTintColor: '#4f46e5',
                    drawerInactiveTintColor: '#374151',
                    drawerLabelStyle: { marginLeft: 10, fontWeight: '500' },
                    drawerStyle: { width: 300 },
                    headerTintColor: '#1f2937',
                    headerTitleStyle: { color: '#1f2937' },
                }}
            >
                <Drawer.Screen
                    name="index"
                    options={{
                        drawerLabel: 'Início',
                        title: 'QualyBuss',
                        drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={22} color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="absences/index"
                    options={{
                        drawerLabel: 'Gestão de Ausência',
                        title: 'Gestão de Ausência',
                        drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={22} color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="requests"
                    options={{
                        drawerLabel: 'Minhas Solicitações',
                        title: 'Solicitações',
                        drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={22} color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="occurrences/index"
                    options={{
                        drawerLabel: 'Meu Prontuário',
                        title: 'Prontuário',
                        drawerIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={22} color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="documents/index"
                    options={{
                        drawerLabel: 'Meus Documentos',
                        title: 'Documentos',
                        drawerIcon: ({ color, size }) => <Ionicons name="folder-open-outline" size={size} color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="profile"
                    options={{
                        drawerLabel: 'Meu Perfil',
                        title: 'Perfil',
                        drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={22} color={color} />,
                    }}
                />

                <Drawer.Screen
                    name="settings/index"
                    options={{
                        drawerLabel: 'Configurações',
                        title: 'Configurações',
                        drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={22} color={color} />,
                    }}
                />


            </Drawer>
        </GestureHandlerRootView>
    );
}
