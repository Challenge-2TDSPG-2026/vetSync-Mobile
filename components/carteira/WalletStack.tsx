import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Pet } from '../../types';
import { ESPECIES } from '../../constants';
import { AppIcon } from '../AppIcon';
import { useAccessibility } from '../../context/AccessibilityContext';

const C = { green700: '#155c3f', green100: '#d4f2e4', white: '#ffffff', text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da' };

type Props = { pets: Pet[]; petAtivoId?: string | null; onSelecionar: (pet: Pet) => void; onTrocarPetAtivo?: (petId: string) => void };

function descricaoPet(pet: Pet) {
  const especie = ESPECIES.find(item => item.valor === pet.especie);
  return `${especie?.label ?? 'Espécie não informada'}${pet.raca ? ` · ${pet.raca}` : ''}`;
}

/** Lista de passes: evita carrossel horizontal dentro da tela de perfil. */
export function WalletStack({ pets, petAtivoId, onSelecionar, onTrocarPetAtivo }: Props) {
  const { modoSimples } = useAccessibility();
  if (pets.length === 0) return null;
  return <View style={s.container} accessibilityLabel="Carteiras de vacinação dos pets">
    {pets.map((pet, index) => {
      const especie = ESPECIES.find(item => item.valor === pet.especie);
      const ativo = pet.id === petAtivoId;
      return <Pressable key={pet.id} onPress={() => { onTrocarPetAtivo?.(pet.id); onSelecionar(pet); }} accessibilityRole="button" accessibilityLabel={`Abrir carteira de vacinação de ${pet.nome}`} style={({ pressed }) => [s.pass, modoSimples && sSimples.pass, ativo && s.passAtivo, pressed && s.pressed]}>
        <View style={[s.iconBox, modoSimples && sSimples.iconBox]}><AppIcon name={especie?.icon ?? 'paw'} set={especie?.iconSet ?? 'MaterialCommunityIcons'} size={modoSimples ? 34 : 26} color={C.green700} /></View>
        <View style={s.info}>
          <View style={s.nameLine}><Text style={[s.name, modoSimples && sSimples.name]} numberOfLines={1}>{pet.nome}</Text>{ativo && <Text style={s.activeBadge}>Ativa</Text>}</View>
          <Text style={[s.meta, modoSimples && sSimples.meta]} numberOfLines={1}>{descricaoPet(pet)}</Text>
          {!modoSimples && <Text style={s.document}>Carteira de vacinação digital</Text>}
        </View>
        <View style={s.action}><Text style={[s.actionText, modoSimples && sSimples.actionText]}>Ver</Text><Ionicons name="chevron-forward" size={modoSimples ? 26 : 20} color={C.green700} /></View>
        {!modoSimples && <Text style={s.index}>{String(index + 1).padStart(2, '0')}</Text>}
      </Pressable>;
    })}
  </View>;
}

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
const s = StyleSheet.create({
  container: { gap: 12, marginBottom: 20 },
  pass: { minHeight: 116, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 18, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  passAtivo: { borderColor: '#8bd4ae', backgroundColor: '#f4fcf7' },
  pressed: { opacity: 0.8 },
  iconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green100, marginRight: 14 },
  info: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: C.text, fontSize: 19, fontWeight: '800', flexShrink: 1 },
  activeBadge: { color: C.green700, backgroundColor: C.green100, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, fontSize: 11, fontWeight: '800' },
  meta: { color: C.muted, fontSize: 14, marginTop: 4 },
  document: { color: C.green700, textTransform: 'uppercase', letterSpacing: 0.45, fontWeight: '800', fontSize: 10, marginTop: 9 },
  action: { flexDirection: 'row', alignItems: 'center', marginLeft: 9 },
  actionText: { color: C.green700, fontSize: 14, fontWeight: '800' },
  index: { position: 'absolute', right: 16, top: 11, color: '#b6c5bc', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});

/** Modo simples: ~35% maior que o padrão, sem os detalhes decorativos menores (índice/legenda). */
const sSimples = StyleSheet.create({
  pass: { minHeight: 156, padding: 24 },
  iconBox: { width: 75, height: 75, borderRadius: 38 },
  name: { fontSize: 26 },
  meta: { fontSize: 19, marginTop: 5 },
  actionText: { fontSize: 19 },
});