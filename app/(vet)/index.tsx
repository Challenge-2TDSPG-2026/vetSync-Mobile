import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { useAuth } from '../../context/AuthContext';
import { useMeusResgates } from '../../hooks/useRecompensas';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList, SkeletonCard } from '../../components/ui/Skeleton';
import { STATUS_EXIBICAO_BADGE, formatarDataHoraEvento, statusExibicao } from '../../utils/eventoStatus';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g200: '#a8e6c7', g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', w50: '#f9f7f4', w100: '#f0ece5',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', warn: '#e67e22', info: '#2563eb',
};

export default function VetDashboardScreen() {
  const router = useRouter();
  const { sessao } = useAuth();
  const { veterinarioAtivo, eventosAgendados, eventosDeHoje, carregando } = useVet();
  const { data: resgates = [] } = useMeusResgates(true);
  const resgatesPendentes = resgates.filter(r => r.status === 'PENDENTE');
  const { atualizando, aoAtualizar } = useRecarregarDados();

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
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={C.g600} colors={[C.g600]} />}
    >

      <View style={s.welcome}>
        <View style={s.welcomeIconWrap}>
          <AppIcon name="medical-bag" set="MaterialCommunityIcons" size={30} color={C.white} />
        </View>
        <View style={s.welcomeInfo}>
          <Text style={s.welcomeNome}>Olá, {veterinarioAtivo?.nome ?? sessao?.nome}</Text>
          <Text style={s.welcomeSub}>
            CRMV {veterinarioAtivo?.crmv ?? '—'}{veterinarioAtivo?.nomeClinica ? ` • ${veterinarioAtivo.nomeClinica}` : ''}
          </Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <StatCard valor={eventosAgendados.length} label="Agendados" accentColor={C.info} />
        <StatCard valor={eventosDeHoje.length} label="Hoje" accentColor={C.g500} />
      </View>

      {resgatesPendentes.length > 0 && (
        <Pressable style={s.alertaResgates} onPress={() => router.push('/(vet)/resgates')}>
          <AppIcon name="gift" set="Ionicons" size={18} color={C.white} />
          <Text style={s.alertaResgatesText}>
            {resgatesPendentes.length} resgate{resgatesPendentes.length > 1 ? 's' : ''} aguardando validação
          </Text>
          <AppIcon name="chevron-forward" set="Ionicons" size={16} color={C.white} />
        </Pressable>
      )}

      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>Próximos agendamentos</Text>
          <Pressable onPress={() => router.push('/(vet)/consultas')}>
            <Text style={s.linkVer}>Ver todas</Text>
          </Pressable>
        </View>

        {eventosAgendados.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="Nenhum atendimento agendado"
            accentColor={C.g600}
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
              >
                <View style={[s.eventoIcone, { backgroundColor: visual.cor }]}>
                  <AppIcon name={visual.icon} set={visual.iconSet} size={16} color={C.white} />
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
          <Text style={s.cardTitle}>Atendimentos de hoje</Text>
        </View>

        {eventosDeHoje.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nada agendado para hoje"
            accentColor={C.info}
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
              >
                <View style={[s.eventoIcone, { backgroundColor: visual.cor }]}>
                  <AppIcon name={visual.icon} set={visual.iconSet} size={16} color={C.white} />
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

    </ScrollView>
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
  content: { padding: 20, paddingBottom: 32 },
  loadingContainer: { flex: 1, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center' },

  welcome: {
    backgroundColor: C.g800,
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
  welcomeNome: { fontSize: 17, fontWeight: '700', color: C.white, letterSpacing: -0.3 },
  welcomeSub: { fontSize: 12, color: 'rgba(168,230,199,0.85)', marginTop: 3 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 14, borderBottomWidth: 3,
  },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: C.muted, marginBottom: 6 },
  statVal: { fontSize: 26, fontWeight: '700', lineHeight: 28 },

  alertaResgates: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#c99a2e', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 20,
  },
  alertaResgatesText: { flex: 1, fontSize: 13, fontWeight: '700', color: C.white },

  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  cardHead: {
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.w50,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  linkVer: { fontSize: 13, color: C.g600, fontWeight: '600' },

  eventoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  eventoRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  eventoIcone: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 13, fontWeight: '600', color: C.text },
  eventoData: { fontSize: 12, color: C.muted, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { fontSize: 13, fontWeight: '700', color: C.text },
});