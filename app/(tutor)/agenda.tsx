import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePet } from '../../context/PetContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useCancelarEvento, useRemoverEvento } from '../../hooks/useEventos';
import { obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { PetSwitcher } from '../../components/PetSwitcher';
import { Calendario, dateKey } from '../../components/Calendario';
import { statusExibicao, STATUS_EXIBICAO_BADGE, parseDataEvento, formatarDataEvento } from '../../utils/eventoStatus';
import { alertar } from '../../utils/alert';
import type { Evento } from '../../types';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g400: '#3db87e', g200: '#a8e6c7', g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', w50: '#f9f7f4', w100: '#f0ece5', w200: '#e0d8ce',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', warn: '#e67e22', info: '#2563eb',
};

type Filtro = 'todos' | 'atrasado' | 'PREVENTIVO' | 'TERAPEUTICO' | 'BEM_ESTAR' | 'EMERGENCIA';

const FILTROS: { valor: Filtro; label: string; icon: string; iconSet: 'Ionicons' | 'MaterialCommunityIcons' }[] = [
  { valor: 'todos', label: 'Todos', icon: 'apps-outline', iconSet: 'Ionicons' },
  { valor: 'atrasado', label: 'Atrasados', icon: 'alert-circle-outline', iconSet: 'Ionicons' },
  { valor: 'PREVENTIVO', label: 'Preventivo', icon: 'shield-checkmark-outline', iconSet: 'Ionicons' },
  { valor: 'TERAPEUTICO', label: 'Terapêutico', icon: 'medical-bag', iconSet: 'MaterialCommunityIcons' },
  { valor: 'BEM_ESTAR', label: 'Bem-estar', icon: 'heart-outline', iconSet: 'Ionicons' },
  { valor: 'EMERGENCIA', label: 'Emergência', icon: 'warning-outline', iconSet: 'Ionicons' },
];

