import "react-native-gesture-handler";
import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { TermsGuard } from "../components/TermsGuard";

const MainLayout = () => {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [viewedOnboarding, setViewedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, [segments]);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem('hasViewedOnboarding');
      if (value === 'true') {
        setViewedOnboarding(true);
      } else if (viewedOnboarding !== true) {
        setViewedOnboarding(false);
      }
    } catch (e) {
      setViewedOnboarding(false);
    }
  };

  useEffect(() => {
    if (loading || viewedOnboarding === null) return;

    const inAuthGroup = segments[0] === "(app)";
    const inOnboarding = segments[0] === "onboarding";

    if (session) {
      // If user is logged in
      if (segments[0] === "login" || segments[0] === "onboarding" || !segments[0]) {
        router.replace("/(app)");
      }
    } else {
      // If user is NOT logged in
      if (!viewedOnboarding) {
        if (!inOnboarding) {
          router.replace("/onboarding");
        }
      } else {
        // Has viewed onboarding
        if (inAuthGroup) {
          router.replace("/login");
        } else if (segments[0] === "onboarding") {
          // Prevent going back to onboarding if already viewed
          router.replace("/login");
        }
      }
    }
  }, [session, loading, segments, viewedOnboarding]);

  if (loading || viewedOnboarding === null) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return <Slot />;
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TermsGuard>
          <MainLayout />
        </TermsGuard>
        <StatusBar style="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
