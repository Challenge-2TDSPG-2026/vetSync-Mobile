import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { usePet } from '../../context/PetContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { PetSwitcher } from '../../components/PetSwitcher';
import { statusExibicao, STATUS_EXIBICAO_BADGE, parseDataEvento } from '../../utils/eventoStatus';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g400: '#3db87e', g200: '#a8e6c7', g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', w50: '#f9f7f4', w100: '#f0ece5',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', warn: '#e67e22', info: '#2563eb',
};

function mesAno(iso: string): string {
  return parseDataEvento(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatarDataCurta(iso: string): string {
  return parseDataEvento(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function HistoricoScreen() {
  const { eventos, carregandoEventos } = usePet();
  const { modoIdoso } = useAccessibility();

  const eventosComStatus = useMemo(
    () => eventos.map(e => ({ ...e, statusExibicao: statusExibicao(e) })),
    [eventos]
  );
  const total = eventosComStatus.length;
  const concluidos = eventosComStatus.filter(e => e.statusExibicao === 'CONCLUIDO').length;
  const cancelados = eventosComStatus.filter(e => e.statusExibicao === 'CANCELADO').length;
  const emAberto = total - concluidos - cancelados;
  const progresso = total > 0 ? concluidos / total : 0;

  const agrupados = useMemo(() => {
    const mapa: Record<string, typeof eventosComStatus> = {};
    const ordenados = [...eventosComStatus].sort(
      (a, b) => parseDataEvento(b.data).getTime() - parseDataEvento(a.data).getTime()
    );
    for (const e of ordenados) {
      const chave = mesAno(e.data);
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(e);
    }
    return mapa;
  }, [eventosComStatus]);

  const pct = Math.round(progresso * 100);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      <PetSwitcher />

      <View style={[s.statsRow, modoIdoso && sIdoso.statsRow]}>
        <StatCard valor={total} label="Total" accentColor={C.info} idoso={modoIdoso} />
        <StatCard valor={concluidos} label="Realizados" accentColor={C.g500} idoso={modoIdoso} />
        <StatCard valor={emAberto} label="Em aberto" accentColor={C.warn} idoso={modoIdoso} />
      </View>

      <View style={[s.progressoCard, modoIdoso && sIdoso.progressoCard]}>
        <View style={s.progressoHead}>
          <View>
            <Text style={[s.progressoLbl, modoIdoso && sIdoso.progressoLbl]}>Taxa de conclusão</Text>
            <Text style={[s.progressoPct, modoIdoso && sIdoso.progressoPct]}>{pct}%</Text>
          </View>
          <View style={s.progressoMeta}>
            <Text style={[s.progressoMetaText, modoIdoso && sIdoso.progressoMetaText]}>{concluidos} realizados</Text>
            <Text style={[s.progressoMetaText, modoIdoso && sIdoso.progressoMetaText]}>{emAberto} em aberto</Text>
          </View>
        </View>
        <View style={[s.barraTrack, modoIdoso && sIdoso.barraTrack]}>
          <View style={[s.barraFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={[s.progressoHint, modoIdoso && sIdoso.progressoHint]}>
          {total} evento{total !== 1 ? 's' : ''} no total{cancelados > 0 ? ` · ${cancelados} cancelado${cancelados !== 1 ? 's' : ''}` : ''}
        </Text>
      </View>

      {carregandoEventos ? (
        <View style={s.empty}>
          <ActivityIndicator color={C.g600} />
        </View>
      ) : Object.keys(agrupados).length === 0 ? (
        <View style={s.empty}>
          <AppIcon name="document-text-outline" set="Ionicons" size={40} color={C.muted} style={s.emptyIcon} />
          <Text style={s.emptyTitle}>Nenhum evento registrado ainda</Text>
          <Text style={s.emptySub}>Adicione eventos para ver o histórico clínico</Text>
        </View>
      ) : (
        Object.entries(agrupados).map(([mes, evts]) => (
          <View key={mes} style={s.grupo}>
            <View style={s.mesRow}>
              <Text style={[s.mesTitulo, modoIdoso && sIdoso.mesTitulo]}>{mes}</Text>
              <View style={s.mesBadge}>
                <Text style={s.mesBadgeText}>{evts.length}</Text>
              </View>
            </View>

            <View style={s.tabelaCard}>
              {!modoIdoso && (
                <View style={s.tabelaHead}>
                  <Text style={[s.thText, { flex: 2 }]}>Evento</Text>
                  <Text style={[s.thText, { flex: 1, textAlign: 'center' }]}>Data</Text>
                  <Text style={[s.thText, { flex: 1, textAlign: 'right' }]}>Status</Text>
                </View>
              )}
              {evts.map((evento, idx) => {
                const visual = obterVisualTipoEvento(evento.nomeTipoEvento);
                const sb = STATUS_EXIBICAO_BADGE[evento.statusExibicao];
                const isLast = idx === evts.length - 1;

                if (modoIdoso) {
                  return (
                    <View key={evento.id} style={[sIdoso.linhaIdoso, !isLast && s.tabelaRowBorder]}>
                      <View style={sIdoso.linhaIdosoTopo}>
                        <View style={[s.rowIcone, sIdoso.rowIcone, { backgroundColor: visual.cor }]}>
                          <AppIcon name={visual.icon} set={visual.iconSet} size={18} color={C.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={sIdoso.rowTitulo} numberOfLines={2}>{evento.nomeTipoEvento}</Text>
                          <Text style={sIdoso.rowVet} numberOfLines={1}>{evento.nomeVeterinario}</Text>
                        </View>
                      </View>
                      <View style={sIdoso.linhaIdosoRodape}>
                        <Text style={sIdoso.tdData}>{formatarDataCurta(evento.data)}</Text>
                        <View style={[s.statusBadge, sIdoso.statusBadge, { backgroundColor: sb.bg }]}>
                          <Text style={[s.statusText, sIdoso.statusText, { color: sb.color }]}>{sb.label}</Text>
                        </View>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={evento.id} style={[s.tabelaRow, !isLast && s.tabelaRowBorder]}>
                    <View style={[s.tdEvento, { flex: 2 }]}>
                      <View style={[s.rowIcone, { backgroundColor: visual.cor }]}>
                        <AppIcon name={visual.icon} set={visual.iconSet} size={13} color={C.white} />
                      </View>
                      <View>
                        <Text style={s.rowTitulo} numberOfLines={1}>{evento.nomeTipoEvento}</Text>
                        <Text style={s.rowVet} numberOfLines={1}>{evento.nomeVeterinario}</Text>
                      </View>
                    </View>

                    <Text style={[s.tdData, { flex: 1 }]}>{formatarDataCurta(evento.data)}</Text>

                    <View style={[s.tdStatus, { flex: 1 }]}>
                      <View style={[s.statusBadge, { backgroundColor: sb.bg }]}>
                        <Text style={[s.statusText, { color: sb.color }]}>{sb.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({ valor, label, accentColor, idoso }: { valor: number; label: string; accentColor: string; idoso?: boolean }) {
  return (
    <View style={[s.statCard, idoso && sIdoso.statCard, { borderBottomColor: accentColor }]}>
      <Text style={[s.statLabel, idoso && sIdoso.statLabel]}>{label}</Text>
      <Text style={[s.statVal, idoso && sIdoso.statVal, { color: accentColor }]}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 16, paddingBottom: 32 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    borderBottomWidth: 3,
  },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: C.muted, marginBottom: 6 },
  statVal: { fontSize: 26, fontWeight: '700', lineHeight: 28 },

  progressoCard: { backgroundColor: C.g800, borderRadius: 16, padding: 20, marginBottom: 24 },
  progressoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressoLbl: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(168,230,199,0.8)', marginBottom: 4 },
  progressoPct: { fontSize: 36, fontWeight: '700', color: C.white, lineHeight: 40 },
  progressoMeta: { alignItems: 'flex-end', gap: 4 },
  progressoMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  barraTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  barraFill: { height: '100%', backgroundColor: C.g400, borderRadius: 4 },
  progressoHint: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center' },

  grupo: { marginBottom: 22 },
  mesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  mesTitulo: { fontSize: 13, fontWeight: '700', color: C.text, textTransform: 'capitalize', flex: 1 },
  mesBadge: { backgroundColor: C.w100, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.border },
  mesBadgeText: { fontSize: 11, fontWeight: '700', color: C.muted },

  tabelaCard: { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  tabelaHead: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.w50,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  thText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted },
  tabelaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  tabelaRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },

  tdEvento: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcone: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  rowTitulo: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
  rowVet: { fontSize: 10, color: C.muted },

  tdData: { fontSize: 12, fontWeight: '600', color: C.muted, textAlign: 'center' },
  tdStatus: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
});

/** Overrides do modo idoso. No histórico, a tabela de 3 colunas vira uma lista empilhada (mais legível). */
const sIdoso = StyleSheet.create({
  statsRow: { flexWrap: 'wrap' },
  statCard: { minWidth: '47%', flexBasis: '47%' },
  statLabel: { fontSize: 11 },
  statVal: { fontSize: 30, lineHeight: 32 },

  progressoCard: { padding: 24 },
  progressoLbl: { fontSize: 13 },
  progressoPct: { fontSize: 42, lineHeight: 46 },
  progressoMetaText: { fontSize: 14 },
  barraTrack: { height: 12, borderRadius: 6 },
  progressoHint: { fontSize: 14 },

  mesTitulo: { fontSize: 16 },

  linhaIdoso: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  linhaIdosoTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linhaIdosoRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 52 },
  rowIcone: { width: 40, height: 40, borderRadius: 20 },
  rowTitulo: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 2 },
  rowVet: { fontSize: 13, color: C.muted },
  tdData: { fontSize: 14, fontWeight: '600', color: C.muted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 13 },
});