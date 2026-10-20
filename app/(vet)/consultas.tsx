import React, { useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { useTheme } from '../../context/ThemeContext';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { DicaTela } from '../../components/ui/DicaTela';
import { STATUS_EXIBICAO_BADGE, formatarDataHoraEvento, statusExibicao } from '../../utils/eventoStatus';
import { useConfirmarEvento, useRecusarEvento } from '../../hooks/useEventos';
import { mostrarToast } from '../../components/ui/Toast';
import { mensagemDeErro } from '../../services/api/errorMessages';
import { ETAPA_VISUAL, ehPendenteDeConfirmacao, formatarDataEHora } from '../../utils/solicitacao';
import type { Evento } from '../../types';
import type { AppTheme } from '../../constants/theme';
import { VetPageIntro } from '../../components/vet/VetPageIntro';
import { usePerfilSaudePet } from '../../hooks/useRelatorios';
import { parseDataEvento } from '../../utils/eventoStatus';

type FiltroAgenda = 'todas' | 'hoje' | 'proximas' | 'pendentes' | 'confirmadas' | 'semana';

export default function ConsultasScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { eventosAgendados, pacientes, carregando } = useVet();
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-consultas');

  const confirmar = useConfirmarEvento();
  const recusar = useRecusarEvento();
  const [recusando, setRecusando] = useState<Evento | null>(null);
  const [motivo, setMotivo] = useState('');
  const [inicioSemana, setInicioSemana] = useState(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0); hoje.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7)); return hoje;
  });
  const [etapasLocais, setEtapasLocais] = useState<Record<string, 'CHEGOU' | 'EM_ATENDIMENTO'>>({});
  React.useEffect(() => {
    AsyncStorage.getItem('@vetsync:etapas_atendimento_vet').then(raw => setEtapasLocais(raw ? JSON.parse(raw) : {})).catch(() => setEtapasLocais({}));
  }, []);
  async function avançarEtapa(eventoId: string, petId: string) {
    if (etapasLocais[eventoId] === 'EM_ATENDIMENTO') { router.push(`/paciente/${petId}`); return; }
    const novas = { ...etapasLocais, [eventoId]: etapasLocais[eventoId] === 'CHEGOU' ? 'EM_ATENDIMENTO' as const : 'CHEGOU' as const };
    setEtapasLocais(novas);
    try { await AsyncStorage.setItem('@vetsync:etapas_atendimento_vet', JSON.stringify(novas)); } catch { /* estado desta sessão continua disponível */ }
    if (novas[eventoId] === 'EM_ATENDIMENTO') router.push(`/paciente/${petId}`);
  }

  async function aoConfirmar(evento: Evento) {
    try {
      await confirmar.mutateAsync(evento.id);
      mostrarToast('sucesso', 'Agendamento confirmado', 'O tutor foi avisado.');
    } catch (e) {
      mostrarToast('erro', 'Não foi possível confirmar', mensagemDeErro(e, 'Tente novamente.'));
    }
  }

  async function aoRecusar() {
    if (!recusando) return;
    if (!motivo.trim()) {
      mostrarToast('erro', 'Informe o motivo', 'O tutor verá o motivo da recusa.');
      return;
    }
    try {
      await recusar.mutateAsync({ id: recusando.id, motivo: motivo.trim() });
      mostrarToast('sucesso', 'Agendamento recusado', 'O horário foi liberado e o tutor foi avisado.');
      setRecusando(null);
      setMotivo('');
    } catch (e) {
      mostrarToast('erro', 'Não foi possível recusar', mensagemDeErro(e, 'Tente novamente.'));
    }
  }

  const [filtroAgenda, setFiltroAgenda] = useState<FiltroAgenda>('todas');
  const [modoSemana, setModoSemana] = useState(false);
  const listaOrdenada = useMemo(() => {
    const inicioHoje = new Date(); inicioHoje.setHours(0, 0, 0, 0);
    const inicioAmanha = new Date(inicioHoje); inicioAmanha.setDate(inicioAmanha.getDate() + 1);
    return [...eventosAgendados]
      .filter(item => {
        const data = new Date(item.data);
        if (filtroAgenda === 'hoje') return data >= inicioHoje && data < inicioAmanha;
        if (filtroAgenda === 'proximas') return data >= inicioAmanha;
        if (filtroAgenda === 'pendentes') return ehPendenteDeConfirmacao(item);
        if (filtroAgenda === 'confirmadas') return !ehPendenteDeConfirmacao(item);
        if (filtroAgenda === 'semana' || modoSemana) {
          const fimSemana = new Date(inicioSemana); fimSemana.setDate(fimSemana.getDate() + 7);
          const dataSegura = parseDataEvento(item.data);
          return dataSegura >= inicioSemana && dataSegura < fimSemana;
        }
        return true;
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [eventosAgendados, filtroAgenda, inicioSemana, modoSemana]);

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} progressBackgroundColor={theme.pages.vetAppointments.card} />}
      >
        <VetPageIntro eyebrow="AGENDA CLÍNICA" title="Consultas" description="Acompanhe solicitações, confirme horários e acesse a ficha de cada paciente." icon="calendar-outline" />
        {dicaVisivel && (
          <DicaTela
            titulo="Suas consultas"
            texto="Veja aqui todas as consultas agendadas com você, ordenadas por data. Toque numa consulta pra ver os detalhes do paciente."
            accentColor={theme.colors.primary}
            onFechar={fecharDica}
          />
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtros} accessibilityLabel="Filtros da agenda">
          {([
            ['todas', 'Todas'], ['hoje', 'Hoje'], ['semana', 'Semana'], ['proximas', 'Próximas'], ['pendentes', 'Aguardando'], ['confirmadas', 'Confirmadas'],
          ] as const).map(([valor, label]) => (
            <Pressable key={valor} onPress={() => setFiltroAgenda(valor)} style={[s.filtro, filtroAgenda === valor && s.filtroAtivo]} accessibilityRole="button" accessibilityState={{ selected: filtroAgenda === valor }}>
              <Text style={[s.filtroTexto, filtroAgenda === valor && s.filtroTextoAtivo]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtroAgenda === 'semana' || modoSemana ? (
          <View style={s.semanaNav}>
            <Pressable onPress={() => setInicioSemana(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })} style={s.semanaNavBtn} accessibilityRole="button" accessibilityLabel="Semana anterior"><AppIcon name="chevron-back" set="Ionicons" color={theme.colors.primary} size={18} /></Pressable>
            <Text style={s.semanaNavLabel}>{inicioSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – {(() => { const fim = new Date(inicioSemana); fim.setDate(fim.getDate() + 6); return fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); })()}</Text>
            <Pressable onPress={() => setInicioSemana(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })} style={s.semanaNavBtn} accessibilityRole="button" accessibilityLabel="Próxima semana"><AppIcon name="chevron-forward" set="Ionicons" color={theme.colors.primary} size={18} /></Pressable>
          </View>
        ) : null}
        <Pressable style={s.modoSemanaBtn} onPress={() => { setModoSemana(v => !v); setFiltroAgenda('todas'); }} accessibilityRole="button" accessibilityState={{ selected: modoSemana }} accessibilityLabel={modoSemana ? 'Voltar para lista de consultas' : 'Ver agenda semanal'}>
          <AppIcon name={modoSemana ? 'list-outline' : 'calendar-outline'} set="Ionicons" size={17} color={theme.colors.primary} />
          <Text style={s.modoSemanaText}>{modoSemana ? 'Ver lista' : 'Ver semana'}</Text>
        </Pressable>

        {carregando ? (
          <SkeletonList linhas={4} />
        ) : listaOrdenada.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="Nenhuma consulta neste filtro"
            subtitle="Escolha outro período ou situação para ver os atendimentos."
            accentColor={theme.colors.primary}
          />
        ) : (
          listaOrdenada.map((item, index) => {
            const petResumo = pacientes.find(p => p.pet.id === item.petId);
            const dataItem = parseDataEvento(item.data);
            const dataAnterior = index > 0 ? parseDataEvento(listaOrdenada[index - 1].data) : null;
            const novoDia = !dataAnterior || dataAnterior.toDateString() !== dataItem.toDateString();
            const visual = obterVisualTipoEvento(item.nomeTipoEvento);
            const pendente = ehPendenteDeConfirmacao(item);
            const sb = pendente ? ETAPA_VISUAL.AGUARDANDO_CONFIRMACAO : STATUS_EXIBICAO_BADGE[statusExibicao(item)];
            const confirmandoEste = confirmar.isPending && confirmar.variables === item.id;
            return (
              <React.Fragment key={item.id}>
              {modoSemana || filtroAgenda === 'semana' ? (novoDia ? <Text style={s.diaSemanaLabel}>{dataItem.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</Text> : null) : null}
              <Pressable style={s.card} onPress={() => router.push(`/paciente/${item.petId}`)} accessibilityRole="button" accessibilityLabel={`${item.nomeTipoEvento}, paciente ${petResumo?.pet.nome ?? 'sem nome'}, ${item.hora ?? ''}. Abrir ficha`}>
                <View style={s.cardRow}>
                  <View style={[s.eventoIcone, { backgroundColor: visual.cor }]}>
                    <AppIcon name={visual.icon} set={visual.iconSet} size={18} color={theme.colors.onPrimary} />
                  </View>
                  <View style={s.eventoInfo}>
                    <Text style={s.eventoTitulo}>{item.nomeTipoEvento}</Text>
                    <Text style={s.petNomeResumo}>{petResumo?.pet.nome ?? 'Paciente'}{petResumo?.pet.tutor?.nome ? ` · tutor ${petResumo.pet.tutor.nome}` : ''}</Text>
                    <Text style={s.eventoMeta}>{item.hora ? formatarDataEHora(item.data, item.hora) : formatarDataHoraEvento(item.data)}</Text>
                    {item.observacao ? <Text style={s.eventoObs} numberOfLines={2}>{item.observacao}</Text> : null}
                    <ResumoPreConsulta petId={item.petId} habilitado={!!petResumo} styles={s} />
                  </View>
                </View>
                <View style={s.cardFooter}>
                  <View style={[s.badge, { backgroundColor: sb.bg }]}>
                    <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                  </View>
                  <View style={s.acoes}>
                    <Pressable style={s.btnEtapa} accessibilityRole="button" accessibilityLabel={etapasLocais[item.id] === 'EM_ATENDIMENTO' ? 'Abrir ficha do atendimento em andamento' : etapasLocais[item.id] === 'CHEGOU' ? 'Paciente chegou, toque para iniciar atendimento' : 'Marcar chegada do paciente'} onPress={() => void avançarEtapa(item.id, item.petId)}>
                      <Text style={s.btnEtapaText}>{etapasLocais[item.id] === 'EM_ATENDIMENTO' ? 'Abrir ficha' : etapasLocais[item.id] === 'CHEGOU' ? 'Chegou · iniciar' : 'Marcar chegada'}</Text>
                    </Pressable>
                    {pendente && (
                      <>
                        <Pressable
                          style={s.btnRecusar}
                          onPress={() => { setRecusando(item); setMotivo(''); }}
                          accessibilityRole="button"
                          accessibilityLabel={`Recusar agendamento de ${item.nomeTipoEvento}`}
                        >
                          <Text style={s.btnRecusarText}>Recusar</Text>
                        </Pressable>
                        <Pressable
                          style={[s.btnConfirmar, confirmandoEste && { opacity: 0.6 }]}
                          onPress={() => void aoConfirmar(item)}
                          disabled={confirmandoEste}
                          accessibilityRole="button"
                          accessibilityLabel={`Confirmar agendamento de ${item.nomeTipoEvento}`}
                          accessibilityState={{ disabled: confirmandoEste, busy: confirmandoEste }}
                        >
                          {confirmandoEste
                            ? <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                            : <Text style={s.btnConfirmarText}>Confirmar</Text>}
                        </Pressable>
                      </>
                    )}
                    <Pressable style={s.btnFicha} onPress={() => router.push(`/paciente/${item.petId}`)}>
                      <Text style={s.btnFichaText}>Ver ficha</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
              </React.Fragment>
            );
          })
        )}
      </ScrollView>

      <Modal visible={recusando !== null} transparent animationType="fade" onRequestClose={() => setRecusando(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard} accessibilityViewIsModal>
            <Text style={s.modalTitulo} accessibilityRole="header">Recusar agendamento</Text>
            <Text style={s.modalSub}>{recusando?.nomeTipoEvento} — {recusando ? formatarDataEHora(recusando.data, recusando.hora) : ''}</Text>
            <TextInput
              style={s.modalInput}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Motivo (o tutor vai ver)"
              placeholderTextColor={theme.colors.placeholder}
              multiline
              autoFocus
              accessibilityLabel="Motivo da recusa"
            />
            <View style={s.modalAcoes}>
              <Pressable style={s.modalBtnVoltar} onPress={() => setRecusando(null)} accessibilityRole="button" accessibilityLabel="Voltar">
                <Text style={s.modalBtnVoltarText}>Voltar</Text>
              </Pressable>
              <Pressable
                style={[s.modalBtnRecusar, recusar.isPending && { opacity: 0.6 }]}
                onPress={() => void aoRecusar()}
                disabled={recusar.isPending}
                accessibilityRole="button"
                accessibilityLabel="Confirmar recusa"
                accessibilityState={{ disabled: recusar.isPending, busy: recusar.isPending }}
              >
                <Text style={s.modalBtnRecusarText}>{recusar.isPending ? 'Recusando...' : 'Recusar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ResumoPreConsulta({ petId, habilitado, styles: s }: { petId: string; habilitado: boolean; styles: ReturnType<typeof createStyles> }) {
  const { data } = usePerfilSaudePet(petId, habilitado);
  if (!data || !(data.alergias || data.medicamentosContinuos || data.pesoAtual)) return null;
  const itens = [data.alergias ? `Alergias: ${data.alergias}` : null, data.medicamentosContinuos ? `Medicamentos: ${data.medicamentosContinuos}` : null, data.pesoAtual ? `Peso: ${data.pesoAtual} kg` : null].filter(Boolean);
  return <Text style={s.preConsulta} numberOfLines={2} accessibilityLabel={`Resumo de saúde. ${itens.join('. ')}`}>⚕ {itens.join(' · ')}</Text>;
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  content: { padding: 20, paddingBottom: 44 },
  filtros: { gap: 8, paddingBottom: 16 },
  semanaNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, backgroundColor: theme.pages.vetAppointments.card, borderRadius: 12, padding: 6 },
  semanaNavBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  semanaNavLabel: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
  diaSemanaLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'capitalize', marginTop: 8, marginBottom: 8 },
  modoSemanaBtn: { minHeight: 44, alignSelf: 'flex-end', flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 12, marginBottom: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.pages.vetAppointments.border },
  modoSemanaText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
  filtro: { minHeight: 44, justifyContent: 'center', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: theme.pages.vetAppointments.border, backgroundColor: theme.pages.vetAppointments.card },
  filtroAtivo: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filtroTexto: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filtroTextoAtivo: { color: theme.colors.onPrimary },
  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' },

  card: { backgroundColor: theme.pages.vetAppointments.card, borderWidth: 1, borderColor: theme.pages.vetAppointments.border, borderRadius: 18, overflow: 'hidden', marginBottom: 13, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 17, gap: 13, borderBottomWidth: 1, borderBottomColor: theme.pages.vetAppointments.border },
  eventoIcone: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  petNomeResumo: { fontSize: 12, fontWeight: '700', color: theme.colors.primary, marginTop: 3 },
  preConsulta: { color: theme.colors.warning, fontSize: 11, fontWeight: '700', marginTop: 5, lineHeight: 16 },
  eventoMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 5 },
  eventoObs: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: theme.pages.vetAppointments.cardSecondary },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnEtapa: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 9, backgroundColor: theme.colors.infoBackground },
  btnEtapaText: { color: theme.colors.info, fontSize: 11, fontWeight: '800' },
  btnRecusar: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: theme.colors.danger },
  btnRecusarText: { color: theme.colors.danger, fontSize: 12, fontWeight: '700' },
  btnConfirmar: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.primary, minWidth: 82, alignItems: 'center' },
  btnConfirmarText: { color: theme.colors.onPrimary, fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: theme.pages.vetAppointments.card, borderRadius: 16, padding: 22 },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 5 },
  modalSub: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 14 },
  modalInput: { backgroundColor: theme.colors.input, borderWidth: 1.5, borderColor: theme.pages.vetAppointments.border, borderRadius: 10, padding: 13, fontSize: 15, color: theme.colors.text, minHeight: 90, textAlignVertical: 'top', marginBottom: 16 },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  modalBtnVoltar: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  modalBtnVoltarText: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  modalBtnRecusar: { backgroundColor: theme.colors.danger, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8 },
  modalBtnRecusarText: { color: theme.colors.onPrimary, fontSize: 15, fontWeight: '700' },
  btnFicha: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: theme.pages.vetAppointments.border },
  btnFichaText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
});
