import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useRelatorioClinica } from '../../hooks/useRelatorios';
import type { AppTheme } from '../../constants/theme';

function intervaloMesAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const iso = (data: Date) => data.toISOString().slice(0, 10);
  return { inicio: iso(inicio), fim: iso(fim) };
}

export default function VetRelatoriosScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const { sessao } = useAuth();
  const intervalo = intervaloMesAtual();
  const { data, isLoading, isError } = useRelatorioClinica(intervalo.inicio, intervalo.fim, sessao?.perfil === 'VETERINARIO');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Stack.Screen options={{ title: 'Relatórios da clínica' }} />
      <Text style={s.title}>Resumo da clínica</Text>
      <Text style={s.subtitle}>Indicadores de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.</Text>
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
  content: { padding: 16, paddingBottom: 40 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: theme.colors.textSecondary, marginTop: 4, marginBottom: 18 },
  loading: { marginTop: 30 },
  error: { color: theme.colors.danger, backgroundColor: theme.colors.dangerBackground, borderRadius: 10, padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { width: '48%', backgroundColor: theme.pages.vetReports.card, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: theme.pages.vetReports.border, marginBottom: 10 },
  metricWide: { width: '100%' },
  metricValue: { fontSize: 22, fontWeight: '800', color: theme.pages.vetReports.primary },
  metricLabel: { color: theme.pages.vetReports.textSecondary, fontSize: 11, marginTop: 5, fontWeight: '700' },
});
