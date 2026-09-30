import { useTheme } from '../../context/ThemeContext';
import { withAlpha, type AppTheme } from '../../constants/theme';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ESPECIES } from '../../constants';
import { PetForm } from '../../components/pet-form/PetForm';
import { useAtualizarPet, usePetPorId } from '../../hooks/usePets';
import { usePet } from '../../context/PetContext';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { DicaTela } from '../../components/ui/DicaTela';
import type { Pet } from '../../types';

function Icone({ nome, conjunto, color }: { nome: string; conjunto: 'Ionicons' | 'MaterialCommunityIcons'; color: string }) {
  if (conjunto === 'Ionicons') return <Ionicons name={nome as never} size={28} color={color} />;
  return <MaterialCommunityIcons name={nome as never} size={28} color={color} />;
}

export default function AddPetScreen() {
  const { theme } = useTheme();
  const estilos = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('add-pet');
  const { data: petInicial, isLoading: carregandoPet } = usePetPorId(editando ? String(id) : null, editando);
  const atualizarPet = useAtualizarPet();
  const { adicionarPet, salvandoPet } = usePet();
  const [especieSelo, setEspecieSelo] = useState<Pet['especie'] | null>(null);
  const itemEspecie = ESPECIES.find(item => item.valor === (especieSelo ?? petInicial?.especie));
  const iconeSelo = itemEspecie
    ? { nome: itemEspecie.icon, conjunto: itemEspecie.iconSet as 'Ionicons' | 'MaterialCommunityIcons' }
    : { nome: 'paw', conjunto: 'MaterialCommunityIcons' as const };

  function aoSalvarComSucesso() {
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
    adicionarPet(pet).then(aoSalvarComSucesso).catch(exibirErro);
  }

  if (editando && carregandoPet) {
    return <View style={estilos.centralizado}><ActivityIndicator size="large" color={theme.pages.addPet.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={estilos.flex} contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[theme.pages.addPet.heroBackground, theme.pages.addPet.heroAccent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.hero}>
          <MaterialCommunityIcons name="paw" size={190} color={withAlpha(theme.pages.addPet.heroText, 0.05)} style={estilos.pawMarca} />
          <Pressable onPress={() => router.back()} style={estilos.btnFechar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fechar">
            <Ionicons name="close" size={20} color={theme.pages.addPet.heroText} />
          </Pressable>
          <View style={estilos.seloWrap}><View style={estilos.seloGlowOut} /><View style={estilos.seloGlowIn} /><View style={estilos.selo}><Icone {...iconeSelo} color={theme.pages.addPet.heroText} /></View></View>
          <Text style={estilos.heroTitulo}>{editando ? 'Editar pet' : 'Vamos conhecer seu pet.'}</Text>
          <Text style={estilos.heroSub}>{editando ? 'Atualize as informações sempre que algo mudar.' : 'Só o essencial pra começar a cuidar da saúde dele por aqui.'}</Text>
        </LinearGradient>
        {dicaVisivel && (
          <DicaTela
            titulo="Cadastro do pet"
            texto="Preencha as informações básicas do seu pet. Você pode editar qualquer dado depois, sempre que precisar."
            accentColor={theme.pages.addPet.primary}
            onFechar={fecharDica}
            style={{ marginHorizontal: 24, marginBottom: 40 }}
          />
        )}
        <PetForm
          petInicial={petInicial}
          editando={editando}
          salvando={salvandoPet || atualizarPet.isPending}
          onSalvar={salvar}
          onCancelar={() => router.back()}
          onEspecieChange={setEspecieSelo}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  raiz: { flex: 1, backgroundColor: theme.pages.addPet.heroBackground },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pages.addPet.background },
  hero: { paddingTop: 56, paddingHorizontal: 28, paddingBottom: 46, overflow: 'hidden' },
  pawMarca: { position: 'absolute', top: -18, right: -26, transform: [{ rotate: '-16deg' }] },
  btnFechar: { position: 'absolute', top: 16, right: 20, width: 34, height: 34, borderRadius: 17, backgroundColor: withAlpha(theme.pages.addPet.heroText, 0.14), alignItems: 'center', justifyContent: 'center' },
  seloWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  seloGlowOut: { position: 'absolute', width: 86, height: 86, borderRadius: 43, backgroundColor: withAlpha(theme.colors.brandAccent, 0.12) },
  seloGlowIn: { position: 'absolute', width: 66, height: 66, borderRadius: 33, backgroundColor: withAlpha(theme.colors.brandAccent, 0.16) },
  selo: { width: 48, height: 48, borderRadius: 15, backgroundColor: theme.pages.addPet.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  heroTitulo: { fontSize: 26, fontWeight: '800', color: theme.pages.addPet.heroText, letterSpacing: -0.5, lineHeight: 31, marginBottom: 8, maxWidth: 300 },
  heroSub: { fontSize: 14, fontWeight: '500', color: theme.pages.addPet.successBackground, lineHeight: 20, maxWidth: 280 },
});
