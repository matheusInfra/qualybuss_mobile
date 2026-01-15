import { Stack } from 'expo-router';

export default function RequestsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: 'Minhas Solicitações' }} />
            <Stack.Screen name="new" options={{ title: 'Nova Solicitação', presentation: 'card' }} />
        </Stack>
    );
}