function formatarDataLonga(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export default function AgendaScreen() {
  const router = useRouter();
  const { petAtivo, eventos, carregandoEventos } = usePet();
  const { modoIdoso } = useAccessibility();
  const cancelarMutation = useCancelarEvento();
  const removerMutation = useRemoverEvento();

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [mesRef, setMesRef] = useState(() => new Date());
  const [selecionado, setSelecionado] = useState(() => new Date());
  const [eventoParaCancelar, setEventoParaCancelar] = useState<Evento | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  const eventosComStatus = useMemo(
    () => eventos.map(e => ({ ...e, statusExibicao: statusExibicao(e) })),
    [eventos]
  );

  const eventosFiltrados = useMemo(() => {
    if (filtro === 'atrasado') return eventosComStatus.filter(e => e.statusExibicao === 'ATRASADO');
    if (filtro !== 'todos') return eventosComStatus.filter(e => e.categoriaTipoEvento === filtro);
    return eventosComStatus;
  }, [eventosComStatus, filtro]);

  const marcadores = useMemo(() => {
    const mapa: Record<string, string[]> = {};
    for (const e of eventosFiltrados) {
      const chave = dateKey(parseDataEvento(e.data));
      const visual = obterVisualTipoEvento(e.nomeTipoEvento);
      if (!mapa[chave]) mapa[chave] = [];
      if (!mapa[chave].includes(visual.cor)) mapa[chave].push(visual.cor);
    }
    return mapa;
  }, [eventosFiltrados]);

  const eventosDoDia = useMemo(() => {
    const chaveSelecionada = dateKey(selecionado);
    return eventosFiltrados
      .filter(e => dateKey(parseDataEvento(e.data)) === chaveSelecionada)
      .sort((a, b) => parseDataEvento(a.data).getTime() - parseDataEvento(b.data).getTime());
  }, [eventosFiltrados, selecionado]);

  function handleMudarMes(offset: number) {
    setMesRef(atual => {
      const novo = new Date(atual.getFullYear(), atual.getMonth() + offset, 1);
      setSelecionado(novo);
      return novo;
    });
  }

  function abrirCancelamento(evento: Evento) {
    setEventoParaCancelar(evento);
    setMotivoCancelamento('');
  }

  async function confirmarCancelamento() {
    if (!eventoParaCancelar) return;
    if (!motivoCancelamento.trim()) {
      alertar('Informe o motivo', 'É preciso descrever o motivo do cancelamento.');
      return;
    }
    try {
      await cancelarMutation.mutateAsync({ id: eventoParaCancelar.id, motivo: motivoCancelamento.trim() });
      setEventoParaCancelar(null);
    } catch {
      alertar('Não foi possível cancelar', 'Tente novamente em instantes.');
    }
  }

  async function handleRemover(evento: Evento) {
    try {
      await removerMutation.mutateAsync(evento.id);
    } catch {
      alertar(
        'Não foi possível remover',
        'Só é possível remover eventos que ainda estão agendados.'
      );
    }
  }

  return (
    <View style={s.container}>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filtroBar}
        contentContainerStyle={s.filtroContent}
      >
        {FILTROS.map(f => (
          <Pressable
            key={f.valor}
            style={[s.filtroBtn, modoIdoso && sIdoso.filtroBtn, filtro === f.valor && s.filtroBtnAtivo]}
            onPress={() => setFiltro(f.valor)}
          >
            <AppIcon
              name={f.icon}
              set={f.iconSet}
              size={modoIdoso ? 17 : 14}
              color={filtro === f.valor ? C.white : C.text}
              style={{ marginRight: 5 }}
            />
            <Text style={[s.filtroText, modoIdoso && sIdoso.filtroText, filtro === f.valor && s.filtroTextAtivo]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={s.scrollContent}>

        <PetSwitcher />

        <Calendario
          mesRef={mesRef}
          selecionado={selecionado}
          marcadores={marcadores}
          onSelecionar={setSelecionado}
          onMudarMes={handleMudarMes}
          idoso={modoIdoso}
        />

        <View style={s.diaHeader}>
          <Text style={[s.diaHeaderTexto, modoIdoso && sIdoso.diaHeaderTexto]}>{formatarDataLonga(selecionado)}</Text>
          {eventosDoDia.length > 0 && (
            <View style={s.diaHeaderBadge}>
              <Text style={s.diaHeaderBadgeText}>{eventosDoDia.length}</Text>
            </View>
          )}
        </View>

        {carregandoEventos ? (
          <View style={s.empty}>
            <ActivityIndicator color={C.g600} />
          </View>
        ) : eventosDoDia.length === 0 ? (
          <View style={s.empty}>
            <AppIcon name="calendar-outline" set="Ionicons" size={40} color={C.muted} style={s.emptyIcon} />
            <Text style={s.emptyTitle}>Nenhum evento nesse dia</Text>
            <Text style={s.emptySub}>Toque em outra data ou adicione um novo evento</Text>
          </View>
        ) : (
          eventosDoDia.map(item => {
            const visual = obterVisualTipoEvento(item.nomeTipoEvento);
            const sb = STATUS_EXIBICAO_BADGE[item.statusExibicao];
            const podeCancelar = item.status === 'AGENDADO';
            const podeRemover = item.status === 'AGENDADO';
            const cancelandoEste = cancelarMutation.isPending && eventoParaCancelar?.id === item.id;
            const removendoEste = removerMutation.isPending && removerMutation.variables === item.id;

            return (
              <View key={item.id} style={s.card}>
                <View style={[s.cardRow, modoIdoso && sIdoso.cardRow]}>
                  <View style={[s.eventoIcone, modoIdoso && sIdoso.eventoIcone, { backgroundColor: visual.cor }]}>
                    <AppIcon name={visual.icon} set={visual.iconSet} size={modoIdoso ? 22 : 18} color={C.white} />
                  </View>
                  <View style={s.eventoInfo}>
                    <Text style={[s.eventoTitulo, modoIdoso && sIdoso.eventoTitulo]}>{item.nomeTipoEvento}</Text>
                    {!modoIdoso ? (
                      <View style={s.eventoMetaRow}>
                        <AppIcon name="time-outline" set="Ionicons" size={11} color={C.muted} />
                        <Text style={s.eventoMeta}>{formatarDataEvento(item.data)}</Text>
                        <Text style={s.eventoMetaDot}>•</Text>
                        <AppIcon name="medical-outline" set="Ionicons" size={11} color={C.muted} />
                        <Text style={s.eventoMeta}>{item.nomeVeterinario}</Text>
                      </View>
                    ) : (
                      <Text style={[s.eventoMeta, sIdoso.eventoMeta]}>{formatarDataEvento(item.data)} • {item.nomeVeterinario}</Text>
                    )}
                    {item.observacao ? <Text style={s.eventoObs}>{item.observacao}</Text> : null}
                    {item.status === 'CANCELADO' && item.motivoCancelamento ? (
                      <Text style={s.eventoMotivoCancelamento}>Motivo: {item.motivoCancelamento}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={[s.cardFooter, modoIdoso && sIdoso.cardFooter]}>
                  <View style={s.badges}>
                    <View style={[s.badge, { backgroundColor: sb.bg }]}>
                      <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                    </View>
                  </View>
                  <View style={s.acoes}>
                    {podeCancelar && (
                      <Pressable
                        style={[s.btnAcao, s.btnAcaoDanger, modoIdoso && sIdoso.btnAcao]}
                        onPress={() => abrirCancelamento(item)}
                        disabled={cancelandoEste}
                      >
                        {cancelandoEste ? (
                          <ActivityIndicator size="small" color={C.danger} />
                        ) : (
                          <>
                            <Ionicons name="close-circle-outline" size={modoIdoso ? 18 : 14} color={C.danger} />
                            <Text style={[s.btnAcaoText, modoIdoso && sIdoso.btnAcaoText, { color: C.danger }]}>Cancelar</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                    {podeRemover && (
                      <Pressable
                        style={[s.btnAcao, modoIdoso && sIdoso.btnAcao]}
                        onPress={() => handleRemover(item)}
                        disabled={removendoEste}
                      >
                        {removendoEste ? (
                          <ActivityIndicator size="small" color={C.muted} />
                        ) : (
                          <>
                            <Ionicons name="trash-outline" size={modoIdoso ? 18 : 14} color={C.muted} />
                            <Text style={[s.btnAcaoText, modoIdoso && sIdoso.btnAcaoText, { color: C.muted }]}>Remover</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Pressable style={[s.fab, modoIdoso && sIdoso.fab]} onPress={() => router.push('/add-evento')}>
        <Ionicons name="add" size={modoIdoso ? 34 : 28} color="#fff" />
      </Pressable>

      <Modal visible={eventoParaCancelar !== null} transparent animationType="fade" onRequestClose={() => setEventoParaCancelar(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={[s.modalTitulo, modoIdoso && sIdoso.modalTitulo]}>Cancelar evento</Text>
            <Text style={[s.modalSub, modoIdoso && sIdoso.modalSub]}>
              {eventoParaCancelar?.nomeTipoEvento} — {eventoParaCancelar ? formatarDataEvento(eventoParaCancelar.data) : ''}
            </Text>
            <TextInput
              style={[s.modalInput, modoIdoso && sIdoso.modalInput]}
              value={motivoCancelamento}
              onChangeText={setMotivoCancelamento}
              placeholder="Motivo do cancelamento"
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={s.modalAcoes}>
              <Pressable style={[s.modalBtnCancelar, modoIdoso && sIdoso.modalBtnCancelar]} onPress={() => setEventoParaCancelar(null)}>
                <Text style={[s.modalBtnCancelarText, modoIdoso && sIdoso.modalBtnCancelarText]}>Voltar</Text>
              </Pressable>
              <Pressable
                style={[s.modalBtnConfirmar, modoIdoso && sIdoso.modalBtnCancelar, cancelarMutation.isPending && { opacity: 0.6 }]}
                onPress={confirmarCancelamento}
                disabled={cancelarMutation.isPending}
              >
                <Text style={[s.modalBtnConfirmarText, modoIdoso && sIdoso.modalBtnCancelarText]}>
                  {cancelarMutation.isPending ? 'Cancelando...' : 'Confirmar cancelamento'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },

  filtroBar: { flexGrow: 0, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  filtroContent: { padding: 12, gap: 8 },
  filtroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.w50,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  filtroBtnAtivo: { backgroundColor: C.g800, borderColor: C.g800 },
  filtroText: { fontSize: 12, fontWeight: '600', color: C.text },
  filtroTextAtivo: { color: C.white },

  scrollContent: { padding: 16, paddingBottom: 96 },

  diaHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 12, paddingHorizontal: 2,
  },
  diaHeaderTexto: { fontSize: 14, fontWeight: '700', color: C.text, textTransform: 'capitalize', flex: 1 },
  diaHeaderBadge: {
    backgroundColor: C.g100, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: C.g200,
  },
  diaHeaderBadgeText: { fontSize: 11, fontWeight: '700', color: C.g700 },

  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  eventoIcone: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 14, fontWeight: '600', color: C.text },
  eventoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  eventoMeta: { fontSize: 11, color: C.muted },
  eventoMetaDot: { fontSize: 11, color: C.muted, marginHorizontal: 2 },
  eventoObs: { fontSize: 11, color: C.muted, marginTop: 4, fontStyle: 'italic' },
  eventoMotivoCancelamento: { fontSize: 11, color: C.danger, marginTop: 4 },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.w50,
  },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  acoes: { flexDirection: 'row', gap: 6 },
  btnAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: C.g50,
    borderWidth: 1,
    borderColor: C.g200,
    minWidth: 36,
    justifyContent: 'center',
  },
  btnAcaoDanger: { backgroundColor: '#fff5f5', borderColor: '#fecaca' },
  btnAcaoText: { fontSize: 12, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center' },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.g600,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,34,24,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  modalSub: { fontSize: 12, color: C.muted, marginBottom: 14 },
  modalInput: {
    backgroundColor: C.w50,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: C.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalAcoes: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalBtnCancelar: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  modalBtnCancelarText: { fontSize: 13, fontWeight: '600', color: C.muted },
  modalBtnConfirmar: { backgroundColor: C.danger, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalBtnConfirmarText: { color: C.white, fontSize: 13, fontWeight: '700' },
});

/** Overrides aplicados por cima de `s` quando o modo idoso está ativo. */
const sIdoso = StyleSheet.create({
  filtroBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  filtroText: { fontSize: 14 },

  diaHeaderTexto: { fontSize: 16 },

  cardRow: { padding: 16 },
  eventoIcone: { width: 50, height: 50, borderRadius: 25 },
  eventoTitulo: { fontSize: 17 },
  eventoMeta: { fontSize: 13, marginTop: 3 },

  cardFooter: { paddingVertical: 12 },
  btnAcao: { paddingHorizontal: 12, paddingVertical: 8 },
  btnAcaoText: { fontSize: 14 },

  fab: { width: 64, height: 64, borderRadius: 32 },

  modalTitulo: { fontSize: 18 },
  modalSub: { fontSize: 14 },
  modalInput: { fontSize: 15, minHeight: 96 },
  modalBtnCancelar: { paddingHorizontal: 18, paddingVertical: 14 },
  modalBtnCancelarText: { fontSize: 15 },
});