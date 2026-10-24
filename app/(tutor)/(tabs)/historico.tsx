import { useTheme } from '../../../context/ThemeContext';
import type { AppTheme } from '../../../constants/theme';
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { usePet } from '../../../context/PetContext';
import { useAccessibility } from '../../../context/AccessibilityContext';
import { useRecarregarDados } from '../../../hooks/useRecarregarDados';
import { useDicaPrimeiraVisita } from '../../../hooks/useDicaPrimeiraVisita';
import { obterVisualTipoEvento } from '../../../constants';
import { AppIcon } from '../../../components/AppIcon';
import { PetSwitcher } from '../../../components/PetSwitcher';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/Skeleton';
import { DicaTela } from '../../../components/ui/DicaTela';
import { IllustratedPageHero } from '../../../components/ui/IllustratedPageHero';
import { statusExibicao, STATUS_EXIBICAO_BADGE, parseDataEvento } from '../../../utils/eventoStatus';

function mesAno(iso: string): string {
  return parseDataEvento(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatarDataCurta(iso: string): string {
  return parseDataEvento(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function HistoricoScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const sSimples = useMemo(() => createSimpleStyles(theme), [theme]);
  const { petAtivo, eventos, carregandoEventos } = usePet();
  const { modoSimples } = useAccessibility();
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('tutor-historico');

  const eventosComStatus = useMemo(
    () => eventos
      .filter(e => e.status === 'CONCLUIDO' || e.status === 'CANCELADO')
      .map(e => ({ ...e, statusExibicao: statusExibicao(e) })),
    [eventos]
  );
  const total = eventosComStatus.length;
  const concluidos = eventosComStatus.filter(e => e.statusExibicao === 'CONCLUIDO').length;
  const cancelados = eventosComStatus.filter(e => e.statusExibicao === 'CANCELADO').length;

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

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.pages.history.primary} colors={[theme.pages.history.primary]} />}
    >
      <IllustratedPageHero
        image={require('../../../assets/images/history.png')}
        title="Histórico de cuidados"
        subtitle={petAtivo ? `Acompanhe tudo o que já foi registrado para ${petAtivo.nome}.` : 'Acompanhe os eventos de saúde registrados para seus pets.'}
        icon="time-outline"
        accessibilityLabel="Tutor conversando com a equipe veterinária sobre os cuidados do pet"
        simple={modoSimples}
        height={modoSimples ? 240 : 196}
        compactControls
      />
      <View style={s.afterHero}>
        <PetSwitcher />
      </View>

      {dicaVisivel && (
        <DicaTela
          titulo="Histórico completo"
          texto="Aqui ficam todos os eventos já concluídos ou cancelados, agrupados por mês. Use pra acompanhar tudo que já foi feito pelo seu pet."
          accentColor={theme.pages.history.info}
          onFechar={fecharDica}
          simples={modoSimples}
        />
      )}

      {/* Stats — no modo simples, só Total */}
      <View style={[s.statsRow, modoSimples && sSimples.statsRow]}>
        <StatCard styles={s} simpleStyles={sSimples} valor={total} label="Total" accentColor={theme.pages.history.info} simples={modoSimples} />
        {!modoSimples && <StatCard styles={s} simpleStyles={sSimples} valor={concluidos} label="Realizados" accentColor={theme.pages.history.success} />}
        {!modoSimples && <StatCard styles={s} simpleStyles={sSimples} valor={cancelados} label="Cancelados" accentColor={theme.pages.history.warning} />}
      </View>

      {carregandoEventos ? (
        <SkeletonList linhas={4} comIcone={false} />
      ) : Object.keys(agrupados).length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="Nenhum evento registrado ainda"
          subtitle="Consultas e eventos concluídos ou cancelados aparecerão aqui."
          accentColor={theme.pages.history.info}
          variant="plain"
        />
      ) : (
        Object.entries(agrupados).map(([mes, evts]) => (
          <View key={mes} style={s.grupo}>
            <View style={s.mesRow}>
              <Text style={[s.mesTitulo, modoSimples && sSimples.mesTitulo]} accessibilityRole="header">{mes}</Text>
              <View style={s.mesBadge}>
                <Text style={s.mesBadgeText}>{evts.length}</Text>
              </View>
            </View>

            <View style={s.tabelaCard}>
              {evts.map((evento, idx) => {
                const visual = obterVisualTipoEvento(evento.nomeTipoEvento);
                const sb = STATUS_EXIBICAO_BADGE[evento.statusExibicao];
                const isLast = idx === evts.length - 1;

                if (modoSimples) {
                  return (
                    <View
                      key={evento.id}
                      style={[sSimples.linhaSimples, !isLast && s.tabelaRowBorder]}
                      accessible
                      accessibilityLabel={`${evento.nomeTipoEvento}, ${formatarDataCurta(evento.data)}, ${sb.label}`}
                    >
                      <View style={sSimples.linhaSimplesTopo}>
                        <View style={[s.rowIcone, sSimples.rowIcone, { backgroundColor: visual.cor }]}>
                          <AppIcon name={visual.icon} set={visual.iconSet} size={24} color={theme.pages.history.white} />
                        </View>
                        <Text style={sSimples.rowTitulo} numberOfLines={2}>{evento.nomeTipoEvento}</Text>
                      </View>
                      <View style={sSimples.linhaSimplesRodape}>
                        <Text style={sSimples.tdData}>{formatarDataCurta(evento.data)}</Text>
                        <View style={[s.statusBadge, sSimples.statusBadge, { backgroundColor: sb.bg }]}>
                          <Text style={[s.statusText, sSimples.statusText, { color: sb.color }]}>{sb.label}</Text>
                        </View>
                      </View>
                    </View>
                  );
                }

                return (
                  <View
                    key={evento.id}
                    style={[s.tabelaRow, !isLast && s.tabelaRowBorder]}
                    accessible
                    accessibilityLabel={`${evento.nomeTipoEvento}, com ${evento.nomeVeterinario}, ${formatarDataCurta(evento.data)}, ${sb.label}`}
                  >
                    <View style={s.tdEvento}>
                      <View style={[s.rowIcone, { backgroundColor: visual.cor }]}>
                        <AppIcon name={visual.icon} set={visual.iconSet} size={16} color={theme.pages.history.white} />
                      </View>
                      <View style={s.rowDetalhes}>
                        <Text style={s.rowTitulo} numberOfLines={2}>{evento.nomeTipoEvento}</Text>
                        <Text style={s.rowVet} numberOfLines={1}>{evento.nomeVeterinario}</Text>
                      </View>
                    </View>

                    <View style={s.rowMeta}>
                      <Text style={s.tdData}>{formatarDataCurta(evento.data)}</Text>
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

function StatCard({ styles, simpleStyles, valor, label, accentColor, simples }: { styles: ReturnType<typeof createStyles>; simpleStyles: ReturnType<typeof createSimpleStyles>; valor: number; label: string; accentColor: string; simples?: boolean }) {
  return (
    <View
      style={[styles.statCard, simples && simpleStyles.statCard, { borderBottomColor: accentColor }]}
      accessible
      accessibilityLabel={`${label}: ${valor}`}
    >
      <Text style={[styles.statLabel, simples && simpleStyles.statLabel]}>{label}</Text>
      <Text style={[styles.statVal, simples && simpleStyles.statVal, { color: accentColor }]}>{valor}</Text>
    </View>
  );
}

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.pages.history.background },
  content: { paddingHorizontal: 18, paddingBottom: 36 },
  afterHero: { marginTop: 18 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  statCard: {
    minWidth: 0,
    flexBasis: 0,
    flexGrow: 1,
    backgroundColor: theme.pages.history.statsCard.background,
    borderWidth: 1,
    borderColor: theme.pages.history.statsCard.border,
    borderRadius: 12,
    padding: 10,
    borderBottomWidth: 3,
  },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: theme.pages.history.textSecondary, marginBottom: 4 },
  statVal: { fontSize: 27, fontWeight: '700', lineHeight: 31 },

  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: theme.pages.history.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: theme.pages.history.textSecondary, textAlign: 'center' },

  grupo: { marginBottom: 24 },
  mesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 11 },
  mesTitulo: { fontSize: 16, fontWeight: '700', color: theme.pages.history.text, textTransform: 'capitalize', flex: 1 },
  mesBadge: { backgroundColor: theme.pages.history.cardSecondary, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: theme.pages.history.border },
  mesBadgeText: { fontSize: 11, fontWeight: '700', color: theme.pages.history.textSecondary },

  tabelaCard: { backgroundColor: theme.pages.history.tableCard.background, borderRadius: 12, borderWidth: 1, borderColor: theme.pages.history.tableCard.border, overflow: 'hidden' },
  tabelaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  tabelaRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.pages.history.border },

  tdEvento: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcone: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowDetalhes: { flex: 1, minWidth: 0 },
  rowTitulo: { fontSize: 13, fontWeight: '600', color: theme.pages.history.text, marginBottom: 2 },
  rowVet: { fontSize: 10, color: theme.pages.history.textSecondary },

  rowMeta: { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  tdData: { fontSize: 12, fontWeight: '600', color: theme.pages.history.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
});

/** Modo simples: ~35% maior que o padrão. Sem card de progresso, só o total nos stats, e sem o nome do veterinário na lista. */
const createSimpleStyles = (theme: AppTheme) => StyleSheet.create({
  statsRow: { flexWrap: 'wrap' },
  statCard: { minWidth: '100%', flexBasis: '100%', paddingVertical: 18 },
  statLabel: { fontSize: 15 },
  statVal: { fontSize: 46, lineHeight: 49 },

  mesTitulo: { fontSize: 22 },

  linhaSimples: { paddingHorizontal: 18, paddingVertical: 18, gap: 12 },
  linhaSimplesTopo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  linhaSimplesRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 62 },
  rowIcone: { width: 48, height: 48, borderRadius: 24 },
  rowTitulo: { fontSize: 20, fontWeight: '700', color: theme.pages.history.text, flexShrink: 1 },
  tdData: { fontSize: 18, fontWeight: '600', color: theme.pages.history.textSecondary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 16 },
});
