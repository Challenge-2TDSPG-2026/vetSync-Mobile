import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { ESPECIES, obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { PetFoto } from '../../components/pet-foto/PetFoto';
import { mostrarToast } from '../../components/ui/Toast';
import { DicaTela } from '../../components/ui/DicaTela';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { STATUS_EXIBICAO_BADGE, formatarDataHoraEvento, statusExibicao } from '../../utils/eventoStatus';
import { usePerfilSaudePet } from '../../hooks/useRelatorios';
import { useAuth } from '../../context/AuthContext';

type ModalTipo = 'concluir' | null;

function calcularIdade(d: string): string {
  const nasc = new Date(d), hoje = new Date();
  const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
  if (meses < 1) return 'Menos de 1 mês';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  const a = Math.floor(meses / 12), m = meses % 12;
  return m > 0 ? `${a} ano${a > 1 ? 's' : ''} e ${m} mês${m > 1 ? 'es' : ''}` : `${a} ano${a > 1 ? 's' : ''}`;
}

export default function FichaPacienteScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pacientes, concluirEvento } = useVet();
  const { autenticado } = useAuth();

  const [modalTipo, setModalTipo] = useState<ModalTipo>(null);
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<string | null>(null);
  const [textoModal, setTextoModal] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-paciente-detalhe');

  const paciente = useMemo(() => pacientes.find(p => p.pet.id === id) ?? null, [pacientes, id]);
  const pet = paciente?.pet ?? null;
  const eventosDoPaciente = paciente?.eventos ?? [];
  const perfilSaude = usePerfilSaudePet(id ?? null, autenticado && !!pet);

  const total = eventosDoPaciente.length;
  const concluidos = eventosDoPaciente.filter(e => e.status === 'CONCLUIDO').length;
  const pendentes = eventosDoPaciente.filter(e => e.status === 'AGENDADO').length;
  const cancelados = eventosDoPaciente.filter(e => e.status === 'CANCELADO').length;

  const especieInfo = ESPECIES.find(e => e.valor === pet?.especie);

  function abrirModal(tipo: ModalTipo, eventoId: string) {
    setModalTipo(tipo);
    setEventoSelecionadoId(eventoId);
    setTextoModal('');
  }

  function fecharModal() {
    setModalTipo(null);
    setEventoSelecionadoId(null);
    setTextoModal('');
  }

  async function handleConfirmarModal() {
    if (!eventoSelecionadoId) return;

    setEnviando(true);
    try {
      await concluirEvento(eventoSelecionadoId, textoModal.trim() || undefined);
      fecharModal();
      mostrarToast('sucesso', 'Consulta concluída');
    } catch {
      mostrarToast('erro', 'Não foi possível concluir a consulta', 'Tente novamente em instantes.');
    } finally {
      setEnviando(false);
    }
  }

  if (!pet) {
    return (
      <View style={s.naoEncontrado}>
        <AppIcon name="alert-circle-outline" set="Ionicons" size={40} color={theme.pages.petDetails.textSecondary} style={{ marginBottom: 12 }} />
        <Text style={s.naoEncontradoTitulo}>Paciente não encontrado</Text>
        <Text style={s.naoEncontradoSub}>Esse pet ainda não tem eventos vinculados a você.</Text>
        <Pressable style={s.btnVoltar} onPress={() => router.back()}>
          <Text style={s.btnVoltarText}>Voltar</Text>
        </Pressable>
      </View>

    );
  }

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: pet.nome }} />

      <ScrollView contentContainerStyle={s.content}>

        {dicaVisivel && (
          <DicaTela
            titulo="Ficha do paciente"
            texto="Veja o histórico completo de eventos do pet abaixo. Toque num evento agendado pra concluir o atendimento."
            accentColor={theme.pages.petDetails.primary}
            onFechar={fecharDica}
          />
        )}

        <View style={s.petCard}>
          <PetFoto pet={pet} size={58} color={theme.pages.petDetails.primary} backgroundColor={theme.pages.petDetails.cardSecondary} accessibilityLabel={`Foto de ${pet.nome}`} />
          <View style={{ flex: 1 }}>
            <Text style={s.petNome}>{pet.nome}</Text>
            <Text style={s.petDetalhe}>{especieInfo?.label}{pet.raca ? ` • ${pet.raca}` : ''}</Text>
            <Text style={s.petDetalhe}>
              {calcularIdade(pet.dataNascimento)} • {pet.peso ? `${pet.peso} kg` : 'Peso não informado'}
            </Text>
          </View>
        </View>

        <View style={s.tutorCard}>
          <View style={s.tutorIcon}>
            <AppIcon name="person-outline" set="Ionicons" size={18} color={theme.pages.petDetails.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.tutorLabel}>Tutor responsável</Text>
            <Text style={s.tutorNome}>{pet.tutor?.nome ?? `Tutor vinculado #${pet.tutor?.id ?? 'não informado'}`}</Text>
            {pet.tutor?.telefone || pet.tutor?.email ? (
              <Text style={s.tutorContato}>{pet.tutor.telefone ?? pet.tutor.email}</Text>
            ) : (
              <Text style={s.tutorContato}>Contato não informado no cadastro</Text>
            )}
          </View>
        </View>

        <View style={s.statsRow}>
          <StatCard styles={s} valor={total} label="Total" accentColor={theme.pages.petDetails.info} />
          <StatCard styles={s} valor={pendentes} label="Pendentes" accentColor={theme.pages.petDetails.primary} />
          <StatCard styles={s} valor={concluidos} label="Concluídas" accentColor={theme.pages.petDetails.success} />
          <StatCard styles={s} valor={cancelados} label="Canceladas" accentColor={theme.pages.petDetails.danger} />
        </View>

        <Text style={s.secLabel}>Histórico Clínico</Text>

        {eventosDoPaciente.length === 0 ? (
          <View style={s.empty}>
            <AppIcon name="document-text-outline" set="Ionicons" size={36} color={theme.pages.petDetails.textSecondary} style={{ marginBottom: 10 }} />
            <Text style={s.emptyTitle}>Nenhum evento registrado</Text>
            <Text style={s.emptySub}>Esse paciente ainda não tem solicitações ou consultas.</Text>
          </View>
        ) : (
          eventosDoPaciente.map(item => {
            const visual = obterVisualTipoEvento(item.nomeTipoEvento);
            const sb = STATUS_EXIBICAO_BADGE[statusExibicao(item)];
            return (
              <View key={item.id} style={s.card}>
                <View style={s.cardRow}>
                  <View style={[s.eventoIcone, { backgroundColor: visual.cor }]}>
                    <AppIcon name={visual.icon} set={visual.iconSet} size={18} color={theme.pages.petDetails.white} />
                  </View>
                  <View style={s.eventoInfo}>
                    <Text style={s.eventoTitulo}>{item.nomeTipoEvento}</Text>
                    <Text style={s.eventoMeta}>{formatarDataHoraEvento(item.data)}</Text>
                    {item.observacao ? <Text style={s.eventoDescricao}>{item.observacao}</Text> : null}

                    {item.status === 'CANCELADO' && item.motivoCancelamento ? (
                      <View style={[s.notaBox, s.notaBoxDanger]}>
                        <Text style={[s.notaLabel, { color: theme.pages.petDetails.danger }]}>Motivo do cancelamento</Text>
                        <Text style={s.notaTexto}>{item.motivoCancelamento}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={s.cardFooter}>
                  <View style={[s.badge, { backgroundColor: sb.bg }]}>
                    <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                  </View>

                  {item.status === 'AGENDADO' && (
                    <View style={s.acoes}>
                      <Pressable style={s.btnAcaoPrimaria} onPress={() => abrirModal('concluir', item.id)}>
                        <Text style={s.btnAcaoPrimariaText}>Concluir</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

      </ScrollView>

      <Modal visible={modalTipo !== null} transparent animationType="fade" onRequestClose={fecharModal}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitulo}>Concluir consulta</Text>
            <Text style={s.modalLabel}>Observações (opcional)</Text>
            <TextInput
              style={s.modalInput}
              value={textoModal}
              onChangeText={setTextoModal}
              placeholder="Diagnóstico, procedimentos realizados, recomendações..."
              placeholderTextColor={theme.pages.petDetails.textSecondary}
              multiline
              numberOfLines={4}
            />
            <Text style={s.modalHint}>
              Essa observação substitui a observação original da solicitação (mesmo campo no sistema).
            </Text>
            <View style={s.modalAcoes}>
              <Pressable style={s.modalBtnVoltar} onPress={fecharModal} disabled={enviando}>
                <Text style={s.modalBtnVoltarText}>Voltar</Text>
              </Pressable>
              <Pressable
                style={[s.modalBtnConfirmar, enviando && { opacity: 0.6 }]}
                onPress={handleConfirmarModal}
                disabled={enviando}
              >
                <Text style={s.modalBtnConfirmarText}>
                  {enviando ? 'Enviando...' : 'Concluir consulta'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

function StatCard({ styles, valor, label, accentColor }: { styles: ReturnType<typeof createStyles>; valor: number; label: string; accentColor: string }) {
  return (
    <View style={[styles.statCard, { borderBottomColor: accentColor }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statVal, { color: accentColor }]}>{valor}</Text>
    </View>
  );
}

function HealthRow({ styles, label, value }: { styles: ReturnType<typeof createStyles>; label: string; value: string }) {
  return (
    <View style={styles.healthRow}>
      <Text style={styles.healthLabel}>{label}</Text>
      <Text style={styles.healthValue}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.pages.petDetails.background },
  content: { padding: 16, paddingBottom: 40 },

  naoEncontrado: { flex: 1, backgroundColor: theme.pages.petDetails.background, justifyContent: 'center', alignItems: 'center', padding: 32 },
  naoEncontradoTitulo: { fontSize: 16, fontWeight: '700', color: theme.pages.petDetails.text, marginBottom: 4 },
  naoEncontradoSub: { fontSize: 13, color: theme.pages.petDetails.textSecondary, textAlign: 'center', marginBottom: 20 },
  btnVoltar: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: theme.pages.petDetails.border },
  btnVoltarText: { fontSize: 14, fontWeight: '700', color: theme.pages.petDetails.text },

  petCard: {
    backgroundColor: theme.pages.petDetails.identityCard.background, borderRadius: 14, borderWidth: 1, borderColor: theme.pages.petDetails.identityCard.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16,
  },
  petAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: theme.pages.petDetails.successBackground, justifyContent: 'center', alignItems: 'center' },
  petNome: { fontSize: 16, fontWeight: '700', color: theme.pages.petDetails.text },
  petDetalhe: { fontSize: 12, color: theme.pages.petDetails.textSecondary, marginTop: 2 },
  tutorCard: {
    backgroundColor: theme.pages.petDetails.cardSecondary, borderRadius: 12, borderWidth: 1, borderColor: theme.pages.petDetails.successBackground,
    padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  tutorIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.pages.petDetails.identityCard.background, justifyContent: 'center', alignItems: 'center' },
  tutorLabel: { fontSize: 10, fontWeight: '700', color: theme.pages.petDetails.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  tutorNome: { fontSize: 13, fontWeight: '700', color: theme.pages.petDetails.text, marginTop: 2 },
  tutorContato: { fontSize: 11, color: theme.pages.petDetails.textSecondary, marginTop: 2 },
  healthCard: { backgroundColor: theme.pages.petDetails.healthCard.background, borderRadius: 12, borderWidth: 1, borderColor: theme.pages.petDetails.healthCard.border, padding: 14, marginBottom: 16 },
  healthRow: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: theme.pages.petDetails.border },
  healthLabel: { fontSize: 10, color: theme.pages.petDetails.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  healthValue: { fontSize: 12, color: theme.pages.petDetails.text, marginTop: 3, lineHeight: 17 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: theme.pages.petDetails.statsCard.background, borderWidth: 1, borderColor: theme.pages.petDetails.statsCard.border, borderRadius: 10, padding: 10, borderBottomWidth: 3 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: theme.pages.petDetails.textSecondary, marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: '700', lineHeight: 22 },

  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.pages.petDetails.textSecondary, marginBottom: 10, marginTop: 4, paddingLeft: 2 },

  empty: { alignItems: 'center', paddingVertical: 48, backgroundColor: theme.pages.petDetails.emptyState.background, borderRadius: 14, borderWidth: 1, borderColor: theme.pages.petDetails.emptyState.border },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: theme.pages.petDetails.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: theme.pages.petDetails.textSecondary, textAlign: 'center', paddingHorizontal: 24 },

  card: { backgroundColor: theme.pages.petDetails.historyCard.background, borderWidth: 1, borderColor: theme.pages.petDetails.historyCard.border, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.pages.petDetails.historyCard.border },
  eventoIcone: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 14, fontWeight: '700', color: theme.pages.petDetails.text },
  eventoMeta: { fontSize: 11, color: theme.pages.petDetails.textSecondary, marginTop: 3 },
  eventoDescricao: { fontSize: 12, color: theme.pages.petDetails.textSecondary, marginTop: 6, fontStyle: 'italic' },

  notaBox: { backgroundColor: theme.pages.petDetails.cardSecondary, borderRadius: 8, borderWidth: 1, borderColor: theme.pages.petDetails.border, padding: 10, marginTop: 8 },
  notaBoxDanger: { backgroundColor: theme.pages.petDetails.dangerBackground, borderColor: theme.pages.petDetails.danger },
  notaLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: theme.pages.petDetails.textSecondary, marginBottom: 4 },
  notaTexto: { fontSize: 12, color: theme.pages.petDetails.text, lineHeight: 17 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.pages.petDetails.cardSecondary },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  acoes: { flexDirection: 'row', gap: 8 },

  btnAcaoPrimaria: { backgroundColor: theme.pages.petDetails.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnAcaoPrimariaText: { color: theme.pages.petDetails.white, fontSize: 12, fontWeight: '700' },
  btnAcaoDanger: { backgroundColor: theme.pages.petDetails.dangerBackground, borderWidth: 1, borderColor: theme.pages.petDetails.danger, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnAcaoDangerText: { color: theme.pages.petDetails.danger, fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: theme.pages.petDetails.overlay, justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: theme.pages.petDetails.card, borderRadius: 16, padding: 20 },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: theme.pages.petDetails.text, marginBottom: 14 },
  modalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: theme.pages.petDetails.textSecondary, marginBottom: 8 },
  modalInput: {
    backgroundColor: theme.pages.petDetails.cardSecondary, borderWidth: 1.5, borderColor: theme.pages.petDetails.border, borderRadius: 10,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: theme.pages.petDetails.text, minHeight: 90, textAlignVertical: 'top',
  },
  modalHint: { fontSize: 11, color: theme.pages.petDetails.textSecondary, marginTop: 6, fontStyle: 'italic' },
  modalAcoes: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalBtnVoltar: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: theme.pages.petDetails.border },
  modalBtnVoltarText: { fontSize: 14, fontWeight: '600', color: theme.pages.petDetails.text },
  modalBtnConfirmar: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: theme.pages.petDetails.primary },
  modalBtnConfirmarText: { fontSize: 14, fontWeight: '700', color: theme.pages.petDetails.white },
});
