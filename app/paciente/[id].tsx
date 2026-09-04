import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { ESPECIES, obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { alertar } from '../../utils/alert';
import { STATUS_EXIBICAO_BADGE, formatarDataHoraEvento, statusExibicao } from '../../utils/eventoStatus';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g200: '#a8e6c7', g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', w50: '#f9f7f4', w100: '#f0ece5',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', info: '#2563eb',
};

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
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pacientes, concluirEvento } = useVet();

  const [modalTipo, setModalTipo] = useState<ModalTipo>(null);
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<string | null>(null);
  const [textoModal, setTextoModal] = useState('');
  const [enviando, setEnviando] = useState(false);

  const paciente = useMemo(() => pacientes.find(p => p.pet.id === id) ?? null, [pacientes, id]);
  const pet = paciente?.pet ?? null;
  const eventosDoPaciente = paciente?.eventos ?? [];

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
    } catch {
      alertar('Não foi possível concluir a consulta', 'Tente novamente em instantes.');
    } finally {
      setEnviando(false);
    }
  }

  if (!pet) {
    return (
      <View style={s.naoEncontrado}>
        <AppIcon name="alert-circle-outline" set="Ionicons" size={40} color={C.muted} style={{ marginBottom: 12 }} />
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

        <View style={s.petCard}>
          <View style={s.petAvatar}>
            <AppIcon
              name={especieInfo?.icon ?? 'paw'}
              set={especieInfo?.iconSet ?? 'MaterialCommunityIcons'}
              size={30}
              color={C.g600}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.petNome}>{pet.nome}</Text>
            <Text style={s.petDetalhe}>{especieInfo?.label}{pet.raca ? ` • ${pet.raca}` : ''}</Text>
            <Text style={s.petDetalhe}>
              {calcularIdade(pet.dataNascimento)} • {pet.peso ? `${pet.peso} kg` : 'Peso não informado'}
            </Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <StatCard valor={total} label="Total" accentColor={C.info} />
          <StatCard valor={pendentes} label="Pendentes" accentColor={C.g600} />
          <StatCard valor={concluidos} label="Concluídas" accentColor={C.g500} />
          <StatCard valor={cancelados} label="Canceladas" accentColor={C.danger} />
        </View>

        <Text style={s.secLabel}>Histórico Clínico</Text>

        {eventosDoPaciente.length === 0 ? (
          <View style={s.empty}>
            <AppIcon name="document-text-outline" set="Ionicons" size={36} color={C.muted} style={{ marginBottom: 10 }} />
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
                    <AppIcon name={visual.icon} set={visual.iconSet} size={18} color={C.white} />
                  </View>
                  <View style={s.eventoInfo}>
                    <Text style={s.eventoTitulo}>{item.nomeTipoEvento}</Text>
                    <Text style={s.eventoMeta}>{formatarDataHoraEvento(item.data)}</Text>
                    {item.observacao ? <Text style={s.eventoDescricao}>{item.observacao}</Text> : null}

                    {item.status === 'CANCELADO' && item.motivoCancelamento ? (
                      <View style={[s.notaBox, s.notaBoxDanger]}>
                        <Text style={[s.notaLabel, { color: C.danger }]}>Motivo do cancelamento</Text>
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
              placeholderTextColor={C.muted}
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

function StatCard({ valor, label, accentColor }: { valor: number; label: string; accentColor: string }) {
  return (
    <View style={[s.statCard, { borderBottomColor: accentColor }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statVal, { color: accentColor }]}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 16, paddingBottom: 40 },

  naoEncontrado: { flex: 1, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center', padding: 32 },
  naoEncontradoTitulo: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  naoEncontradoSub: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20 },
  btnVoltar: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border },
  btnVoltarText: { fontSize: 14, fontWeight: '700', color: C.text },

  petCard: {
    backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16,
  },
  petAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.g100, justifyContent: 'center', alignItems: 'center' },
  petNome: { fontSize: 16, fontWeight: '700', color: C.text },
  petDetalhe: { fontSize: 12, color: C.muted, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, borderBottomWidth: 3 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: C.muted, marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: '700', lineHeight: 22 },

  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.muted, marginBottom: 10, marginTop: 4, paddingLeft: 2 },

  empty: { alignItems: 'center', paddingVertical: 48, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: C.muted, textAlign: 'center', paddingHorizontal: 24 },

  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  eventoIcone: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 14, fontWeight: '700', color: C.text },
  eventoMeta: { fontSize: 11, color: C.muted, marginTop: 3 },
  eventoDescricao: { fontSize: 12, color: C.muted, marginTop: 6, fontStyle: 'italic' },

  notaBox: { backgroundColor: C.w50, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 10, marginTop: 8 },
  notaBoxDanger: { backgroundColor: '#fff5f5', borderColor: '#fecaca' },
  notaLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: C.muted, marginBottom: 4 },
  notaTexto: { fontSize: 12, color: C.text, lineHeight: 17 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.w50 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  acoes: { flexDirection: 'row', gap: 8 },

  btnAcaoPrimaria: { backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnAcaoPrimariaText: { color: C.white, fontSize: 12, fontWeight: '700' },
  btnAcaoDanger: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnAcaoDangerText: { color: C.danger, fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,34,24,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: C.white, borderRadius: 16, padding: 20 },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 14 },
  modalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: C.muted, marginBottom: 8 },
  modalInput: {
    backgroundColor: C.w50, borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: C.text, minHeight: 90, textAlignVertical: 'top',
  },
  modalHint: { fontSize: 11, color: C.muted, marginTop: 6, fontStyle: 'italic' },
  modalAcoes: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalBtnVoltar: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  modalBtnVoltarText: { fontSize: 14, fontWeight: '600', color: C.text },
  modalBtnConfirmar: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: C.g600 },
  modalBtnConfirmarText: { fontSize: 14, fontWeight: '700', color: C.white },
});