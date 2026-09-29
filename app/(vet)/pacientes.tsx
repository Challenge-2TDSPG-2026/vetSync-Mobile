import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVet } from '../../context/VetContext';
import { useTheme } from '../../context/ThemeContext';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { EmptyState } from '../../components/ui/EmptyState';
import type { AppTheme } from '../../constants/theme';

type Filtro = 'todos' | 'pendentes' | 'atendidos';

export default function VetPacientesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const { pacientes, carregando } = useVet();
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const pacientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase();
    return pacientes.filter(({ pet, eventos }) => {
      const correspondeBusca = !termo
        || pet.nome.toLocaleLowerCase().includes(termo)
        || pet.raca.toLocaleLowerCase().includes(termo)
        || pet.tutor?.nome?.toLocaleLowerCase().includes(termo);
      const temPendente = eventos.some(evento => evento.status === 'AGENDADO');
      const correspondeFiltro = filtro === 'todos' || (filtro === 'pendentes' && temPendente) || (filtro === 'atendidos' && !temPendente);
      return correspondeBusca && correspondeFiltro;
    });
  }, [busca, filtro, pacientes]);

  if (carregando) {
    return <View style={s.loading}><ActivityIndicator color={theme.colors.primary} /><Text style={s.loadingText}>Carregando pacientes...</Text></View>;
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
    >
      <Text style={s.title}>Pacientes</Text>
      <Text style={s.subtitle}>Busque pelo pet, tutor ou raça e acompanhe pendências de retorno.</Text>
      <View style={s.search}>
        <Ionicons name="search-outline" size={19} color={theme.colors.textSecondary} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar paciente ou tutor"
          placeholderTextColor={theme.colors.textMuted}
          style={s.searchInput}
          accessibilityLabel="Buscar pacientes"
        />
        {busca ? <Pressable onPress={() => setBusca('')} accessibilityLabel="Limpar busca"><Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} /></Pressable> : null}
      </View>
      <View style={s.filters}>
        {([
          ['todos', 'Todos'],
          ['pendentes', 'Com pendência'],
          ['atendidos', 'Sem pendência'],
        ] as const).map(([valor, label]) => (
          <Pressable key={valor} onPress={() => setFiltro(valor)} style={[s.filter, filtro === valor && s.filterActive]} accessibilityRole="button">
            <Text style={[s.filterText, filtro === valor && s.filterTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.count}>{pacientesFiltrados.length} {pacientesFiltrados.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}</Text>
      {pacientesFiltrados.length === 0 ? (
        <EmptyState icon="paw-outline" title="Nenhum paciente encontrado" subtitle="Tente mudar a busca ou o filtro." accentColor={theme.colors.primary} />
      ) : pacientesFiltrados.map(({ pet, eventos }) => {
        const pendentes = eventos.filter(evento => evento.status === 'AGENDADO').length;
        const ultimo = eventos.find(evento => evento.status === 'CONCLUIDO');
        return (
          <Pressable key={pet.id} style={s.card} onPress={() => router.push(`/paciente/${pet.id}`)} accessibilityRole="button" accessibilityLabel={`Abrir ficha de ${pet.nome}`}>
            <View style={s.avatar}><Ionicons name="paw" size={21} color={theme.colors.primary} /></View>
            <View style={s.cardBody}>
              <Text style={s.petName}>{pet.nome}</Text>
              <Text style={s.meta}>{pet.raca || pet.especie} {pet.tutor?.nome ? `• ${pet.tutor.nome}` : ''}</Text>
              <Text style={s.history}>{ultimo ? `Último atendimento: ${new Date(ultimo.data).toLocaleDateString('pt-BR')}` : 'Sem atendimento concluído'}</Text>
            </View>
            {pendentes > 0 ? <View style={s.pending}><Text style={s.pendingText}>{pendentes}</Text><Text style={s.pendingLabel}>pend.</Text></View> : null}
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, gap: 10 },
  loadingText: { color: theme.colors.textSecondary },
  title: { fontSize: 25, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 5, marginBottom: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: theme.pages.vetPatients.searchField.background, borderWidth: 1, borderColor: theme.pages.vetPatients.searchField.border, borderRadius: 12, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 14 },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  filter: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.pages.vetPatients.filterChip.border, backgroundColor: theme.pages.vetPatients.filterChip.background },
  filterActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: theme.colors.onPrimary },
  count: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 9 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: theme.pages.vetPatients.patientCard.background, borderWidth: 1, borderColor: theme.pages.vetPatients.patientCard.border, borderRadius: 14, padding: 14, marginBottom: 9 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.successBackground, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  petName: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
  meta: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 3 },
  history: { color: theme.colors.textMuted, fontSize: 11, marginTop: 5 },
  pending: { alignItems: 'center', backgroundColor: theme.colors.warningBackground, borderRadius: 8, minWidth: 38, paddingVertical: 4 },
  pendingText: { color: theme.colors.warning, fontWeight: '800', fontSize: 14 },
  pendingLabel: { color: theme.colors.warning, fontSize: 9, fontWeight: '700' },
});
