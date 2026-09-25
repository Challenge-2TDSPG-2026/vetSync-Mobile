import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMeusResgates } from '../../hooks/useRecompensas';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList, SkeletonCard } from '../../components/ui/Skeleton';
import { DicaTela } from '../../components/ui/DicaTela';
import { STATUS_EXIBICAO_BADGE, formatarDataHoraEvento, statusExibicao } from '../../utils/eventoStatus';
import type { AppTheme } from '../../constants/theme';

export default function VetDashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { sessao } = useAuth();
  const { veterinarioAtivo, eventos, eventosAgendados, eventosDeHoje, pacientes, carregando } = useVet();
  const { data: resgates = [] } = useMeusResgates(true);
  const resgatesPendentes = resgates.filter(r => r.status === 'PENDENTE');
  const eventosConcluidos = eventos.filter(e => e.status === 'CONCLUIDO');
  const faturamento = eventosConcluidos.reduce((total, evento) => total + evento.custo, 0);
  const pacientesComPendencia = pacientes.filter(p => p.eventos.some(e => e.status === 'AGENDADO')).length;
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-painel');

  if (carregando) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <SkeletonCard height={84} borderRadius={16} style={{ marginBottom: 20 }} />
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <SkeletonCard height={72} borderRadius={12} style={{ flex: 1 }} />
          <SkeletonCard height={72} borderRadius={12} style={{ flex: 1 }} />
        </View>
        <SkeletonList linhas={3} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} progressBackgroundColor={theme.colors.surface} />}
    >

      <View style={s.welcome}>
        <View style={s.welcomeIconWrap}>
          <AppIcon name="medical-bag" set="MaterialCommunityIcons" size={30} color={theme.colors.onNavigation} />
        </View>
        <View style={s.welcomeInfo}>
          <Text style={s.welcomeNome}>Olá, {veterinarioAtivo?.nome ?? sessao?.nome}</Text>
          <Text style={s.welcomeSub}>
            CRMV {veterinarioAtivo?.crmv ?? '—'}{veterinarioAtivo?.nomeClinica ? ` • ${veterinarioAtivo.nomeClinica}` : ''}
          </Text>
        </View>
      </View>

      {dicaVisivel && (
        <DicaTela
          titulo="Seu painel"
          texto="Aqui você acompanha os atendimentos do dia e os próximos agendamentos. Use o menu abaixo pra ver consultas, pacientes e resgates."
          accentColor={theme.colors.primary}
          onFechar={fecharDica}
        />
      )}

      <View style={s.statsRow}>
        <StatCard styles={s} valor={eventosAgendados.length} label="Agendados" accentColor={theme.colors.info} />
        <StatCard styles={s} valor={eventosDeHoje.length} label="Hoje" accentColor={theme.colors.success} />
      </View>

      <View style={s.statsRow}>
        <StatCard styles={s} valor={pacientes.length} label="Pacientes" accentColor={theme.colors.primary} />
        <StatCard styles={s} valor={eventosConcluidos.length} label="Concluídos" accentColor={theme.domain.event.vaccine} />
      </View>

      <View style={s.resumoCard}>
        <View style={s.resumoHeader}>
          <View>
            <Text style={s.resumoEyebrow}>Resumo do atendimento</Text>
            <Text style={s.resumoTitle}>Sua operação em um olhar</Text>
          </View>
          <AppIcon name="pulse-outline" set="Ionicons" size={24} color={theme.colors.primary} />
        </View>
        <View style={s.resumoMetrics}>
          <View style={s.resumoMetric}>
            <Text style={s.resumoValue}>{pacientesComPendencia}</Text>
            <Text style={s.resumoLabel}>com retorno pendente</Text>
          </View>
          <View style={s.resumoDivider} />
          <View style={s.resumoMetric}>
            <Text style={s.resumoValue}>R$ {faturamento.toFixed(2).replace('.', ',')}</Text>
            <Text style={s.resumoLabel}>em consultas concluídas</Text>
          </View>
        </View>
      </View>

      <View style={s.quickActions}>
        <Pressable
          style={s.quickAction}
          onPress={() => router.push('/(vet)/pacientes')}
          accessibilityRole="button"
          accessibilityLabel="Ver pacientes"
        >
          <View style={[s.quickIcon, { backgroundColor: theme.colors.infoBackground }]}>
            <AppIcon name="paw" set="Ionicons" size={18} color={theme.colors.info} />
          </View>
          <Text style={s.quickLabel}>Ver pacientes</Text>
        </Pressable>
        <Pressable
          style={s.quickAction}
          onPress={() => router.push('/(vet)/disponibilidade')}
          accessibilityRole="button"
          accessibilityLabel="Ajustar agenda"
        >
          <View style={[s.quickIcon, { backgroundColor: theme.colors.successBackground }]}>
            <AppIcon name="time-outline" set="Ionicons" size={18} color={theme.colors.success} />
          </View>
          <Text style={s.quickLabel}>Ajustar agenda</Text>
        </Pressable>
        <Pressable
          style={s.quickAction}
          onPress={() => router.push('/(vet)/resgates')}
          accessibilityRole="button"
          accessibilityLabel="Resgates"
        >
          <View style={[s.quickIcon, { backgroundColor: theme.colors.warningBackground }]}>
            <AppIcon name="gift-outline" set="Ionicons" size={18} color={theme.colors.warning} />
          </View>
          <Text style={s.quickLabel}>Resgates</Text>
        </Pressable>
      </View>

      {resgatesPendentes.length > 0 && (
        <Pressable
          style={s.alertaResgates}
          onPress={() => router.push('/(vet)/resgates')}
          accessibilityRole="button"
          accessibilityLabel={`${resgatesPendentes.length} resgate${resgatesPendentes.length > 1 ? 's' : ''} aguardando validação`}
        >
          <AppIcon name="gift" set="Ionicons" size={18} color={theme.colors.onPrimary} />
          <Text style={s.alertaResgatesText}>
            {resgatesPendentes.length} resgate{resgatesPendentes.length > 1 ? 's' : ''} aguardando validação
          </Text>
          <AppIcon name="chevron-forward" set="Ionicons" size={16} color={theme.colors.onPrimary} />
        </Pressable>
      )}

      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle} accessibilityRole="header">Próximos agendamentos</Text>
          <Pressable
            onPress={() => router.push('/(vet)/consultas')}
            accessibilityRole="button"
            accessibilityLabel="Ver todas as consultas"
          >
            <Text style={s.linkVer}>Ver todas</Text>
          </Pressable>
        </View>

        {eventosAgendados.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="Nenhum atendimento agendado"
            accentColor={theme.colors.primary}
            variant="plain"
          />
        ) : (
          [...eventosAgendados]
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .slice(0, 5)
            .map((e, idx, arr) => {
            const visual = obterVisualTipoEvento(e.nomeTipoEvento);
            const sb = STATUS_EXIBICAO_BADGE[statusExibicao(e)];
            return (
              <Pressable
                key={e.id}
                style={[s.eventoRow, idx < arr.length - 1 && s.eventoRowBorder]}
                onPress={() => router.push(`/paciente/${e.petId}`)}
                accessibilityRole="button"
                accessibilityLabel={`${e.nomeTipoEvento}, ${formatarDataHoraEvento(e.data)}, ${sb.label}`}
                accessibilityHint="Abre a ficha do paciente"
              >
                <View style={[s.eventoIcone, { backgroundColor: visual.cor }]}>
                  <AppIcon name={visual.icon} set={visual.iconSet} size={16} color={theme.colors.onPrimary} />
                </View>
                <View style={s.eventoInfo}>
                  <Text style={s.eventoTitulo}>{e.nomeTipoEvento}</Text>
                  <Text style={s.eventoData}>{formatarDataHoraEvento(e.data)}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: sb.bg }]}>
                  <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle} accessibilityRole="header">Atendimentos de hoje</Text>
        </View>

        {eventosDeHoje.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nada agendado para hoje"
            accentColor={theme.colors.info}
            variant="plain"
          />
        ) : (
          eventosDeHoje.map((e, idx, arr) => {
            const visual = obterVisualTipoEvento(e.nomeTipoEvento);
            const sb = STATUS_EXIBICAO_BADGE[statusExibicao(e)];
            return (
              <Pressable
                key={e.id}
                style={[s.eventoRow, idx < arr.length - 1 && s.eventoRowBorder]}
                onPress={() => router.push(`/paciente/${e.petId}`)}
                accessibilityRole="button"
                accessibilityLabel={`${e.nomeTipoEvento}, ${formatarDataHoraEvento(e.data)}, ${sb.label}`}
                accessibilityHint="Abre a ficha do paciente"
              >
                <View style={[s.eventoIcone, { backgroundColor: visual.cor }]}>
                  <AppIcon name={visual.icon} set={visual.iconSet} size={16} color={theme.colors.onPrimary} />
                </View>
                <View style={s.eventoInfo}>
                  <Text style={s.eventoTitulo}>{e.nomeTipoEvento}</Text>
                  <Text style={s.eventoData}>{formatarDataHoraEvento(e.data)}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: sb.bg }]}>
                  <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle} accessibilityRole="header">Pacientes recentes</Text>
          <Pressable
            onPress={() => router.push('/(vet)/pacientes')}
            accessibilityRole="button"
            accessibilityLabel="Ver todos os pacientes"
          >
            <Text style={s.linkVer}>Ver todos</Text>
          </Pressable>
        </View>
        {pacientes.length === 0 ? (
          <EmptyState icon="paw-outline" title="Nenhum paciente ainda" accentColor={theme.colors.primary} variant="plain" />
        ) : (
          pacientes.slice(0, 3).map(({ pet, eventos: eventosPet }, idx) => (
            <Pressable
              key={pet.id}
              style={[s.pacienteRow, idx < Math.min(pacientes.length, 3) - 1 && s.eventoRowBorder]}
              onPress={() => router.push(`/paciente/${pet.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${pet.nome}, ${pet.tutor?.nome ?? 'tutor não informado'}, ${eventosPet.length} ${eventosPet.length === 1 ? 'evento' : 'eventos'}`}
              accessibilityHint="Abre a ficha do paciente"
            >
              <View style={s.pacienteAvatar}>
                <AppIcon name="paw" set="Ionicons" size={16} color={theme.colors.primary} />
              </View>
              <View style={s.eventoInfo}>
                <Text style={s.eventoTitulo}>{pet.nome}</Text>
                <Text style={s.eventoData}>
                  {pet.tutor?.nome ?? `Tutor vinculado #${pet.tutor?.id ?? 'não informado'}`}
                </Text>
              </View>
              <Text style={s.pacienteEventos}>{eventosPet.length} {eventosPet.length === 1 ? 'evento' : 'eventos'}</Text>
              <AppIcon name="chevron-forward" set="Ionicons" size={16} color={theme.colors.textSecondary} />
            </Pressable>
          ))
        )}
      </View>

    </ScrollView>
  );
}

