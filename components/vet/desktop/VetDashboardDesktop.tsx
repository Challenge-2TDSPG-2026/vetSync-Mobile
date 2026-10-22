import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useHomeVet } from '../../../hooks/useHomeVet';
import { useRecarregarDados } from '../../../hooks/useRecarregarDados';
import { obterVisualTipoEvento } from '../../../constants';
import { AppIcon } from '../../AppIcon';
import { SkeletonCard } from '../../ui/Skeleton';
import { dataPorExtenso, horaCurta, quandoAcontece } from '../../../utils/agendaVet';
import { formatarHora } from '../../../utils/atendimentoVet';
import { STATUS_EXIBICAO_BADGE, statusExibicao } from '../../../utils/eventoStatus';
import type { AppTheme } from '../../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Rota = '/(vet)/consultas' | '/(vet)/pacientes' | '/(vet)/resgates';

/** Painel do veterinário para desktop: mesmos elementos da home mobile (próximo atendimento, pendências, resto do dia e pacientes recentes). */
export function VetDashboardDesktop() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { sessao } = useAuth();
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const {
    carregando, veterinarioAtivo, eventosDeHoje, atrasados, concluidosHoje, pacientes, pacientesComPendencia,
    resgatesPendentes, atendimento, eventoHero, emAtendimento, podeIniciar, petProximo, petDoEvento, restoDoDia, acionarHero,
  } = useHomeVet();

  const nome = veterinarioAtivo?.nome ?? sessao?.nome ?? 'Veterinário';

  if (carregando) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.page}>
          <SkeletonCard height={60} borderRadius={12} />
          <View style={s.kpis}>
            {[0, 1, 2, 3].map(i => <SkeletonCard key={i} height={96} borderRadius={16} style={{ flex: 1 }} />)}
          </View>
          <SkeletonCard height={220} borderRadius={20} />
        </View>
      </ScrollView>
    );
  }

  const kpis: { label: string; valor: number; icon: IconName; cor: string; fundo: string; rota: Rota }[] = [
    { label: 'Hoje', valor: eventosDeHoje.length, icon: 'time-outline', cor: theme.colors.success, fundo: theme.colors.successBackground, rota: '/(vet)/consultas' },
    { label: 'Atrasados', valor: atrasados.length, icon: 'alert-circle-outline', cor: theme.colors.danger, fundo: theme.colors.dangerBackground, rota: '/(vet)/consultas' },
    { label: 'Retornos', valor: pacientesComPendencia, icon: 'repeat-outline', cor: theme.colors.info, fundo: theme.colors.infoBackground, rota: '/(vet)/pacientes' },
    { label: 'Resgates', valor: resgatesPendentes, icon: 'gift-outline', cor: theme.colors.warning, fundo: theme.colors.warningBackground, rota: '/(vet)/resgates' },
  ];

  const rotuloBotao = emAtendimento ? 'Continuar atendimento' : podeIniciar ? 'Iniciar atendimento' : 'Ver ficha';
  const nomePet = petProximo?.nome ?? 'Paciente';

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} />}
    >
      <View style={s.page}>
        <View style={s.headerRow}>
          <View style={s.headerInfo}>
            <Text style={s.titulo} accessibilityRole="header">Olá, {nome}</Text>
            <Text style={s.subtitulo}>
              {dataPorExtenso(new Date())}{veterinarioAtivo?.nomeClinica ? ` · ${veterinarioAtivo.nomeClinica}` : ''}
            </Text>
          </View>
          <Pressable style={s.btn} onPress={() => router.push('/(vet)/consultas')} accessibilityRole="button" accessibilityLabel="Abrir agenda">
            <Text style={s.btnText}>Abrir agenda</Text>
          </Pressable>
        </View>

        <View style={s.kpis}>
          {kpis.map(kpi => (
            <Pressable
              key={kpi.label}
              style={({ pressed }) => [s.kpi, pressed && s.pressed]}
              onPress={() => router.push(kpi.rota)}
              accessibilityRole="button"
              accessibilityLabel={`${kpi.label}: ${kpi.valor}`}
            >
              <View style={s.kpiTop}>
                <Text style={s.kpiLabel}>{kpi.label}</Text>
                <View style={[s.kpiIcon, { backgroundColor: kpi.fundo }]}>
                  <Ionicons name={kpi.icon} size={18} color={kpi.cor} />
                </View>
              </View>
              <Text style={[s.kpiValor, { color: kpi.valor > 0 || kpi.label === 'Hoje' ? kpi.cor : theme.colors.textSecondary }]}>{kpi.valor}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.colunas}>
          <View style={s.colPrincipal}>
            {eventoHero ? (
              <View style={s.hero}>
                <Text style={s.heroEyebrow}>
                  {emAtendimento && atendimento
                    ? `EM ATENDIMENTO • DESDE ${formatarHora(new Date(atendimento.inicioISO))}`
                    : `PRÓXIMO ATENDIMENTO • ${quandoAcontece(eventoHero.data).toUpperCase()}`}
                </Text>
                <View style={s.heroLinha}>
                  <View style={s.heroAvatar}>
                    <AppIcon name="paw" set="Ionicons" size={30} color={theme.pages.vetDashboard.heroText} />
                  </View>
                  <View style={s.heroInfo}>
                    <Text style={s.heroPet} numberOfLines={1}>{nomePet}</Text>
                    <Text style={s.heroDetalhe} numberOfLines={2}>
                      {eventoHero.nomeTipoEvento}{petProximo?.tutor?.nome ? ` • ${petProximo.tutor.nome}` : ''}{eventoHero.data.length > 10 ? ` • ${horaCurta(eventoHero.data)}` : ''}
                    </Text>
                  </View>
                  <View style={s.heroAcoes}>
                    <Pressable
                      style={({ pressed }) => [s.heroPrimary, pressed && s.pressed]}
                      onPress={acionarHero}
                      accessibilityRole="button"
                      accessibilityLabel={`${rotuloBotao} de ${nomePet}`}
                      accessibilityHint={emAtendimento || podeIniciar ? 'Abre o bloco de notas do atendimento' : 'Abre a ficha do paciente'}
                    >
                      <Text style={s.heroPrimaryText}>{rotuloBotao}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [s.heroSecondary, pressed && s.pressed]}
                      onPress={() => router.push(`/paciente/${eventoHero.petId}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`Abrir ficha de ${nomePet}`}
                    >
                      <Text style={s.heroSecondaryText}>Ficha</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.hero}>
                <Text style={s.heroEyebrow}>PRÓXIMO ATENDIMENTO</Text>
                <Text style={s.heroVazioTitulo}>Nenhum atendimento agendado</Text>
                <Text style={s.heroVazioTexto}>Quando houver um novo agendamento, ele aparece aqui em destaque.</Text>
                <Pressable style={({ pressed }) => [s.heroPrimary, s.heroVazioBtn, pressed && s.pressed]} onPress={() => router.push('/(vet)/consultas')} accessibilityRole="button" accessibilityLabel="Ver consultas">
                  <Text style={s.heroPrimaryText}>Ver consultas</Text>
                </Pressable>
              </View>
            )}

            <View style={s.card}>
              <View style={s.cardHead}>
                <View>
                  <Text style={s.cardTitle} accessibilityRole="header">Resto do dia</Text>
                  <Text style={s.cardHint}>
                    {eventosDeHoje.length} atendimento{eventosDeHoje.length === 1 ? '' : 's'} hoje · {concluidosHoje} concluído{concluidosHoje === 1 ? '' : 's'}
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/(vet)/consultas')} accessibilityRole="button" accessibilityLabel="Ver agenda">
                  <Text style={s.link}>Ver agenda →</Text>
                </Pressable>
              </View>

              {restoDoDia.length === 0 ? (
                <View style={s.vazio}>
                  <Text style={s.vazioTitulo}>Nada mais para hoje</Text>
                  <Text style={s.vazioTexto}>Quando houver outros atendimentos ou atrasos, eles aparecem aqui em ordem de horário.</Text>
                </View>
              ) : (
                restoDoDia.map(e => {
                  const visual = obterVisualTipoEvento(e.nomeTipoEvento);
                  const sb = STATUS_EXIBICAO_BADGE[statusExibicao(e)];
                  const pet = petDoEvento(e.petId);
                  const hora = e.data.length > 10 ? horaCurta(e.data) : '';
                  return (
                    <Pressable
                      key={e.id}
                      style={({ pressed }) => [s.linha, pressed && s.pressed]}
                      onPress={() => router.push(`/paciente/${e.petId}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`${pet?.nome ?? 'Paciente'}, ${e.nomeTipoEvento}, ${sb.label}`}
                      accessibilityHint="Abre a ficha do paciente"
                    >
                      <View style={[s.linhaIcone, { backgroundColor: visual.cor }]}>
                        <AppIcon name={visual.icon} set={visual.iconSet} size={16} color={theme.colors.onPrimary} />
                      </View>
                      <View style={s.linhaInfo}>
                        <Text style={s.celulaForte} numberOfLines={1}>{pet?.nome ? `${pet.nome} • ${e.nomeTipoEvento}` : e.nomeTipoEvento}</Text>
                        <Text style={s.cardHint} numberOfLines={1}>{[hora, pet?.tutor?.nome].filter(Boolean).join(' • ') || 'Sem horário definido'}</Text>
                      </View>
                      <View style={[s.pill, { backgroundColor: sb.bg }]}>
                        <Text style={[s.pillText, { color: sb.color }]}>{sb.label}</Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>

          <View style={[s.card, s.colLateral]}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle} accessibilityRole="header">Pacientes recentes</Text>
              <Pressable onPress={() => router.push('/(vet)/pacientes')} accessibilityRole="button" accessibilityLabel="Ver todos os pacientes">
                <Text style={s.link}>Ver todos →</Text>
              </Pressable>
            </View>
            {pacientes.length === 0 ? (
              <View style={s.vazio}>
                <Text style={s.vazioTitulo}>Nenhum paciente ainda</Text>
                <Text style={s.vazioTexto}>Os pacientes atendidos aparecem aqui.</Text>
              </View>
            ) : (
              pacientes.slice(0, 6).map(({ pet, eventos }) => (
                <Pressable
                  key={pet.id}
                  style={({ pressed }) => [s.linha, pressed && s.pressed]}
                  onPress={() => router.push(`/paciente/${pet.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${pet.nome}, abrir ficha`}
                >
                  <View style={s.pacienteAvatar}>
                    <AppIcon name="paw" set="Ionicons" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={s.linhaInfo}>
                    <Text style={s.celulaForte} numberOfLines={1}>{pet.nome}</Text>
                    <Text style={s.cardHint} numberOfLines={1}>{pet.tutor?.nome ?? 'Tutor não informado'}</Text>
                  </View>
                  <Text style={s.cardHint}>{eventos.length} evento{eventos.length === 1 ? '' : 's'}</Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
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
    btn: { height: 40, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: p.border, backgroundColor: p.card, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },

    kpis: { flexDirection: 'row', gap: 16 },
    kpi: { flex: 1, gap: 10, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },
    kpiTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    kpiLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: theme.colors.textSecondary },
    kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    kpiValor: { fontSize: 34, fontWeight: '800', lineHeight: 38 },

    colunas: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
    colPrincipal: { flex: 7, gap: 24 },
    colLateral: { flex: 4 },

    hero: { backgroundColor: p.heroBackground, borderRadius: 22, padding: 26 },
    heroEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.9, color: theme.colors.brandAccent },
    heroLinha: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 16 },
    heroAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
    heroInfo: { flex: 1 },
    heroPet: { fontSize: 28, fontWeight: '800', color: p.heroText },
    heroDetalhe: { fontSize: 14, color: p.heroText, opacity: 0.82, marginTop: 4, lineHeight: 20 },
    heroAcoes: { flexDirection: 'row', gap: 10 },
    heroPrimary: { backgroundColor: theme.colors.brandAccent, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
    heroPrimaryText: { fontSize: 14, fontWeight: '800', color: '#0a2218' },
    heroSecondary: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
    heroSecondaryText: { fontSize: 14, fontWeight: '800', color: p.heroText },
    heroVazioTitulo: { fontSize: 22, fontWeight: '800', color: p.heroText, marginTop: 12 },
    heroVazioTexto: { fontSize: 14, color: p.heroText, opacity: 0.8, marginTop: 6, lineHeight: 20 },
    heroVazioBtn: { alignSelf: 'flex-start', marginTop: 18 },

    card: { padding: 22, borderRadius: 16, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },
    cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    cardHint: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    link: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },

    vazio: { alignItems: 'center', justifyContent: 'center', gap: 6, padding: 28, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: p.borderStrong, backgroundColor: p.cardSecondary },
    vazioTitulo: { fontSize: 15, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
    vazioTexto: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' },

    linha: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: p.border },
    linhaIcone: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    linhaInfo: { flex: 1, minWidth: 0 },
    celulaForte: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    pillText: { fontSize: 12, fontWeight: '600' },
    pacienteAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.successBackground, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.76 },
  });
}
