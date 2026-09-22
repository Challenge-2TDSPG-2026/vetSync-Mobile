import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ESPECIES } from '../constants';
import { PetForm } from '../components/pet-form/PetForm';
import { useAtualizarPet, useCriarPet, useDefinirPetAtivo, usePetPorId } from '../hooks/usePets';
import type { Pet } from '../types';

const C = {
  night: '#0a2218',
  forest: '#123d29',
  mint: '#22a06b',
  mintPale: '#bfe9d5',
  cream: '#faf8f3',
};

function Icone({ nome, conjunto }: { nome: string; conjunto: 'Ionicons' | 'MaterialCommunityIcons' }) {
  if (conjunto === 'Ionicons') return <Ionicons name={nome as never} size={28} color="#fff" />;
  return <MaterialCommunityIcons name={nome as never} size={28} color="#fff" />;
}

export default function AddPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const { data: petInicial, isLoading: carregandoPet } = usePetPorId(editando ? String(id) : null, editando);
  const criarPet = useCriarPet();
  const atualizarPet = useAtualizarPet();
  const definirPetAtivo = useDefinirPetAtivo();
  const [especieSelo, setEspecieSelo] = useState<Pet['especie'] | null>(null);
  const itemEspecie = ESPECIES.find(item => item.valor === (especieSelo ?? petInicial?.especie));
  const iconeSelo = itemEspecie
    ? { nome: itemEspecie.icon, conjunto: itemEspecie.iconSet as 'Ionicons' | 'MaterialCommunityIcons' }
    : { nome: 'paw', conjunto: 'MaterialCommunityIcons' as const };

  async function aoSalvarComSucesso(pet: Pet) {
    if (!editando) await definirPetAtivo.mutateAsync(pet.id);
    router.back();
  }

  function exibirErro() {
    Alert.alert('Não deu pra salvar', 'Confira sua conexão e tente de novo. Os dados que você digitou continuam aqui.');
  }

  function salvar(pet: Pet) {
    if (editando) {
      atualizarPet.mutate(pet, { onSuccess: aoSalvarComSucesso, onError: exibirErro });
      return;
    }
    criarPet.mutate(pet, { onSuccess: aoSalvarComSucesso, onError: exibirErro });
  }

  if (editando && carregandoPet) {
    return <View style={estilos.centralizado}><ActivityIndicator size="large" color={C.mint} /></View>;
  }

  return (
    <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={estilos.flex} contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[C.night, C.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.hero}>
          <MaterialCommunityIcons name="paw" size={190} color="rgba(255,255,255,0.05)" style={estilos.pawMarca} />
          <Pressable onPress={() => router.back()} style={estilos.btnFechar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fechar">
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
          <View style={estilos.seloWrap}><View style={estilos.seloGlowOut} /><View style={estilos.seloGlowIn} /><View style={estilos.selo}><Icone {...iconeSelo} /></View></View>
          <Text style={estilos.heroTitulo}>{editando ? 'Editar pet' : 'Vamos conhecer seu pet.'}</Text>
          <Text style={estilos.heroSub}>{editando ? 'Atualize as informações sempre que algo mudar.' : 'Só o essencial pra começar a cuidar da saúde dele por aqui.'}</Text>
        </LinearGradient>
        <PetForm
          petInicial={petInicial}
          editando={editando}
          salvando={criarPet.isPending || atualizarPet.isPending || definirPetAtivo.isPending}
          onSalvar={salvar}
          onCancelar={() => router.back()}
          onEspecieChange={setEspecieSelo}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.night },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream },
  hero: { paddingTop: 56, paddingHorizontal: 28, paddingBottom: 46, overflow: 'hidden' },
  pawMarca: { position: 'absolute', top: -18, right: -26, transform: [{ rotate: '-16deg' }] },
  btnFechar: { position: 'absolute', top: 16, right: 20, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  seloWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  seloGlowOut: { position: 'absolute', width: 86, height: 86, borderRadius: 43, backgroundColor: 'rgba(242,200,121,0.12)' },
  seloGlowIn: { position: 'absolute', width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(242,200,121,0.16)' },
  selo: { width: 48, height: 48, borderRadius: 15, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  heroTitulo: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, lineHeight: 31, marginBottom: 8, maxWidth: 300 },
  heroSub: { fontSize: 14, fontWeight: '500', color: C.mintPale, lineHeight: 20, maxWidth: 280 },
});
