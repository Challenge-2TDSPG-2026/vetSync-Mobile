import React, { useMemo, useState } from 'react';
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

export default function ConsultasScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { eventosAgendados, carregando } = useVet();
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-consultas');

  const confirmar = useConfirmarEvento();
  const recusar = useRecusarEvento();
  const [recusando, setRecusando] = useState<Evento | null>(null);
  const [motivo, setMotivo] = useState('');

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

  const listaOrdenada = [...eventosAgendados].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} progressBackgroundColor={theme.pages.vetAppointments.card} />}
      >
        {dicaVisivel && (
          <DicaTela
            titulo="Suas consultas"
            texto="Veja aqui todas as consultas agendadas com você, ordenadas por data. Toque numa consulta pra ver os detalhes do paciente."
            accentColor={theme.colors.primary}
            onFechar={fecharDica}
          />
        )}

        {carregando ? (
          <SkeletonList linhas={4} />
        ) : listaOrdenada.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="Nada por aqui"
            subtitle="Nenhuma consulta agendada no momento."
            accentColor={theme.colors.primary}
          />
        ) : (
          listaOrdenada.map(item => {
            const visual = obterVisualTipoEvento(item.nomeTipoEvento);
            const pendente = ehPendenteDeConfirmacao(item);
            const sb = pendente ? ETAPA_VISUAL.AGUARDANDO_CONFIRMACAO : STATUS_EXIBICAO_BADGE[statusExibicao(item)];
            const confirmandoEste = confirmar.isPending && confirmar.variables === item.id;
            return (
              <Pressable key={item.id} style={s.card} onPress={() => router.push(`/paciente/${item.petId}`)}>
                <View style={s.cardRow}>
                  <View style={[s.eventoIcone, { backgroundColor: visual.cor }]}>
                    <AppIcon name={visual.icon} set={visual.iconSet} size={18} color={theme.colors.onPrimary} />
                  </View>
                  <View style={s.eventoInfo}>
                    <Text style={s.eventoTitulo}>{item.nomeTipoEvento}</Text>
                    <Text style={s.eventoMeta}>{item.hora ? formatarDataEHora(item.data, item.hora) : formatarDataHoraEvento(item.data)}</Text>
                    {item.observacao ? <Text style={s.eventoObs} numberOfLines={2}>{item.observacao}</Text> : null}
                  </View>
                </View>
                <View style={s.cardFooter}>
                  <View style={[s.badge, { backgroundColor: sb.bg }]}>
                    <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                  </View>
                  <View style={s.acoes}>
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  content: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' },

  card: { backgroundColor: theme.pages.vetAppointments.card, borderWidth: 1, borderColor: theme.pages.vetAppointments.border, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.pages.vetAppointments.border },
  eventoIcone: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  eventoMeta: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 3 },
  eventoObs: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.pages.vetAppointments.cardSecondary },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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