function StatCard({ styles, valor, label, accentColor }: { styles: ReturnType<typeof createStyles>; valor: number; label: string; accentColor: string }) {
  return (
    <View style={[styles.statCard, { borderBottomColor: accentColor }]} accessible accessibilityLabel={`${label}: ${valor}`}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statVal, { color: accentColor }]}>{valor}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 32 },
  loadingContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },

  welcome: {
    backgroundColor: theme.colors.navigation,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  welcomeIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  welcomeInfo: { flex: 1 },
  welcomeNome: { fontSize: 17, fontWeight: '700', color: theme.colors.onNavigation, letterSpacing: -0.3 },
  welcomeSub: { fontSize: 12, color: theme.colors.onNavigation, opacity: 0.85, marginTop: 3 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 12, padding: 14, borderBottomWidth: 3,
  },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: theme.colors.textSecondary, marginBottom: 6 },
  statVal: { fontSize: 26, fontWeight: '700', lineHeight: 28 },
  resumoCard: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 16, marginBottom: 16 },
  resumoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  resumoEyebrow: { fontSize: 10, color: theme.colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  resumoTitle: { fontSize: 15, color: theme.colors.text, fontWeight: '700', marginTop: 3 },
  resumoMetrics: { flexDirection: 'row', alignItems: 'center' },
  resumoMetric: { flex: 1 },
  resumoValue: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  resumoLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 3 },
  resumoDivider: { width: 1, height: 34, backgroundColor: theme.colors.border, marginHorizontal: 14 },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickAction: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 11, alignItems: 'center', gap: 7 },
  quickIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 10, color: theme.colors.text, fontWeight: '700', textAlign: 'center' },

  alertaResgates: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.domain.reward.gold, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 20,
  },
  alertaResgatesText: { flex: 1, fontSize: 13, fontWeight: '700', color: theme.colors.onPrimary },

  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  cardHead: {
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surfaceSubtle,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  linkVer: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },

  eventoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  eventoRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  eventoIcone: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  eventoData: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  pacienteRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  pacienteAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.successBackground, justifyContent: 'center', alignItems: 'center' },
  pacienteEventos: { fontSize: 10, color: theme.colors.textSecondary, marginRight: 2 },

  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
});