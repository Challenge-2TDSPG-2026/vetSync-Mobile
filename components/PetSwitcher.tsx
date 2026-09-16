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
  const { modoIdoso } = useAccessibility();

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
            style={[s.chip, modoIdoso && sIdoso.chip, ativo && s.chipAtivo]}
            onPress={() => selecionarPet(p.id)}
          >
            <AppIcon
              name={especieInfo?.icon ?? 'paw'}
              set={especieInfo?.iconSet ?? 'MaterialCommunityIcons'}
              size={modoIdoso ? 20 : 16}
              color={ativo ? C.white : C.muted}
            />
            <Text style={[s.chipText, modoIdoso && sIdoso.chipText, ativo && s.chipTextAtivo]} numberOfLines={1}>
              {p.nome}
            </Text>
          </Pressable>
        );
      })}
      <Pressable style={[s.addBtn, modoIdoso && sIdoso.chip]} onPress={() => router.push('/add-pet')}>
        <AppIcon name="add" set="Ionicons" size={modoIdoso ? 20 : 16} color={C.g600} />
        <Text style={[s.addBtnText, modoIdoso && sIdoso.chipText]}>Novo pet</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 0, marginBottom: 14 },
  content: { gap: 8, paddingRight: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.w50, borderWidth: 1.5, borderColor: C.border,
    maxWidth: 140,
  },
  chipAtivo: { backgroundColor: C.g600, borderColor: C.g600 },
  chipText: { fontSize: 12, fontWeight: '600', color: C.text },
  chipTextAtivo: { color: C.white },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.g500, borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: C.g600 },
});

/** Overrides do modo idoso: chips maiores, com maior alvo de toque, mesmo maxWidth relativo. */
const sIdoso = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 12, maxWidth: 180 },
  chipText: { fontSize: 15 },
});