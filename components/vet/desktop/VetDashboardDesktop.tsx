import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useVet } from '../../../context/VetContext';
import { useRecarregarDados } from '../../../hooks/useRecarregarDados';
import { SkeletonCard } from '../../ui/Skeleton';
import { STATUS_EXIBICAO_BADGE, formatarDataHoraEvento, statusExibicao } from '../../../utils/eventoStatus';
import type { AppTheme } from '../../../constants/theme';
import type { Evento } from '../../../types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Painel do veterinário para desktop: indicadores em linha e agenda lado a lado. */
export function VetDashboardDesktop() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { sessao } = useAuth();
  const { veterinarioAtivo, eventosAgendados, eventosDeHoje, pacientes, carregando } = useVet();
  const { atualizando, aoAtualizar } = useRecarregarDados();

  const pacientesComPendencia = pacientes.filter(p => p.eventos.some(e => e.status === 'AGENDADO')).length;
  const concluidosHoje = eventosDeHoje.filter(e => e.status === 'CONCLUIDO').length;
  const proximos = useMemo(
    () => [...eventosAgendados].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).slice(0, 6),
    [eventosAgendados],
  );

  if (carregando) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <SkeletonCard height={60} borderRadius={12} style={{ marginBottom: 24 }} />
        <View style={s.kpis}>
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} height={110} borderRadius={16} style={{ flex: 1 }} />)}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} />}
    >
      <View style={s.page}>
        <View style={s.headerRow}>
          <View style={s.headerInfo}>
            <Text style={s.titulo} accessibilityRole="header">Olá, {veterinarioAtivo?.nome ?? sessao?.nome}</Text>
            <Text style={s.subtitulo}>{veterinarioAtivo?.nomeClinica ?? 'Painel do veterinário'}</Text>
          </View>
          <View style={s.headerActions}>
            <Pressable style={s.btn} onPress={() => router.push('/(vet)/disponibilidade')} accessibilityRole="button" accessibilityLabel="Ver agenda completa">
              <Text style={s.btnText}>Ver agenda completa</Text>
            </Pressable>
            <Pressable style={[s.btn, s.btnPrimary]} onPress={() => router.push('/(vet)/consultas')} accessibilityRole="button" accessibilityLabel="Novo atendimento">
              <Text style={[s.btnText, s.btnPrimaryText]}>+ Novo atendimento</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.kpis}>
          <Kpi s={s} label="Agendados" valor={eventosAgendados.length} icon="calendar-outline" cor={theme.colors.info} fundo={theme.colors.infoBackground} />
          <Kpi s={s} label="Hoje" valor={eventosDeHoje.length} icon="time-outline" cor={theme.colors.success} fundo={theme.colors.successBackground} />
          <Kpi s={s} label="Pacientes" valor={pacientes.length} icon="paw-outline" cor={theme.colors.text} fundo={theme.pages.vetDashboard.cardSecondary} />
          <View style={[s.kpi, s.kpiDestaque]} accessible accessibilityLabel={`Resumo do campo: ${pacientesComPendencia} com pendência`}>
            <View style={s.kpiTop}>
              <Text style={[s.kpiLabel, { color: '#9FC4B1' }]}>Resumo do campo</Text>
              <View style={[s.kpiIcon, { backgroundColor: '#15382A' }]}>
                <Ionicons name="pulse-outline" size={18} color="#9FC4B1" />
              </View>
            </View>
            <Text style={[s.kpiValor, { color: '#FFFFFF' }]}>{pacientesComPendencia}</Text>
            <Text style={s.kpiDestaqueHint}>com pendência</Text>
          </View>
        </View>

        <View style={s.colunas}>
          <View style={[s.card, s.colAgenda]}>
            <View style={s.cardHead}>
              <View>
                <Text style={s.cardTitle} accessibilityRole="header">Agenda de hoje</Text>
                <Text style={s.cardHint}>{eventosDeHoje.length} atendimento{eventosDeHoje.length === 1 ? '' : 's'} hoje · {concluidosHoje} concluído{concluidosHoje === 1 ? '' : 's'}</Text>
              </View>
              {eventosDeHoje.length === 0 && (
                <View style={[s.pill, { backgroundColor: theme.colors.successBackground }]}>
                  <Text style={[s.pillText, { color: theme.colors.success }]}>Agenda livre</Text>
                </View>
              )}
            </View>

            {eventosDeHoje.length === 0 ? (
              <View style={s.vazio}>
                <Text style={s.vazioTitulo}>Nenhum atendimento para hoje</Text>
                <Text style={s.vazioTexto}>Quando houver consultas marcadas, elas aparecem aqui em ordem de horário.</Text>
                <Pressable style={[s.btn, s.btnPrimary]} onPress={() => router.push('/(vet)/disponibilidade')} accessibilityRole="button" accessibilityLabel="Abrir agenda">
                  <Text style={[s.btnText, s.btnPrimaryText]}>Abrir agenda</Text>
                </Pressable>
              </View>
            ) : (
              eventosDeHoje.map(e => <LinhaAgenda key={e.id} s={s} evento={e} onPress={() => router.push(`/paciente/${e.petId}`)} />)
            )}
          </View>

          <View style={[s.card, s.colProximos]}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle} accessibilityRole="header">Próximos agendamentos</Text>
              <Pressable onPress={() => router.push('/(vet)/consultas')} accessibilityRole="button" accessibilityLabel="Ver todas as consultas">
                <Text style={s.link}>Ver todos →</Text>
              </Pressable>
            </View>

            <View style={[s.linha, s.linhaHead]}>
              <Text style={[s.th, { flex: 2 }]}>Data e hora</Text>
              <Text style={[s.th, { flex: 3 }]}>Atendimento</Text>
              <Text style={[s.th, { flex: 1.5 }]}>Status</Text>
            </View>

            {proximos.length === 0 ? (
              <View style={s.vazio}>
                <Text style={s.vazioTitulo}>Nenhum atendimento agendado</Text>
                <Text style={s.vazioTexto}>Os próximos atendimentos aparecerão aqui.</Text>
              </View>
            ) : (
              proximos.map(e => {
                const sb = STATUS_EXIBICAO_BADGE[statusExibicao(e)];
                return (
                  <Pressable
                    key={e.id}
                    style={s.linha}
                    onPress={() => router.push(`/paciente/${e.petId}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.nomeTipoEvento}, ${formatarDataHoraEvento(e.data)}, ${sb.label}`}
                    accessibilityHint="Abre a ficha do paciente"
                  >
                    <Text style={[s.celulaForte, { flex: 2 }]}>{formatarDataHoraEvento(e.data)}</Text>
                    <Text style={[s.celula, { flex: 3 }]} numberOfLines={1}>{e.nomeTipoEvento}</Text>
                    <View style={{ flex: 1.5, alignItems: 'flex-start' }}>
                      <View style={[s.pill, { backgroundColor: sb.bg }]}>
                        <Text style={[s.pillText, { color: sb.color }]}>{sb.label}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

type Styles = ReturnType<typeof createStyles>;

function Kpi({ s, label, valor, icon, cor, fundo }: { s: Styles; label: string; valor: number; icon: IconName; cor: string; fundo: string }) {
  return (
    <View style={s.kpi} accessible accessibilityLabel={`${label}: ${valor}`}>
      <View style={s.kpiTop}>
        <Text style={s.kpiLabel}>{label}</Text>
        <View style={[s.kpiIcon, { backgroundColor: fundo }]}>
          <Ionicons name={icon} size={18} color={cor} />
        </View>
      </View>
      <Text style={[s.kpiValor, { color: cor }]}>{valor}</Text>
    </View>
  );
}

function LinhaAgenda({ s, evento, onPress }: { s: Styles; evento: Evento; onPress: () => void }) {
  const sb = STATUS_EXIBICAO_BADGE[statusExibicao(evento)];
  return (
    <Pressable
      style={s.linha}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${evento.nomeTipoEvento}, ${formatarDataHoraEvento(evento.data)}, ${sb.label}`}
      accessibilityHint="Abre a ficha do paciente"
    >
      <View style={{ flex: 1 }}>
        <Text style={s.celulaForte} numberOfLines={1}>{evento.nomeTipoEvento}</Text>
        <Text style={s.cardHint}>{formatarDataHoraEvento(evento.data)}</Text>
      </View>
      <View style={[s.pill, { backgroundColor: sb.bg }]}>
        <Text style={[s.pillText, { color: sb.color }]}>{sb.label}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  const p = theme.pages.vetDashboard;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingVertical: 28, paddingHorizontal: 32 },
    page: { width: '100%', maxWidth: 1280, alignSelf: 'center', gap: 24 },

    headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
    headerInfo: { flex: 1 },
    titulo: { fontSize: 28, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
    subtitulo: { fontSize: 13, color: theme.colors.textSecondary },
    headerActions: { flexDirection: 'row', gap: 12 },
    btn: { height: 40, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: p.border, backgroundColor: p.card, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    btnPrimary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    btnPrimaryText: { color: theme.colors.onPrimary },

    kpis: { flexDirection: 'row', gap: 16 },
    kpi: { flex: 1, gap: 10, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },
    kpiDestaque: { backgroundColor: '#0C2418', borderColor: '#0C2418' },
    kpiTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    kpiLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: theme.colors.textSecondary },
    kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    kpiValor: { fontSize: 34, fontWeight: '800', lineHeight: 38 },
    kpiDestaqueHint: { fontSize: 12, color: '#BFD8CA' },

    colunas: { flexDirection: 'row', gap: 24, alignItems: 'stretch' },
    colAgenda: { flex: 5 },
    colProximos: { flex: 7 },
    card: { padding: 22, borderRadius: 16, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },
    cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    cardHint: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
    link: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },

    vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: p.borderStrong, backgroundColor: p.cardSecondary },
    vazioTitulo: { fontSize: 16, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
    vazioTexto: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 8 },

    linha: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: p.border },
    linhaHead: { borderTopWidth: 0, paddingTop: 0 },
    th: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: theme.colors.textSecondary },
    celula: { fontSize: 14, color: theme.colors.text },
    celulaForte: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    pillText: { fontSize: 12, fontWeight: '600' },
  });
}