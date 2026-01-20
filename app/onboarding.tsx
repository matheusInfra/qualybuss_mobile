import { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, ImageBackground, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Seus documentos\nna sua mão',
        description: 'Tenha acesso rápido e fácil a todos os seus documentos corporativos diretamente do seu dispositivo.',
        icon: 'document-text-outline',
        image: 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=1974&auto=format&fit=crop'
    },
    {
        id: '2',
        title: 'Solicitações\nfacilitadas',
        description: 'Faça solicitações de férias, abonos e muito mais com apenas alguns toques, sem burocracia.',
        icon: 'calendar-outline',
        image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop'
    },
    {
        id: '3',
        title: 'Seguro e\nRápido',
        description: 'Seus dados protegidos com a mais alta tecnologia de segurança e acesso via biometria.',
        icon: 'shield-checkmark-outline',
        image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=2070&auto=format&fit=crop'
    }
];

export default function Onboarding() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true
            });
        } else {
            await completeOnboarding();
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasViewedOnboarding', 'true');
            router.replace('/login');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
        return (
            <View style={{ width, height }} className="relative">
                <ImageBackground
                    source={{ uri: item.image }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                >
                    <View className="absolute inset-0 bg-black/60" />

                    <View className="flex-1 justify-end pb-32 px-8">
                        <Animated.View entering={FadeInDown.delay(200).springify()}>
                            <View className="w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center mb-6 shadow-lg shadow-indigo-500/50">
                                <Ionicons name={item.icon as any} size={32} color="white" />
                            </View>

                            <Text className="text-white text-4xl font-bold mb-4 leading-tight">
                                {item.title}
                            </Text>

                            <Text className="text-gray-300 text-lg leading-relaxed">
                                {item.description}
                            </Text>
                        </Animated.View>
                    </View>
                </ImageBackground>
            </View>
        );
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                bounces={false}
            />

            {/* Bottom Controls */}
            <View className="absolute bottom-12 left-0 right-0 px-8 flex-row items-center justify-between z-10">
                {/* Pagination Dots */}
                <View className="flex-row space-x-2">
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'w-8 bg-indigo-500'
                                    : 'w-2 bg-gray-500'
                                }`}
                        />
                    ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    onPress={handleNext}
                    className="bg-white px-8 py-3 rounded-full flex-row items-center space-x-2 shadow-lg active:scale-95 transition-transform"
                >
                    <Text className="text-indigo-900 font-bold text-base">
                        {currentIndex === SLIDES.length - 1 ? 'Começar' : 'Próximo'}
                    </Text>
                    {currentIndex !== SLIDES.length - 1 && (
                        <Ionicons name="arrow-forward" size={20} color="#312e81" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
