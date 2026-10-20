import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useRelatorioClinica } from '../../hooks/useRelatorios';
import type { AppTheme } from '../../constants/theme';
import { VetPageIntro } from '../../components/vet/VetPageIntro';

function intervaloMesAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const iso = (data: Date) => data.toISOString().slice(0, 10);
  return { inicio: iso(inicio), fim: iso(fim) };
}

export default function VetRelatoriosScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const s = useMemo(() => styles(theme), [theme]);
  const { sessao } = useAuth();
  const intervalo = intervaloMesAtual();
  const { data, isLoading, isError } = useRelatorioClinica(intervalo.inicio, intervalo.fim, sessao?.perfil === 'VETERINARIO');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Stack.Screen options={{ title: 'Relatórios da clínica' }} />
      <Pressable
        style={s.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Ionicons name="arrow-back" size={21} color={theme.colors.primary} />
        <Text style={s.backButtonText}>Voltar</Text>
      </Pressable>
      <VetPageIntro eyebrow="VISÃO DO NEGÓCIO" title="Relatórios" description={`Indicadores da clínica para ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.`} icon="bar-chart-outline" />
      {isLoading ? <ActivityIndicator color={theme.colors.primary} style={s.loading} /> : null}
      {isError ? <Text style={s.error}>Não foi possível carregar os relatórios. Tente novamente mais tarde.</Text> : null}
      {data ? (
        <View style={s.grid}>
          <Metric styles={s} theme={theme} label="Agendadas" value={data.consultasAgendadas} />
          <Metric styles={s} theme={theme} label="Concluídas" value={data.consultasConcluidas} accent={theme.colors.success} />
          <Metric styles={s} theme={theme} label="Cancelamentos" value={data.cancelamentos} accent={theme.colors.danger} />
          <Metric styles={s} theme={theme} label="Pacientes atendidos" value={data.pacientesAtendidos} accent={theme.colors.info} />
          <Metric styles={s} theme={theme} label="Vacinas aplicadas" value={data.vacinasAplicadas} accent={theme.domain.event.vaccine} />
          <Metric styles={s} theme={theme} label="Faturamento" value={`R$ ${data.faturamento.toFixed(2).replace('.', ',')}`} wide />
        </View>
      ) : null}
    </ScrollView>
  );
}

function Metric({ styles: s, theme, label, value, accent, wide }: { styles: ReturnType<typeof styles>; theme: AppTheme; label: string; value: string | number; accent?: string; wide?: boolean }) {
  return <View style={[s.metricCard, wide && s.metricWide]}><Text style={[s.metricValue, accent ? { color: accent } : null]}>{value}</Text><Text style={s.metricLabel}>{label}</Text></View>;
}

const styles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 44 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, paddingVertical: 4 },
  backButtonText: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },
  loading: { marginTop: 30 },
  error: { color: theme.colors.danger, backgroundColor: theme.colors.dangerBackground, borderRadius: 10, padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { width: '48%', backgroundColor: theme.pages.vetReports.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.pages.vetReports.border, marginBottom: 12, elevation: 2 },
  metricWide: { width: '100%' },
  metricValue: { fontSize: 22, fontWeight: '800', color: theme.pages.vetReports.primary },
  metricLabel: { color: theme.pages.vetReports.textSecondary, fontSize: 11, marginTop: 5, fontWeight: '700' },
});
