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

// No modo simples, só os 2 filtros mais úteis para decisão rápida.
const FILTROS_SIMPLES: Filtro[] = ['todos', 'atrasado'];

function formatarDataLonga(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export default function AgendaScreen() {
  const router = useRouter();
  const { petAtivo, eventos, carregandoEventos } = usePet();
  const { modoSimples } = useAccessibility();
  const cancelarMutation = useCancelarEvento();
  const removerMutation = useRemoverEvento();

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [mesRef, setMesRef] = useState(() => new Date());
  const [selecionado, setSelecionado] = useState(() => new Date());
  const [eventoParaCancelar, setEventoParaCancelar] = useState<Evento | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  const filtrosVisiveis = useMemo(
    () => (modoSimples ? FILTROS.filter(f => FILTROS_SIMPLES.includes(f.valor)) : FILTROS),
    [modoSimples]
  );

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
        {filtrosVisiveis.map(f => (
          <Pressable
            key={f.valor}
            style={[s.filtroBtn, modoSimples && sSimples.filtroBtn, filtro === f.valor && s.filtroBtnAtivo]}
            onPress={() => setFiltro(f.valor)}
          >
            <AppIcon
              name={f.icon}
              set={f.iconSet}
              size={modoSimples ? 19 : 15}
              color={filtro === f.valor ? C.white : C.text}
              style={{ marginRight: 6 }}
            />
            <Text style={[s.filtroText, modoSimples && sSimples.filtroText, filtro === f.valor && s.filtroTextAtivo]}>{f.label}</Text>
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
          simples={modoSimples}
        />

        <View style={s.diaHeader}>
          <Text style={[s.diaHeaderTexto, modoSimples && sSimples.diaHeaderTexto]}>{formatarDataLonga(selecionado)}</Text>
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
                <View style={[s.cardRow, modoSimples && sSimples.cardRow]}>
                  <View style={[s.eventoIcone, modoSimples && sSimples.eventoIcone, { backgroundColor: visual.cor }]}>
                    <AppIcon name={visual.icon} set={visual.iconSet} size={modoSimples ? 26 : 20} color={C.white} />
                  </View>
                  <View style={s.eventoInfo}>
                    <Text style={[s.eventoTitulo, modoSimples && sSimples.eventoTitulo]}>{item.nomeTipoEvento}</Text>
                    {!modoSimples ? (
                      <View style={s.eventoMetaRow}>
                        <AppIcon name="time-outline" set="Ionicons" size={12} color={C.muted} />
                        <Text style={s.eventoMeta}>{formatarDataEvento(item.data)}</Text>
                        <Text style={s.eventoMetaDot}>•</Text>
                        <AppIcon name="medical-outline" set="Ionicons" size={12} color={C.muted} />
                        <Text style={s.eventoMeta}>{item.nomeVeterinario}</Text>
                      </View>
                    ) : (
                      <Text style={[s.eventoMeta, sSimples.eventoMeta]}>{formatarDataEvento(item.data)} • {item.nomeVeterinario}</Text>
                    )}
                    {!modoSimples && item.observacao ? <Text style={s.eventoObs}>{item.observacao}</Text> : null}
                    {!modoSimples && item.status === 'CANCELADO' && item.motivoCancelamento ? (
                      <Text style={s.eventoMotivoCancelamento}>Motivo: {item.motivoCancelamento}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={[s.cardFooter, modoSimples && sSimples.cardFooter]}>
                  <View style={s.badges}>
                    <View style={[s.badge, { backgroundColor: sb.bg }]}>
                      <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                    </View>
                  </View>
                  <View style={s.acoes}>
                    {podeCancelar && (
                      <Pressable
                        style={[s.btnAcao, s.btnAcaoDanger, modoSimples && sSimples.btnAcao]}
                        onPress={() => abrirCancelamento(item)}
                        disabled={cancelandoEste}
                      >
                        {cancelandoEste ? (
                          <ActivityIndicator size="small" color={C.danger} />
                        ) : (
                          <>
                            <Ionicons name="close-circle-outline" size={modoSimples ? 20 : 15} color={C.danger} />
                            <Text style={[s.btnAcaoText, modoSimples && sSimples.btnAcaoText, { color: C.danger }]}>Cancelar</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                    {podeRemover && (
                      <Pressable
                        style={[s.btnAcao, modoSimples && sSimples.btnAcao]}
                        onPress={() => handleRemover(item)}
                        disabled={removendoEste}
                      >
                        {removendoEste ? (
                          <ActivityIndicator size="small" color={C.muted} />
                        ) : (
                          <>
                            <Ionicons name="trash-outline" size={modoSimples ? 20 : 15} color={C.muted} />
                            <Text style={[s.btnAcaoText, modoSimples && sSimples.btnAcaoText, { color: C.muted }]}>Remover</Text>
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

      <Pressable style={[s.fab, modoSimples && sSimples.fab]} onPress={() => router.push('/add-evento')}>
        <Ionicons name="add" size={modoSimples ? 38 : 30} color="#fff" />
      </Pressable>

      <Modal visible={eventoParaCancelar !== null} transparent animationType="fade" onRequestClose={() => setEventoParaCancelar(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={[s.modalTitulo, modoSimples && sSimples.modalTitulo]}>Cancelar evento</Text>
            <Text style={[s.modalSub, modoSimples && sSimples.modalSub]}>
              {eventoParaCancelar?.nomeTipoEvento} — {eventoParaCancelar ? formatarDataEvento(eventoParaCancelar.data) : ''}
            </Text>
            <TextInput
              style={[s.modalInput, modoSimples && sSimples.modalInput]}
              value={motivoCancelamento}
              onChangeText={setMotivoCancelamento}
              placeholder="Motivo do cancelamento"
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={s.modalAcoes}>
              <Pressable style={[s.modalBtnCancelar, modoSimples && sSimples.modalBtnCancelar]} onPress={() => setEventoParaCancelar(null)}>
                <Text style={[s.modalBtnCancelarText, modoSimples && sSimples.modalBtnCancelarText]}>Voltar</Text>
              </Pressable>
              <Pressable
                style={[s.modalBtnConfirmar, modoSimples && sSimples.modalBtnCancelar, cancelarMutation.isPending && { opacity: 0.6 }]}
                onPress={confirmarCancelamento}
                disabled={cancelarMutation.isPending}
              >
                <Text style={[s.modalBtnConfirmarText, modoSimples && sSimples.modalBtnCancelarText]}>
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

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },

  filtroBar: { flexGrow: 0, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  filtroContent: { padding: 14, gap: 10 },
  filtroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.w50,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  filtroBtnAtivo: { backgroundColor: C.g800, borderColor: C.g800 },
  filtroText: { fontSize: 14, fontWeight: '600', color: C.text },
  filtroTextAtivo: { color: C.white },

  scrollContent: { padding: 16, paddingBottom: 100 },

  diaHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 13, paddingHorizontal: 2,
  },
  diaHeaderTexto: { fontSize: 16, fontWeight: '700', color: C.text, textTransform: 'capitalize', flex: 1 },
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
    marginBottom: 11,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  eventoIcone: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 17, fontWeight: '600', color: C.text },
  eventoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  eventoMeta: { fontSize: 13, color: C.muted },
  eventoMetaDot: { fontSize: 13, color: C.muted, marginHorizontal: 2 },
  eventoObs: { fontSize: 12, color: C.muted, marginTop: 5, fontStyle: 'italic' },
  eventoMotivoCancelamento: { fontSize: 12, color: C.danger, marginTop: 5 },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.w50,
  },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  acoes: { flexDirection: 'row', gap: 8 },
  btnAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.g50,
    borderWidth: 1,
    borderColor: C.g200,
    minWidth: 40,
    justifyContent: 'center',
  },
  btnAcaoDanger: { backgroundColor: '#fff5f5', borderColor: '#fecaca' },
  btnAcaoText: { fontSize: 14, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center' },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
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
    padding: 22,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 5 },
  modalSub: { fontSize: 14, color: C.muted, marginBottom: 16 },
  modalInput: {
    backgroundColor: C.w50,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: C.text,
    minHeight: 96,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  modalAcoes: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalBtnCancelar: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  modalBtnCancelarText: { fontSize: 15, fontWeight: '600', color: C.muted },
  modalBtnConfirmar: { backgroundColor: C.danger, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8 },
  modalBtnConfirmarText: { color: C.white, fontSize: 15, fontWeight: '700' },
});

/** Modo simples: ~35% maior que o padrão, com bem menos conteúdo por tela. */
const sSimples = StyleSheet.create({
  filtroBtn: { paddingHorizontal: 22, paddingVertical: 14 },
  filtroText: { fontSize: 19 },

  diaHeaderTexto: { fontSize: 22 },

  cardRow: { padding: 22 },
  eventoIcone: { width: 68, height: 68, borderRadius: 34 },
  eventoTitulo: { fontSize: 23 },
  eventoMeta: { fontSize: 18, marginTop: 4 },

  cardFooter: { paddingVertical: 16 },
  btnAcao: { paddingHorizontal: 16, paddingVertical: 11 },
  btnAcaoText: { fontSize: 19 },

  fab: { width: 86, height: 86, borderRadius: 43 },

  modalTitulo: { fontSize: 24 },
  modalSub: { fontSize: 19 },
  modalInput: { fontSize: 20, minHeight: 120 },
  modalBtnCancelar: { paddingHorizontal: 24, paddingVertical: 19 },
  modalBtnCancelarText: { fontSize: 20 },
});