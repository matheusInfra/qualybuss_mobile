import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking, Modal, ScrollView, Animated, Alert } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CollaboratorDocument, documentService } from '../../../services/documents';
import SignatureScreen from 'react-native-signature-canvas';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Desktop Categories: 'Contrato', 'Documentos Pessoais', 'Holerite', 'Folha de Ponto', 'Comprovante Bancário', 'Currículo', 'Outros'
// "Acesso apenas a categoria holerites por enquanto" -> Restricting list.
const CATEGORIES = ['Holerite'];
// const ALL_CATEGORIES = ['Holerite', 'Contrato', 'Documentos Pessoais', 'Folha de Ponto', 'Comprovante Bancário', 'Currículo', 'Outros'];

export default function DocumentsScreen() {
    const [documents, setDocuments] = useState<CollaboratorDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters State
    const [selectedYear, setSelectedYear] = useState<number | null>(null); // Default to All Years
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Default to All (null)
    const [showFilters, setShowFilters] = useState(false);

    // Signature State
    const [signingDoc, setSigningDoc] = useState<CollaboratorDocument | null>(null);
    const signatureRef = useRef<any>(null);

    const handleSignatureOK = async (signature: string) => {
        if (!signingDoc) return;
        setLoading(true);
        try {
            await documentService.signDocument(signingDoc.id, signature);
            setSigningDoc(null);
            Alert.alert("Sucesso", "Documento assinado com sucesso!");
            loadDocuments(); // Refresh list to update status
        } catch (error) {
            Alert.alert("Erro", "Falha ao salvar assinatura.");
            console.error(error);
            setLoading(false);
        }
    };

    const handleSignatureEmpty = () => {
        Alert.alert("Atenção", "Por favor, assine no campo indicado.");
    };

    const handleEndKey = () => {
        signatureRef.current?.readSignature();
    }

    // Initial Load
    useEffect(() => {
        loadDocuments();
    }, [selectedYear, selectedMonth, selectedCategory]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const filters: any = {
                year: selectedYear || undefined, // undefined skips filter
                month: selectedMonth || undefined,
                category: selectedCategory // Always filter by the selected category (Holerite)
            };

            const data = await documentService.getMyDocuments(filters);
            setDocuments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleOpenDocument = (url: string) => {
        Linking.openURL(url);
    };

    const getIconForCategory = (cat: string) => {
        switch (cat) {
            case 'Holerite': return { name: 'cash-outline', color: '#16a34a', bg: 'bg-green-100' };
            case 'Contrato': return { name: 'briefcase-outline', color: '#ea580c', bg: 'bg-orange-100' };
            case 'Atestado': return { name: 'medkit-outline', color: '#dc2626', bg: 'bg-red-100' }; // Keeping for legacy/requests
            case 'Documentos Pessoais': return { name: 'id-card-outline', color: '#2563eb', bg: 'bg-blue-100' };
            case 'Folha de Ponto': return { name: 'time-outline', color: '#4f46e5', bg: 'bg-indigo-100' };
            case 'Comprovante Bancário': return { name: 'receipt-outline', color: '#0891b2', bg: 'bg-cyan-100' };
            case 'Currículo': return { name: 'person-outline', color: '#7c3aed', bg: 'bg-violet-100' };
            default: return { name: 'document-text-outline', color: '#64748b', bg: 'bg-gray-100' };
        }
    };

    const renderItem = ({ item }: { item: CollaboratorDocument }) => {
        const style = getIconForCategory(item.category);
        const isSigned = !!item.signed_at;

        return (
            <TouchableOpacity
                onPress={() => {
                    if (isSigned) {
                        handleOpenDocument(item.url);
                    } else {
                        setSigningDoc(item);
                    }
                }}
                className={`bg-white p-4 rounded-2xl mb-3 border flex-row items-center gap-4 shadow-sm active:scale-95 transition-transform ${isSigned ? 'border-gray-100' : 'border-indigo-100 bg-indigo-50/10'}`}
            >
                <View className={`w-14 h-14 rounded-2xl flex items-center justify-center ${style.bg}`}>
                    <Ionicons name={style.name as any} size={28} color={style.color} />
                </View>
                <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                        <Text className="font-bold text-gray-800 text-base flex-1 mr-2" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-[10px] text-gray-400 font-medium">
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>

                    <View className="flex-row gap-2 mt-2 items-center flex-wrap">
                        <View className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            <Text className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">
                                {item.category}
                            </Text>
                        </View>
                        {item.competence_month && item.competence_year && (
                            <Text className="text-xs text-indigo-600 font-medium">
                                Ref: {MONTHS[item.competence_month - 1]}/{item.competence_year}
                            </Text>
                        )}

                        {/* Status Chips */}
                        {isSigned ? (
                            <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
                                <Ionicons name="checkmark-circle" size={10} color="#16a34a" />
                                <Text className="text-[10px] text-green-700 font-bold ml-1">Assinado</Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center bg-amber-100 px-2 py-1 rounded-full">
                                <Ionicons name="create-outline" size={10} color="#b45309" />
                                <Text className="text-[10px] text-amber-700 font-bold ml-1">Assinar</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#e2e8f0" />
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header & Quick Stats */}
            <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100 shadow-sm z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">Documentos</Text>
                        <Text className="text-sm text-gray-500">
                            {documents.length} arquivo(s) encontrado(s)
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFilters(true)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border ${showFilters ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                        <Ionicons name="options" size={24} color={showFilters ? '#4f46e5' : '#1f2937'} />
                    </TouchableOpacity>
                </View>

                {/* Active Filters Summary (Chips) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                    <View className="bg-indigo-50 px-3 py-1.5 rounded-full flex-row items-center border border-indigo-100 mr-2">
                        <Ionicons name="calendar" size={12} color="#4f46e5" />
                        <Text className="text-indigo-700 text-xs font-bold ml-1">
                            {selectedYear ? selectedYear : 'Todos os Anos'}
                        </Text>
                    </View>
                    {selectedMonth && (
                        <View className="bg-indigo-50 px-3 py-1.5 rounded-full flex-row items-center border border-indigo-100 mr-2">
                            <Text className="text-indigo-700 text-xs font-bold">{MONTHS[selectedMonth - 1]}</Text>
                        </View>
                    )}
                    <View className="bg-emerald-50 px-3 py-1.5 rounded-full flex-row items-center border border-emerald-100 mr-2">
                        <Text className="text-emerald-700 text-xs font-bold">{selectedCategory || 'Todas as Categorias'}</Text>
                    </View>
                </ScrollView>
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text className="text-gray-400 text-sm mt-4">Carregando documentos...</Text>
                </View>
            ) : (
                <FlatList
                    data={documents}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshing={refreshing}
                    onRefresh={() => { setRefreshing(true); loadDocuments(); }}
                    ListEmptyComponent={
                        <View className="items-center justify-center mt-20 opacity-60 px-10">
                            <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
                                <Ionicons name="search" size={40} color="#9ca3af" />
                            </View>
                            <Text className="text-lg font-bold text-gray-700 text-center">Nenhum resultado</Text>
                            <Text className="mt-2 text-gray-500 text-center leading-5">
                                Não encontramos documentos com os filtros aplicados. Tente alterar o período ou categoria.
                            </Text>
                            <TouchableOpacity
                                onPress={() => { setSelectedMonth(null); setSelectedCategory(null); setSelectedYear(null); }}
                                className="mt-6 px-6 py-3 bg-gray-200 rounded-lg"
                            >
                                <Text className="font-bold text-gray-600">Limpar Filtros</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Filter Modal - REFACTORED to remove NativeWind crash */}
            <Modal visible={showFilters} animationType="slide" transparent statusBarTranslucent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowFilters(false)} />

                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 24 }}>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Filtrar</Text>
                            <TouchableOpacity onPress={() => {
                                setSelectedMonth(null);
                                setSelectedCategory(null); // Reset to All
                                setSelectedYear(null);
                            }}>
                                <Text style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: 14 }}>Limpar Tudo</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Year Selector */}
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Ano de Referência</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                                <TouchableOpacity
                                    onPress={() => setSelectedYear(null)}
                                    style={{
                                        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginRight: 12,
                                        backgroundColor: selectedYear === null ? '#4f46e5' : 'white',
                                        borderColor: selectedYear === null ? '#4f46e5' : '#e5e7eb'
                                    }}
                                >
                                    <Text style={{ color: selectedYear === null ? 'white' : '#4b5563', fontWeight: 'bold' }}>Todos</Text>
                                </TouchableOpacity>

                                {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 5 + i).reverse().map(y => (
                                    <TouchableOpacity
                                        key={y}
                                        onPress={() => setSelectedYear(y)}
                                        style={{
                                            paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginRight: 12,
                                            backgroundColor: selectedYear === y ? '#4f46e5' : 'white',
                                            borderColor: selectedYear === y ? '#4f46e5' : '#e5e7eb'
                                        }}
                                    >
                                        <Text style={{ color: selectedYear === y ? 'white' : '#4b5563', fontWeight: 'bold' }}>{y}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Category Selector */}
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Categoria</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                                <TouchableOpacity
                                    onPress={() => setSelectedCategory(null)}
                                    style={{
                                        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, marginRight: 8, marginBottom: 8,
                                        backgroundColor: selectedCategory === null ? '#e0e7ff' : 'white',
                                        borderColor: selectedCategory === null ? '#a5b4fc' : '#e5e7eb'
                                    }}
                                >
                                    <Text style={{ fontSize: 14, color: selectedCategory === null ? '#4338ca' : '#4b5563', fontWeight: selectedCategory === null ? 'bold' : 'normal' }}>
                                        Todas
                                    </Text>
                                </TouchableOpacity>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setSelectedCategory(cat)}
                                        style={{
                                            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, marginRight: 8, marginBottom: 8,
                                            backgroundColor: selectedCategory === cat ? '#e0e7ff' : 'white',
                                            borderColor: selectedCategory === cat ? '#a5b4fc' : '#e5e7eb'
                                        }}
                                    >
                                        <Text style={{ fontSize: 14, color: selectedCategory === cat ? '#4338ca' : '#4b5563', fontWeight: selectedCategory === cat ? 'bold' : 'normal' }}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Month Grid Selector */}
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Mês</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                <TouchableOpacity
                                    onPress={() => setSelectedMonth(null)}
                                    style={{
                                        width: '48%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12, alignItems: 'center',
                                        backgroundColor: selectedMonth === null ? '#1f2937' : 'white',
                                        borderColor: selectedMonth === null ? '#1f2937' : '#e5e7eb'
                                    }}
                                >
                                    <Text style={{ color: selectedMonth === null ? 'white' : '#4b5563', fontWeight: 'bold' }}>O Ano Todo</Text>
                                </TouchableOpacity>
                                {MONTHS.map((m, i) => (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => setSelectedMonth(i + 1)}
                                        style={{
                                            width: '48%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12, alignItems: 'center',
                                            backgroundColor: selectedMonth === i + 1 ? '#4f46e5' : 'white',
                                            borderColor: selectedMonth === i + 1 ? '#4f46e5' : '#e5e7eb'
                                        }}
                                    >
                                        <Text style={{ fontSize: 14, color: selectedMonth === i + 1 ? 'white' : '#4b5563', fontWeight: selectedMonth === i + 1 ? 'bold' : 'normal' }}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => { loadDocuments(); setShowFilters(false); }}
                            style={{ marginTop: 16, backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Ver Resultados</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Signature Modal */}
            <Modal visible={!!signingDoc} animationType="slide" transparent>
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white h-[60%] rounded-t-3xl p-4">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-gray-900">Assinar Documento</Text>
                            <TouchableOpacity onPress={() => setSigningDoc(null)}>
                                <Ionicons name="close-circle" size={30} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-sm text-gray-500 mb-4">
                            Faça sua assinatura no campo abaixo para confirmar o recebimento do documento <Text className="font-bold">{signingDoc?.name}</Text>.
                        </Text>

                        <View className="flex-1 border border-dashed border-gray-300 rounded-xl overflow-hidden mb-4 bg-gray-50">
                            <SignatureScreen
                                ref={signatureRef}
                                onOK={handleSignatureOK}
                                onEmpty={handleSignatureEmpty}
                                descriptionText="Assine aqui"
                                clearText="Limpar"
                                confirmText="Confirmar"
                                webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`}
                            />
                        </View>

                        <View className="flex-row gap-3 h-14">
                            <TouchableOpacity
                                onPress={() => signatureRef.current?.clearSignature()}
                                className="flex-1 bg-gray-100 rounded-xl items-center justify-center"
                            >
                                <Text className="font-bold text-gray-600">Limpar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleEndKey}
                                className="flex-1 bg-indigo-600 rounded-xl items-center justify-center shadow-lg shadow-indigo-200"
                            >
                                <Text className="font-bold text-white text-lg">Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
