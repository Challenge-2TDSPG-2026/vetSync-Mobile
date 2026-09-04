import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { ESPECIES } from '../../constants';
import { AppIcon } from '../../components/AppIcon';

const C = {
  g800: '#0e3326', g600: '#1a7a52', g100: '#d4f2e4',
  cream: '#fafaf8', w50: '#f9f7f4', text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  info: '#2563eb',
};

export default function PacientesScreen() {
  const router = useRouter();
  const { pacientes, carregando } = useVet();
  const [busca, setBusca] = useState('');

  const pacientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return pacientes;
    return pacientes.filter(p => p.pet.nome.toLowerCase().includes(termo) || p.pet.raca.toLowerCase().includes(termo));
  }, [pacientes, busca]);

  return (
    <View style={s.container}>
      <View style={s.buscaBar}>
        <AppIcon name="search-outline" set="Ionicons" size={16} color={C.muted} />
        <TextInput
          style={s.buscaInput}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por nome ou raça"
          placeholderTextColor={C.muted}
        />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {carregando ? (
          <View style={s.empty}><ActivityIndicator color={C.g600} /></View>
        ) : pacientesFiltrados.length === 0 ? (
          <View style={s.empty}>
            <AppIcon name="paw" set="MaterialCommunityIcons" size={40} color={C.muted} style={{ marginBottom: 12 }} />
            <Text style={s.emptyTitle}>Nenhum paciente encontrado</Text>
            <Text style={s.emptySub}>
              {busca ? 'Tente outro termo de busca.' : 'Pacientes aparecem aqui assim que um tutor solicita um evento com você.'}
            </Text>
          </View>
        ) : (
          pacientesFiltrados.map(({ pet, eventos }) => {
            const especieInfo = ESPECIES.find(e => e.valor === pet.especie);
            const emAberto = eventos.filter(e => e.status === 'AGENDADO').length;
            return (
              <Pressable key={pet.id} style={s.card} onPress={() => router.push(`/paciente/${pet.id}`)}>
                <View style={s.avatar}>
                  <AppIcon
                    name={especieInfo?.icon ?? 'paw'}
                    set={especieInfo?.iconSet ?? 'MaterialCommunityIcons'}
                    size={20}
                    color={C.g600}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.nome}>{pet.nome}</Text>
                  <Text style={s.detalhe}>{especieInfo?.label}{pet.raca ? ` • ${pet.raca}` : ''}</Text>
                </View>
                <View style={s.contagem}>
                  <Text style={s.contagemNumero}>{eventos.length}</Text>
                  <Text style={s.contagemLabel}>eventos</Text>
                </View>
                {emAberto > 0 && (
                  <View style={s.badgeAberto}>
                    <Text style={s.badgeAbertoText}>{emAberto}</Text>
                  </View>
                )}
                <AppIcon name="chevron-forward" set="Ionicons" size={18} color={C.muted} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  buscaBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 10,
  },
  buscaInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 4 },

  content: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', paddingHorizontal: 20 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.g100, justifyContent: 'center', alignItems: 'center' },
  nome: { fontSize: 14, fontWeight: '700', color: C.text },
  detalhe: { fontSize: 12, color: C.muted, marginTop: 2 },
  contagem: { alignItems: 'center', marginRight: 6 },
  contagemNumero: { fontSize: 15, fontWeight: '700', color: C.text },
  contagemLabel: { fontSize: 9, color: C.muted, fontWeight: '600' },
  badgeAberto: {
    backgroundColor: C.info, borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 5,
    justifyContent: 'center', alignItems: 'center', marginRight: 4,
  },
  badgeAbertoText: { color: C.white, fontSize: 10, fontWeight: '700' },
});