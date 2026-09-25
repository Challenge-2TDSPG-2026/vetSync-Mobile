import React, { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Pet } from '../../types';
import { ESPECIES } from '../../constants';
import { AppIcon } from '../AppIcon';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

type Props = { pets: Pet[]; petAtivoId?: string | null; onSelecionar: (pet: Pet) => void; onTrocarPetAtivo?: (petId: string) => void };

function descricaoPet(pet: Pet) {
  const especie = ESPECIES.find(item => item.valor === pet.especie);
  return `${especie?.label ?? 'Espécie não informada'}${pet.raca ? ` · ${pet.raca}` : ''}`;
}

type CartaoProps = { pet: Pet; indice: number; ativo: boolean; simples: boolean; ampliado?: boolean; onPress: () => void };

function CartaoCarteira({ pet, indice, ativo, simples, ampliado = false, onPress }: CartaoProps) {
  const especie = ESPECIES.find(item => item.valor === pet.especie);
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  return <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${ampliado ? 'Abrir' : 'Selecionar'} carteira de vacinação de ${pet.nome}`}
    style={({ pressed }) => [s.cartao, ampliado && s.cartaoAmpliado, simples && sSimples.cartao, ativo && s.cartaoAtivo, indice === 1 && s.cartaoAzul, pressed && s.pressed]}
  >
    <View pointerEvents="none" style={s.orbe} />
    <View style={s.cartaoCabecalho}>
      <Text style={s.cartaoRotulo}>Carteira de vacinação</Text>
      <Text style={s.cartaoIndice}>{String(indice + 1).padStart(2, '0')}</Text>
    </View>
    <View style={s.cartaoConteudo}>
      <View style={[s.cartaoIcone, simples && sSimples.cartaoIcone]}>
        <AppIcon name={especie?.icon ?? 'paw'} set={especie?.iconSet ?? 'MaterialCommunityIcons'} size={simples ? 31 : 24} color={theme.colors.primary} />
      </View>
      <View style={s.cartaoInfo}>
        <Text style={[s.cartaoNome, simples && sSimples.cartaoNome]} numberOfLines={1}>{pet.nome}</Text>
        <Text style={[s.cartaoMeta, simples && sSimples.cartaoMeta]} numberOfLines={1}>{descricaoPet(pet)}</Text>
      </View>
    </View>
    <View style={s.cartaoRodape}>
      <View style={s.seloDigital}><Ionicons name="shield-checkmark" size={14} color={theme.colors.onNavigation} /><Text style={s.seloDigitalTexto}>Documento digital</Text></View>
      {ativo && <View style={s.seloAtivo}><Text style={s.seloAtivoTexto}>Ativa</Text></View>}
    </View>
  </Pressable>;
}

export function WalletStack({ pets, petAtivoId, onSelecionar, onTrocarPetAtivo }: Props) {
  const { modoSimples } = useAccessibility();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [indiceFrontal, setIndiceFrontal] = useState(() => Math.max(0, pets.findIndex(pet => pet.id === petAtivoId)));
  const [seletorAberto, setSeletorAberto] = useState(false);

  useEffect(() => {
    const indiceAtivo = pets.findIndex(pet => pet.id === petAtivoId);
    if (indiceAtivo >= 0) setIndiceFrontal(indiceAtivo);
  }, [petAtivoId, pets]);

  const carteirasOrdenadas = useMemo(
    () => pets.map((_, indice) => pets[(indiceFrontal + indice) % pets.length]),
    [indiceFrontal, pets],
  );
  const carteirasNaPilha = carteirasOrdenadas.slice(0, 3);

  if (pets.length === 0) return null;

  function colocarNaFrente(pet: Pet) {
    const proximoIndice = pets.findIndex(item => item.id === pet.id);
    if (proximoIndice < 0 || proximoIndice === indiceFrontal) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIndiceFrontal(proximoIndice);
  }

  function trocarCarteira(pet: Pet) {
    colocarNaFrente(pet);
    onTrocarPetAtivo?.(pet.id);
  }

  function abrirDetalhes(pet: Pet) {
    colocarNaFrente(pet);
    setSeletorAberto(false);
    onSelecionar(pet);
  }

  const alturaPilha = (modoSimples ? 188 : 148) + Math.min(carteirasNaPilha.length - 1, 2) * 15;

  return <>
    <View style={[s.pilha, { height: alturaPilha }]} accessibilityLabel="Carteiras de vacinação dos pets">
      {carteirasNaPilha.map((pet, profundidade) => {
        const cartaFrontal = profundidade === 0;
        const deslocamentoVertical = (carteirasNaPilha.length - 1 - profundidade) * 15;
        return <View key={pet.id} style={[s.camada, { top: deslocamentoVertical, left: profundidade * 5, right: profundidade * 5, zIndex: 10 - profundidade, transform: [{ scale: 1 - profundidade * 0.025 }] }]}>
          <CartaoCarteira
            pet={pet}
            indice={pets.findIndex(item => item.id === pet.id)}
            ativo={pet.id === petAtivoId}
            simples={modoSimples}
            onPress={() => cartaFrontal ? setSeletorAberto(true) : trocarCarteira(pet)}
          />
        </View>;
      })}
    </View>
    <Text style={[s.ajuda, modoSimples && sSimples.ajuda]}>{pets.length > 1 ? 'Toque na carteira principal para ver e escolher outra.' : 'Toque na carteira para ver os detalhes.'}</Text>

    <Modal visible={seletorAberto} transparent animationType="fade" onRequestClose={() => setSeletorAberto(false)} statusBarTranslucent>
      <View style={s.modalFundo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSeletorAberto(false)} accessibilityLabel="Fechar seleção de carteiras" />
        <View style={s.modalConteudo} accessibilityViewIsModal>
          <View style={s.modalAlca} />
          <View style={s.modalCabecalho}>
            <View><Text style={s.modalRotulo}>Carteiras digitais</Text><Text style={[s.modalTitulo, modoSimples && sSimples.modalTitulo]}>Escolha uma carteira</Text></View>
            <Pressable style={[s.modalFechar, modoSimples && sSimples.modalFechar]} onPress={() => setSeletorAberto(false)} hitSlop={10} accessibilityLabel="Fechar"><Ionicons name="close" size={modoSimples ? 33 : 24} color={theme.colors.text} /></Pressable>
          </View>
          <Text style={[s.modalDescricao, modoSimples && sSimples.modalDescricao]}>Toque na carteira do pet para consultar a carteira de vacinação.</Text>
          <ScrollView contentContainerStyle={s.modalLista} showsVerticalScrollIndicator={false}>
            {pets.map((pet, indice) => <CartaoCarteira key={pet.id} pet={pet} indice={indice} ativo={pet.id === petAtivoId} simples={modoSimples} ampliado onPress={() => abrirDetalhes(pet)} />)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  pilha: { marginBottom: 8, position: 'relative' },
  camada: { position: 'absolute' },
  cartao: { minHeight: 148, borderRadius: 20, padding: 17, overflow: 'hidden', backgroundColor: theme.colors.navigation, shadowColor: '#06150e', shadowOpacity: theme.mode === 'dark' ? 0 : 0.2, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  cartaoAmpliado: { minHeight: 164, marginBottom: 14 },
  cartaoAtivo: { backgroundColor: theme.colors.navigationAccent },
  cartaoAzul: { backgroundColor: theme.colors.info },
  pressed: { opacity: 0.86 },
  orbe: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.07)', right: -56, top: -82 },
  cartaoCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartaoRotulo: { color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9 },
  cartaoIndice: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  cartaoConteudo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingTop: 9 },
  cartaoIcone: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, marginRight: 12 },
  cartaoInfo: { flex: 1, minWidth: 0 },
  cartaoNome: { color: theme.colors.onNavigation, fontSize: 20, fontWeight: '800' },
  cartaoMeta: { color: 'rgba(255,255,255,0.74)', fontSize: 13, marginTop: 3 },
  cartaoRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seloDigital: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  seloDigitalTexto: { color: theme.colors.onNavigation, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.45 },
  seloAtivo: { backgroundColor: theme.colors.surfaceSubtle, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  seloAtivoTexto: { color: theme.colors.navigation, fontSize: 10, fontWeight: '800' },
  ajuda: { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 20 },
  modalFundo: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  modalConteudo: { maxHeight: '88%', minHeight: '55%', borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden', backgroundColor: theme.colors.surfaceElevated, borderWidth: theme.mode === 'dark' ? 1 : 0, borderColor: theme.colors.border },
  modalAlca: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10, backgroundColor: theme.colors.borderStrong },
  modalCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14 },
  modalRotulo: { color: theme.colors.primary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  modalTitulo: { color: theme.colors.text, fontSize: 23, fontWeight: '800', marginTop: 3 },
  modalFechar: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  modalDescricao: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18, marginHorizontal: 20, marginTop: 8 },
  modalLista: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 34 },
  });
}

const sSimples = StyleSheet.create({
  cartao: { minHeight: 188, padding: 22 },
  cartaoIcone: { width: 66, height: 66, borderRadius: 33 },
  cartaoNome: { fontSize: 27 },
  cartaoMeta: { fontSize: 18, marginTop: 4 },
  ajuda: { fontSize: 17, lineHeight: 23 },
  modalTitulo: { fontSize: 31 },
  modalDescricao: { fontSize: 18, lineHeight: 24 },
  modalFechar: { width: 58, height: 58, borderRadius: 29 },
});
