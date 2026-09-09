import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Pet } from '../../types';
import { ESPECIES } from '../../constants';
import { AppIcon } from '../AppIcon';

const C = { green700: '#155c3f', green100: '#d4f2e4', white: '#ffffff', text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da' };

type Props = { pets: Pet[]; petAtivoId?: string | null; onSelecionar: (pet: Pet) => void; onTrocarPetAtivo?: (petId: string) => void };

function descricaoPet(pet: Pet) {
  const especie = ESPECIES.find(item => item.valor === pet.especie);
  return `${especie?.label ?? 'Espécie não informada'}${pet.raca ? ` · ${pet.raca}` : ''}`;
}

/** Lista de passes: evita carrossel horizontal dentro da tela de perfil. */
export function WalletStack({ pets, petAtivoId, onSelecionar, onTrocarPetAtivo }: Props) {
  if (pets.length === 0) return null;
  return <View style={s.container} accessibilityLabel="Carteiras de vacinação dos pets">
    {pets.map((pet, index) => {
      const especie = ESPECIES.find(item => item.valor === pet.especie);
      const ativo = pet.id === petAtivoId;
      return <Pressable key={pet.id} onPress={() => { onTrocarPetAtivo?.(pet.id); onSelecionar(pet); }} accessibilityRole="button" accessibilityLabel={`Abrir carteira de vacinação de ${pet.nome}`} style={({ pressed }) => [s.pass, ativo && s.passAtivo, pressed && s.pressed]}>
        <View style={s.iconBox}><AppIcon name={especie?.icon ?? 'paw'} set={especie?.iconSet ?? 'MaterialCommunityIcons'} size={21} color={C.green700} /></View>
        <View style={s.info}><View style={s.nameLine}><Text style={s.name} numberOfLines={1}>{pet.nome}</Text>{ativo && <Text style={s.activeBadge}>Ativa</Text>}</View><Text style={s.meta} numberOfLines={1}>{descricaoPet(pet)}</Text><Text style={s.document}>Carteira de vacinação digital</Text></View>
        <View style={s.action}><Text style={s.actionText}>Ver</Text><Ionicons name="chevron-forward" size={17} color={C.green700} /></View>
        <Text style={s.index}>{String(index + 1).padStart(2, '0')}</Text>
      </Pressable>;
    })}
  </View>;
}

const s = StyleSheet.create({
  container: { gap: 10, marginBottom: 18 }, pass: { minHeight: 100, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }, passAtivo: { borderColor: '#8bd4ae', backgroundColor: '#f4fcf7' }, pressed: { opacity: 0.8 },
  iconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green100, marginRight: 12 }, info: { flex: 1, minWidth: 0 }, nameLine: { flexDirection: 'row', alignItems: 'center', gap: 7 }, name: { color: C.text, fontSize: 16, fontWeight: '800', flexShrink: 1 }, activeBadge: { color: C.green700, backgroundColor: C.green100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, fontSize: 10, fontWeight: '800' }, meta: { color: C.muted, fontSize: 11, marginTop: 3 }, document: { color: C.green700, textTransform: 'uppercase', letterSpacing: 0.45, fontWeight: '800', fontSize: 9, marginTop: 8 }, action: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 }, actionText: { color: C.green700, fontSize: 12, fontWeight: '800' }, index: { position: 'absolute', right: 14, top: 9, color: '#b6c5bc', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
});
