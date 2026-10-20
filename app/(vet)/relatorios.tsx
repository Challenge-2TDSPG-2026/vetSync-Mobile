import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useRelatorioClinica } from '../../hooks/useRelatorios';
import type { AppTheme } from '../../constants/theme';
import { VetPageIntro } from '../../components/vet/VetPageIntro';

type Periodo = 'mes' | '7dias' | '30dias';

function intervaloRelatorio(periodo: Periodo) {
  const hoje = new Date();
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicio = new Date(fim);
  if (periodo === 'mes') inicio.setDate(1);
  else inicio.setDate(inicio.getDate() - (periodo === '7dias' ? 6 : 29));
  const iso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  return { inicio: iso(inicio), fim: iso(fim) };
}

export default function VetRelatoriosScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const s = useMemo(() => styles(theme), [theme]);
  const { sessao } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const intervalo = intervaloRelatorio(periodo);
  const { data, isLoading, isError } = useRelatorioClinica(intervalo.inicio, intervalo.fim, sessao?.perfil === 'VETERINARIO');
  const intervaloAnterior = useMemo(() => {
    const inicio = new Date(`${intervalo.inicio}T12:00:00`);
    const fim = new Date(`${intervalo.fim}T12:00:00`);
    const duracao = Math.round((fim.getTime() - inicio.getTime()) / 86_400_000) + 1;
    const fimAnt = new Date(inicio); fimAnt.setDate(fimAnt.getDate() - 1);
    const inicioAnt = new Date(fimAnt); inicioAnt.setDate(inicioAnt.getDate() - duracao + 1);
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { inicio: iso(inicioAnt), fim: iso(fimAnt) };
  }, [intervalo.inicio, intervalo.fim]);
  const anterior = useRelatorioClinica(intervaloAnterior.inicio, intervaloAnterior.fim, sessao?.perfil === 'VETERINARIO');

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
      <View style={s.periodos}>
        {([['7dias', '7 dias'], ['30dias', '30 dias'], ['mes', 'Este mês']] as const).map(([valor, label]) => (
          <Pressable key={valor} onPress={() => setPeriodo(valor)} style={[s.periodo, periodo === valor && s.periodoAtivo]} accessibilityRole="button" accessibilityState={{ selected: periodo === valor }}>
            <Text style={[s.periodoTexto, periodo === valor && s.periodoTextoAtivo]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? <ActivityIndicator color={theme.colors.primary} style={s.loading} /> : null}
      {isError ? <Text style={s.error}>Não foi possível carregar os relatórios. Tente novamente mais tarde.</Text> : null}
      {data ? (
        <View style={s.grid}>
          <Metric styles={s} theme={theme} label="Agendadas" value={data.consultasAgendadas} anterior={anterior.data?.consultasAgendadas} />
          <Metric styles={s} theme={theme} label="Concluídas" value={data.consultasConcluidas} anterior={anterior.data?.consultasConcluidas} accent={theme.colors.success} />
          <Metric styles={s} theme={theme} label="Cancelamentos" value={data.cancelamentos} anterior={anterior.data?.cancelamentos} accent={theme.colors.danger} />
          <Metric styles={s} theme={theme} label="Pacientes atendidos" value={data.pacientesAtendidos} anterior={anterior.data?.pacientesAtendidos} accent={theme.colors.info} />
          <Metric styles={s} theme={theme} label="Vacinas aplicadas" value={data.vacinasAplicadas} anterior={anterior.data?.vacinasAplicadas} accent={theme.domain.event.vaccine} />
          <Metric styles={s} theme={theme} label="Faturamento" value={`R$ ${data.faturamento.toFixed(2).replace('.', ',')}`} anterior={anterior.data?.faturamento} wide />
          {data.faltas !== undefined ? <Metric styles={s} theme={theme} label="Faltas" value={data.faltas} anterior={anterior.data?.faltas} accent={theme.colors.danger} /> : null}
          {data.retornosPendentes !== undefined ? <Metric styles={s} theme={theme} label="Retornos pendentes" value={data.retornosPendentes} anterior={anterior.data?.retornosPendentes} accent={theme.colors.warning} /> : null}
          {data.tempoMedioConclusaoHoras !== undefined ? <Metric styles={s} theme={theme} label="Tempo médio de conclusão" value={`${data.tempoMedioConclusaoHoras.toFixed(1).replace('.', ',')} h`} anterior={anterior.data?.tempoMedioConclusaoHoras} /> : null}
        </View>
      ) : null}
      {data ? <Text style={s.comparativoHint}>{anterior.isLoading ? 'Carregando comparação com o período anterior…' : 'Variação comparada ao período imediatamente anterior, com a mesma duração.'}</Text> : null}
    </ScrollView>
  );
}

function Metric({ styles: s, theme, label, value, anterior, accent, wide }: { styles: ReturnType<typeof styles>; theme: AppTheme; label: string; value: string | number; anterior?: number; accent?: string; wide?: boolean }) {
  const atualNumerico = typeof value === 'number' ? value : Number(String(value).replace(/[^\d,.-]/g, '').replace(',', '.'));
  const variacao = anterior === undefined || anterior === 0 ? null : Math.round(((atualNumerico - anterior) / Math.abs(anterior)) * 100);
  const anteriorExibido = label === 'Faturamento' && anterior !== undefined ? `R$ ${anterior.toFixed(2).replace('.', ',')}` : anterior;
  return <View style={[s.metricCard, wide && s.metricWide]}><Text style={[s.metricValue, accent ? { color: accent } : null]}>{value}</Text><Text style={s.metricLabel}>{label}</Text>{anterior !== undefined ? <Text style={s.variacao}>{variacao === null ? `Período anterior: ${anteriorExibido}` : `${variacao > 0 ? '+' : ''}${variacao}% · anterior ${anteriorExibido}`}</Text> : <Text style={s.variacao}>Comparação indisponível</Text>}</View>;
}

const styles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 44 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, paddingVertical: 4 },
  periodos: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  periodo: { flex: 1, alignItems: 'center', borderRadius: 18, paddingVertical: 9, borderWidth: 1, borderColor: theme.pages.vetReports.border, backgroundColor: theme.pages.vetReports.card },
  periodoAtivo: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  periodoTexto: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  periodoTextoAtivo: { color: theme.colors.onPrimary },
  backButtonText: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },
  loading: { marginTop: 30 },
  error: { color: theme.colors.danger, backgroundColor: theme.colors.dangerBackground, borderRadius: 10, padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { width: '48%', backgroundColor: theme.pages.vetReports.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.pages.vetReports.border, marginBottom: 12, elevation: 2 },
  metricWide: { width: '100%' },
  metricValue: { fontSize: 22, fontWeight: '800', color: theme.pages.vetReports.primary },
  metricLabel: { color: theme.pages.vetReports.textSecondary, fontSize: 11, marginTop: 5, fontWeight: '700' },
  variacao: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 7, fontWeight: '600' },
  comparativoHint: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 1, marginBottom: 8, textAlign: 'center' },
});
