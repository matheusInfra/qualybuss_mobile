import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";

const MainLayout = () => {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(app)";

    if (!session && inAuthGroup) {
      // Redirect to login if accessing protected route without session
      router.replace("/login");
    } else if (session && (segments[0] === "login" || segments.length === 0)) {
      // Redirect to app if logged in and on login or root
      router.replace("/(app)/");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
