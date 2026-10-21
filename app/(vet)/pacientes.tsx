import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVet } from '../../context/VetContext';
import { useTheme } from '../../context/ThemeContext';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { EmptyState } from '../../components/ui/EmptyState';
import type { AppTheme } from '../../constants/theme';
import { VetPageIntro } from '../../components/vet/VetPageIntro';

type Filtro = 'todos' | 'pendentes' | 'atendidos';
type Ordenacao = 'recentes' | 'nome' | 'pendencias';
type PeriodoAtendimento = 'qualquer' | '30dias' | '90dias' | 'semHistorico';

export default function VetPacientesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const { pacientes, carregando } = useVet();
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recentes');
  const [especie, setEspecie] = useState('todas');
  const [raca, setRaca] = useState('');
  const [periodoAtendimento, setPeriodoAtendimento] = useState<PeriodoAtendimento>('qualquer');
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setAgora(Date.now()), 0);
    return () => clearTimeout(timeout);
  }, []);

  const pacientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase();
    const filtrados = pacientes.filter(({ pet, eventos }) => {
      const correspondeBusca = !termo
        || pet.nome.toLocaleLowerCase().includes(termo)
        || pet.raca.toLocaleLowerCase().includes(termo)
        || pet.especie.toLocaleLowerCase().includes(termo)
        || pet.tutor?.nome?.toLocaleLowerCase().includes(termo)
        || (!!termo.replace(/\D/g, '') && !!pet.tutor?.telefone?.replace(/\D/g, '').includes(termo.replace(/\D/g, '')));
      const temPendente = eventos.some(evento => evento.status === 'AGENDADO');
      const correspondeFiltro = filtro === 'todos' || (filtro === 'pendentes' && temPendente) || (filtro === 'atendidos' && !temPendente);
      const correspondeEspecie = especie === 'todas' || pet.especie === especie;
      const correspondeRaca = !raca.trim() || pet.raca.toLocaleLowerCase().includes(raca.trim().toLocaleLowerCase());
      const ultimaData = eventos.filter(e => e.status === 'CONCLUIDO').reduce((max, e) => Math.max(max, new Date(e.data).getTime()), 0);
      const diasDesde = ultimaData && agora !== null ? (agora - ultimaData) / 86_400_000 : null;
      const correspondePeriodo = agora === null || periodoAtendimento === 'qualquer'
        || (periodoAtendimento === 'semHistorico' && diasDesde === null)
        || (periodoAtendimento === '30dias' && diasDesde !== null && diasDesde <= 30)
        || (periodoAtendimento === '90dias' && diasDesde !== null && diasDesde <= 90);
      return correspondeBusca && correspondeFiltro && correspondeEspecie && correspondeRaca && correspondePeriodo;
    });
    return filtrados.sort((a, b) => {
      if (ordenacao === 'nome') return a.pet.nome.localeCompare(b.pet.nome, 'pt-BR');
      if (ordenacao === 'pendencias') return b.eventos.filter(e => e.status === 'AGENDADO').length - a.eventos.filter(e => e.status === 'AGENDADO').length;
      const maisRecente = (eventos: typeof a.eventos) => eventos.reduce((max, evento) => Math.max(max, new Date(evento.data).getTime()), 0);
      return maisRecente(b.eventos) - maisRecente(a.eventos);
    });
  }, [agora, busca, especie, filtro, ordenacao, pacientes, periodoAtendimento, raca]);

  if (carregando) {
    return <View style={s.loading}><ActivityIndicator color={theme.colors.primary} /><Text style={s.loadingText}>Carregando pacientes...</Text></View>;
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
    >
      <VetPageIntro eyebrow="CUIDADO CONTÃNUO" title="Seus pacientes" description="Encontre rapidamente os pets da sua clÃ­nica e acompanhe os retornos." icon="paw-outline" />
      <View style={s.search}>
        <Ionicons name="search-outline" size={19} color={theme.colors.textSecondary} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar pet, tutor, espÃ©cie ou telefone"
          placeholderTextColor={theme.colors.textMuted}
          style={s.searchInput}
          accessibilityLabel="Buscar pacientes"
        />
        {busca ? <Pressable onPress={() => setBusca('')} accessibilityLabel="Limpar busca"><Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} /></Pressable> : null}
      </View>
      <View style={s.filters}>
        {([
          ['todos', 'Todos'],
          ['pendentes', 'Com pendÃªncia'],
          ['atendidos', 'Sem pendÃªncia'],
        ] as const).map(([valor, label]) => (
          <Pressable key={valor} onPress={() => setFiltro(valor)} style={[s.filter, filtro === valor && s.filterActive]} accessibilityRole="button">
            <Text style={[s.filterText, filtro === valor && s.filterTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.advancedFilters}>
        <Text style={s.advancedLabel}>Espécie</Text>
        <View style={s.advancedOptions}>
          {(['todas', ...new Set(pacientes.map(p => p.pet.especie))]).map(valor => (
            <Pressable key={valor} onPress={() => setEspecie(valor)} style={[s.advancedChip, especie === valor && s.advancedChipActive]} accessibilityRole="button" accessibilityState={{ selected: especie === valor }}>
              <Text style={[s.advancedChipText, especie === valor && s.advancedChipTextActive]}>{valor === 'todas' ? 'Todas' : valor}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={raca} onChangeText={setRaca} placeholder="Filtrar por raça" placeholderTextColor={theme.colors.textMuted} style={s.racaInput} accessibilityLabel="Filtrar pacientes por raça" />
        <Text style={s.advancedLabel}>Último atendimento</Text>
        <View style={s.advancedOptions}>
          {([['qualquer', 'Qualquer período'], ['30dias', 'Até 30 dias'], ['90dias', 'Até 90 dias'], ['semHistorico', 'Sem histórico']] as const).map(([valor, label]) => (
            <Pressable key={valor} onPress={() => setPeriodoAtendimento(valor)} style={[s.advancedChip, periodoAtendimento === valor && s.advancedChipActive]} accessibilityRole="button" accessibilityState={{ selected: periodoAtendimento === valor }}>
              <Text style={[s.advancedChipText, periodoAtendimento === valor && s.advancedChipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.sortRow}>
        <Text style={s.count}>Ordenar:</Text>
        {([['recentes', 'Recentes'], ['nome', 'Nome'], ['pendencias', 'Pendências']] as const).map(([valor, label]) => (
          <Pressable key={valor} onPress={() => setOrdenacao(valor)} style={[s.sortChip, ordenacao === valor && s.sortChipActive]} accessibilityRole="button" accessibilityState={{ selected: ordenacao === valor }}>
            <Text style={[s.sortText, ordenacao === valor && s.sortTextActive]}>{label}</Text>
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
              <Text style={s.meta}>{pet.raca || pet.especie} {pet.tutor?.nome ? `â€¢ ${pet.tutor.nome}` : ''}</Text>
              {pet.tutor?.telefone ? <Text style={s.meta}>Tutor: {pet.tutor.telefone}</Text> : null}
              <Text style={s.history}>{ultimo ? `Ãšltimo atendimento: ${new Date(ultimo.data).toLocaleDateString('pt-BR')}` : 'Sem atendimento concluÃ­do'}</Text>
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
  content: { padding: 20, paddingBottom: 44 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, gap: 10 },
  loadingText: { color: theme.colors.textSecondary },
  title: { fontSize: 25, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 5, marginBottom: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.pages.vetPatients.searchField.background, borderWidth: 1, borderColor: theme.pages.vetPatients.searchField.border, borderRadius: 15, paddingHorizontal: 15, height: 52, elevation: 1 },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 14 },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 16, flexWrap: 'wrap' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  sortChip: { minHeight: 44, justifyContent: 'center', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: theme.pages.vetPatients.filterChip.border, backgroundColor: theme.pages.vetPatients.filterChip.background },
  sortChipActive: { backgroundColor: theme.colors.infoBackground, borderColor: theme.colors.info },
  sortText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700' },
  sortTextActive: { color: theme.colors.info },
  advancedFilters: { padding: 13, borderRadius: 14, borderWidth: 1, borderColor: theme.pages.vetPatients.filterChip.border, backgroundColor: theme.pages.vetPatients.patientCard.background, marginBottom: 14, gap: 8 },
  advancedLabel: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  advancedOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  advancedChip: { minHeight: 44, justifyContent: 'center', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: theme.pages.vetPatients.filterChip.border },
  advancedChipActive: { backgroundColor: theme.colors.infoBackground, borderColor: theme.colors.info },
  advancedChipText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  advancedChipTextActive: { color: theme.colors.info },
  racaInput: { minHeight: 44, borderWidth: 1, borderColor: theme.pages.vetPatients.filterChip.border, borderRadius: 10, paddingHorizontal: 11, color: theme.colors.text, fontSize: 13 },
  filter: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.pages.vetPatients.filterChip.border, backgroundColor: theme.pages.vetPatients.filterChip.background },
  filterActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: theme.colors.onPrimary },
  count: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 9 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.pages.vetPatients.patientCard.background, borderWidth: 1, borderColor: theme.pages.vetPatients.patientCard.border, borderRadius: 18, padding: 15, marginBottom: 11, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 17, backgroundColor: theme.colors.successBackground, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  petName: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
  meta: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 3 },
  history: { color: theme.colors.textMuted, fontSize: 11, marginTop: 5 },
  pending: { alignItems: 'center', backgroundColor: theme.colors.warningBackground, borderRadius: 8, minWidth: 38, paddingVertical: 4 },
  pendingText: { color: theme.colors.warning, fontWeight: '800', fontSize: 14 },
  pendingLabel: { color: theme.colors.warning, fontSize: 9, fontWeight: '700' },
});
