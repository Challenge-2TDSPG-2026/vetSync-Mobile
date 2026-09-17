import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePet } from '../context/PetContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { AppIcon } from './AppIcon';
import { ESPECIES } from '../constants';

const C = {
  g600: '#1a7a52', g500: '#22a06b',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff', w50: '#f9f7f4',
};

export function PetSwitcher() {
  const router = useRouter();
  const { pets, petAtivoId, selecionarPet } = usePet();
  const { modoSimples } = useAccessibility();

  if (pets.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.container}
      contentContainerStyle={s.content}
    >
      {pets.map(p => {
        const especieInfo = ESPECIES.find(e => e.valor === p.especie);
        const ativo = p.id === petAtivoId;
        return (
          <Pressable
            key={p.id}
            style={[s.chip, modoSimples && sSimples.chip, ativo && s.chipAtivo]}
            onPress={() => selecionarPet(p.id)}
          >
            <AppIcon
              name={especieInfo?.icon ?? 'paw'}
              set={especieInfo?.iconSet ?? 'MaterialCommunityIcons'}
              size={modoSimples ? 27 : 20}
              color={ativo ? C.white : C.muted}
            />
            <Text style={[s.chipText, modoSimples && sSimples.chipText, ativo && s.chipTextAtivo]} numberOfLines={1}>
              {p.nome}
            </Text>
          </Pressable>
        );
      })}
      <Pressable style={[s.addBtn, modoSimples && sSimples.chip]} onPress={() => router.push('/add-pet')}>
        <AppIcon name="add" set="Ionicons" size={modoSimples ? 27 : 20} color={C.g600} />
        <Text style={[s.addBtnText, modoSimples && sSimples.chipText]}>Novo pet</Text>
      </Pressable>
    </ScrollView>
  );
}

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
const s = StyleSheet.create({
  container: { flexGrow: 0, marginBottom: 16 },
  content: { gap: 10, paddingRight: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22,
    backgroundColor: C.w50, borderWidth: 1.5, borderColor: C.border,
    maxWidth: 180,
  },
  chipAtivo: { backgroundColor: C.g600, borderColor: C.g600 },
  chipText: { fontSize: 15, fontWeight: '600', color: C.text },
  chipTextAtivo: { color: C.white },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22,
    borderWidth: 1.5, borderColor: C.g500, borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: C.g600 },
});

/** Modo simples: ~35% maior que o padrão. */
const sSimples = StyleSheet.create({
  chip: { paddingHorizontal: 22, paddingVertical: 16, maxWidth: 230 },
  chipText: { fontSize: 20 },
});