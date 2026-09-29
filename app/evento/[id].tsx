import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePet } from '../../context/PetContext';
import { useAuth } from '../../context/AuthContext';
import { useEventoDetalhes } from '../../hooks/useEventos';
import { useTheme } from '../../context/ThemeContext';
import { obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { STATUS_EXIBICAO_BADGE, formatarDataHoraEvento, statusExibicao } from '../../utils/eventoStatus';
import { useAuditoria } from '../../hooks/useRelatorios';
import { withAlpha, type AppTheme } from '../../constants/theme';

export default function EventoDetalhesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { eventos, petAtivo, carregandoEventos } = usePet();
  const { autenticado } = useAuth();
  const evento = eventos.find(item => item.id === id);
  const detalhes = useEventoDetalhes(id ?? null, autenticado);
  const auditoria = useAuditoria('EVENTO', id ?? null, autenticado);

  if (carregandoEventos || (detalhes.isLoading && !evento)) {
    return <View style={s.loading}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  if (!evento) {
    return (
      <View style={s.loading}>
        <Ionicons name="search-outline" size={42} color={theme.colors.textMuted} />
        <Text style={s.emptyTitle}>Evento não encontrado</Text>
        <Text style={s.emptyText}>Esse evento pode ter sido removido ou não pertence ao pet ativo.</Text>
        <Pressable style={s.primaryButton} onPress={() => router.back()}>
          <Text style={s.primaryButtonText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const visual = obterVisualTipoEvento(evento.nomeTipoEvento);
  const status = statusExibicao(evento);
  const badge = STATUS_EXIBICAO_BADGE[status];
  const clinico = detalhes.data;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backButton} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={24} color={theme.pages.eventDetails.heroText} />
        </Pressable>
        <Text style={s.headerTitle}>Detalhes do evento</Text>
      </View>

      <View style={[s.hero, { backgroundColor: visual.cor }]}>
        <View style={s.heroIcon}>
          <AppIcon name={visual.icon} set={visual.iconSet} size={30} color={theme.colors.onPrimary} />
        </View>
        <Text style={s.heroTitle}>{evento.nomeTipoEvento}</Text>
        <Text style={s.heroPet}>{petAtivo?.nome ?? 'Pet ativo'}</Text>
        <View style={[s.badge, { backgroundColor: badge.bg }]}>
          <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={s.card}>
        <InfoRow icon="calendar-outline" label="Data e horário" value={formatarDataHoraEvento(evento.data)} colors={theme.colors} />
        <InfoRow icon="medical-outline" label="Veterinário" value={evento.nomeVeterinario || 'Não informado'} colors={theme.colors} />
        <InfoRow icon="pricetag-outline" label="Categoria" value={evento.categoriaTipoEvento?.replace('_', ' ') ?? 'Não informada'} colors={theme.colors} />
        {evento.custo > 0 && <InfoRow icon="cash-outline" label="Custo" value={`R$ ${evento.custo.toFixed(2).replace('.', ',')}`} colors={theme.colors} />}
      </View>

      {(evento.observacao || evento.motivoCancelamento || clinico?.tutorObservacao) && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>{evento.status === 'CANCELADO' ? 'Motivo do cancelamento' : 'Observações'}</Text>
          <Text style={s.description}>{evento.motivoCancelamento || clinico?.tutorObservacao || evento.observacao}</Text>
        </View>
      )}

      {clinico && (clinico.observacaoClinica || clinico.diagnostico || clinico.conduta) && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Informações clínicas</Text>
          {clinico.observacaoClinica && <ClinicalRow label="Observação clínica" value={clinico.observacaoClinica} styles={s} />}
          {clinico.diagnostico && <ClinicalRow label="Diagnóstico" value={clinico.diagnostico} styles={s} />}
          {clinico.conduta && <ClinicalRow label="Conduta" value={clinico.conduta} styles={s} />}
        </View>
      )}

      {auditoria.data?.length ? (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Histórico de alterações</Text>
          {auditoria.data.map((registro, index) => (
            <View key={registro.id} style={[s.auditRow, index > 0 && s.auditDivider]}>
              <Text style={s.auditAction}>{registro.acao}</Text>
              <Text style={s.auditMeta}>{registro.usuarioResponsavel} • {new Date(registro.dataHora).toLocaleString('pt-BR')}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable style={s.secondaryButton} onPress={() => router.push('/(tutor)/agenda')}>
        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
        <Text style={s.secondaryButtonText}>Ver na agenda</Text>
      </Pressable>
    </ScrollView>
  );
}

function ClinicalRow({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.clinicalRow}><Text style={styles.clinicalLabel}>{label}</Text><Text style={styles.description}>{value}</Text></View>;
}

function InfoRow({ icon, label, value, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; colors: AppTheme['colors'] }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.infoCopy}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingBottom: 32 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.colors.background },
    emptyTitle: { marginTop: 14, fontSize: 18, fontWeight: '800', color: theme.colors.text },
    emptyText: { marginTop: 8, textAlign: 'center', color: theme.colors.textSecondary, lineHeight: 20 },
    header: { height: 104, paddingTop: 44, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.pages.eventDetails.heroBackground },
    backButton: { marginRight: 10 },
    headerTitle: { color: theme.pages.eventDetails.heroText, fontSize: 20, fontWeight: '800' },
    hero: { margin: 16, borderRadius: 22, padding: 22, alignItems: 'center' },
    heroIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(theme.pages.eventDetails.heroText, 0.2) },
    heroTitle: { marginTop: 12, color: theme.colors.onPrimary, fontSize: 23, fontWeight: '800', textAlign: 'center' },
    heroPet: { marginTop: 4, color: withAlpha(theme.pages.eventDetails.heroText, 0.86), fontSize: 14 },
    badge: { marginTop: 14, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    badgeText: { fontSize: 12, fontWeight: '800' },
    card: { marginHorizontal: 16, marginBottom: 14, padding: 18, borderRadius: 18, backgroundColor: theme.pages.eventDetails.card, borderWidth: 1, borderColor: theme.pages.eventDetails.border },
    sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 },
    description: { color: theme.colors.textSecondary, lineHeight: 22 },
    clinicalRow: { marginBottom: 12 },
    clinicalLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 3 },
    auditRow: { paddingVertical: 8 },
    auditDivider: { borderTopWidth: 1, borderTopColor: theme.pages.eventDetails.border },
    auditAction: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
    auditMeta: { color: theme.colors.textMuted, fontSize: 11, marginTop: 3 },
    primaryButton: { marginTop: 20, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13, backgroundColor: theme.colors.primary },
    primaryButtonText: { color: theme.colors.onPrimary, fontWeight: '800' },
    secondaryButton: { margin: 16, marginTop: 2, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    secondaryButtonText: { color: theme.colors.primary, fontWeight: '800' },
  });
}

const styles = StyleSheet.create({
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  infoCopy: { marginLeft: 13, flex: 1 },
  infoLabel: { fontSize: 12, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '700' },
});
