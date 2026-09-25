import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePet } from '../../context/PetContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import {
  useCatalogoRecompensas,
  useSaldoRecompensas,
  useMeusResgates,
  useResgatar,
} from '../../hooks/useRecompensas';
import { useConquistas } from '../../hooks/useConquistas';
import { AppIcon } from '../../components/AppIcon';
import { PetSwitcher } from '../../components/PetSwitcher';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { mostrarToast } from '../../components/ui/Toast';
import { DicaTela } from '../../components/ui/DicaTela';
import { confirmar } from '../../utils/alert';
import { META_CONSULTAS_RECOMPENSA } from '../../constants/gamification';
import type { Recompensa } from '../../types';
import type { AppTheme } from '../../constants/theme';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RecompensasScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { petAtivo, eventos, nivelInfo } = usePet();
  const { modoSimples } = useAccessibility();
  const { autenticado } = useAuth();
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('tutor-recompensas');
  const [mostrarCatalogoCompleto, setMostrarCatalogoCompleto] = useState(false);

  const { data: catalogo = [], isLoading: carregandoCatalogo } = useCatalogoRecompensas(autenticado);
  const { data: saldoPontos = 0 } = useSaldoRecompensas(autenticado);
  const { data: resgates = [], isLoading: carregandoResgates } = useMeusResgates(autenticado);
  const resgatarMutation = useResgatar();

  const { conquistas, conquistasDesbloqueadas } = useConquistas(!!petAtivo, eventos, resgates);

  const metaConsultas = META_CONSULTAS_RECOMPENSA;
  const consultasConcluidasTotal = useMemo(
    () => eventos.filter(e => e.status === 'CONCLUIDO').length,
    [eventos]
  );
  const consultasNoCicloAtual = consultasConcluidasTotal % metaConsultas;
  const faltam = Math.max(0, metaConsultas - consultasNoCicloAtual);
  const pct = Math.min(100, Math.round((consultasNoCicloAtual / metaConsultas) * 100));

  const historicoCompleto = useMemo(
    () => [...resgates].sort((a, b) => new Date(b.dataResgate).getTime() - new Date(a.dataResgate).getTime()),
    [resgates]
  );
  const historico = modoSimples ? historicoCompleto.slice(0, 3) : historicoCompleto;
  const recompensasVisiveis = mostrarCatalogoCompleto ? catalogo : catalogo.slice(0, 3);

  function handleResgatar(r: Recompensa) {
    if (saldoPontos < r.custoPontos) {
      mostrarToast('erro', 'Pontos insuficientes', `Essa recompensa custa ${r.custoPontos} pontos. Seu saldo é de ${saldoPontos} pontos.`);
      return;
    }
    confirmar(
      'Resgatar benefício?',
      `Deseja resgatar "${r.nome}" por ${r.custoPontos} pontos para ${petAtivo?.nome ?? 'seu pet'}? Apresente esse resgate na clínica veterinária.`,
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        {
          texto: 'Resgatar',
          aoConfirmar: async () => {
            try {
              await resgatarMutation.mutateAsync(r.id);
              mostrarToast('sucesso', 'Resgate efetuado!', 'Apresente o comprovante de resgate na clínica veterinária.');
            } catch {
              mostrarToast('erro', 'Erro ao resgatar', 'Não foi possível concluir o resgate. Tente novamente.');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} progressBackgroundColor={theme.colors.surface} />}
    >

      <PetSwitcher />

      {dicaVisivel && (
        <DicaTela
          titulo="Como funcionam os pontos"
          texto="Complete eventos de saúde do seu pet pra ganhar pontos, e troque por benefícios na clínica na aba de recompensas abaixo."
          accentColor={theme.colors.primary}
          onFechar={fecharDica}
          simples={modoSimples}
        />
      )}

      {/* Banner — some no modo simples */}
      {!modoSimples && (
        <LinearGradient colors={[theme.colors.navigation, theme.colors.navigationAccent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.banner}>
          <AppIcon name="paw" set="MaterialCommunityIcons" size={176} color="rgba(255,255,255,0.06)" style={s.bannerPaw} />
          <View style={s.bannerIconWrap}>
            <AppIcon name="gift-outline" set="Ionicons" size={30} color={theme.colors.onNavigation} />
          </View>
          <Text style={s.bannerKicker}>CUIDADO QUE RECOMPENSA</Text>
          <Text style={s.bannerTitulo}>Programa de Fidelidade</Text>
          <Text style={s.bannerSub}>
            Acumule pontos em cada atendimento e resgate benefícios exclusivos para {petAtivo?.nome ?? 'seu pet'}.
          </Text>
        </LinearGradient>
      )}

      <View style={[s.nivelCard, modoSimples && sSimples.nivelCard]}>
        <Text style={s.nivelKicker}>SEU NÍVEL ATUAL</Text>
        <View style={s.nivelHead}>
          <View style={[s.nivelBadge, modoSimples && sSimples.nivelBadge]}>
            <Text style={[s.nivelBadgeNumero, modoSimples && sSimples.nivelBadgeNumero]}>{nivelInfo.nivel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.nivelTitulo, modoSimples && sSimples.nivelTitulo]}>{nivelInfo.titulo}</Text>
            <Text style={[s.nivelSub, modoSimples && sSimples.nivelSub]}>Nível {nivelInfo.nivel} • {nivelInfo.xpAtual} XP</Text>
          </View>
        </View>

        <View style={[s.barraTrackRoxo, modoSimples && sSimples.barraTrackRoxo]}>
          <View style={[s.barraFillRoxo, { width: `${nivelInfo.progressoPct}%` as any }]} />
        </View>
        <Text style={[s.nivelHint, modoSimples && sSimples.nivelHint]}>
          {nivelInfo.xpFaltaProximoNivel !== null
            ? `Faltam ${nivelInfo.xpFaltaProximoNivel} XP para o próximo nível`
            : 'Nível máximo alcançado! 🏆'}
        </Text>
        {!modoSimples && <Text style={s.nivelDica}>Cada evento de saúde concluído vale 10 XP</Text>}
      </View>

      {/* Ciclo de atendimentos — some no modo simples */}
      {!modoSimples && (
        <View style={s.progressoCard}>
          <View style={s.progressoHead}>
            <Text style={s.progressoLbl}>Ciclo de atendimentos</Text>
            <Text style={s.progressoContagem}>{consultasNoCicloAtual}/{metaConsultas}</Text>
          </View>
          <View style={s.barraTrack}>
            <View style={[s.barraFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={s.progressoHint}>
            {faltam === 0
              ? 'Meta do ciclo atingida! Parabéns pelo cuidado contínuo 🎉'
              : `Faltam ${faltam} evento${faltam !== 1 ? 's' : ''} concluído${faltam !== 1 ? 's' : ''} para completar o ciclo`}
          </Text>

          <View style={s.dotsRow}>
            {Array.from({ length: metaConsultas }).map((_, i) => (
              <View
                key={i}
                style={[s.dotConsulta, i < consultasNoCicloAtual && s.dotConsultaPreenchida]}
              >
                {i < consultasNoCicloAtual && (
                  <AppIcon name="checkmark" set="Ionicons" size={12} color={theme.colors.onPrimary} />
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={s.secLabelRow}>
        <Text style={[s.secLabel, modoSimples && sSimples.secLabel]}>Benefícios do Catálogo</Text>
        <View style={s.saldoPill}>
          <AppIcon name="sparkles" set="Ionicons" size={12} color={theme.domain.reward.gold} />
          <Text style={s.secLabelContagem}>{saldoPontos} pts</Text>
        </View>
      </View>

      {carregandoCatalogo ? (
        <SkeletonList linhas={2} />
      ) : catalogo.length === 0 ? (
        <EmptyState
          icon="ribbon-outline"
          title="Nenhum benefício disponível no momento"
          subtitle="Novas recompensas aparecerão aqui em breve."
          accentColor={theme.domain.reward.gold}
        />
      ) : (
        <>
          {recompensasVisiveis.map(r => {
          const podeResgatar = saldoPontos >= r.custoPontos;
          const isPending = resgatarMutation.isPending && resgatarMutation.variables === r.id;

          return (
            <View key={r.id} style={[s.cupomCard, modoSimples && sSimples.cupomCard]}>
              <View style={[s.cupomIconWrap, modoSimples && sSimples.cupomIconWrap]}>
                <AppIcon name="gift" set="Ionicons" size={modoSimples ? 30 : 24} color={theme.domain.reward.gold} />
              </View>
              <View style={s.cupomInfo}>
                <Text style={[s.cupomTitulo, modoSimples && sSimples.cupomTitulo]}>{r.nome}</Text>
                <Text style={[s.cupomSub, modoSimples && sSimples.cupomSub]}>
                  {r.descricao ? `${r.descricao} • ` : ''}{r.custoPontos} pontos
                </Text>
              </View>
              <Pressable
                style={[s.btnResgatar, modoSimples && sSimples.btnResgatar, (!podeResgatar || isPending) && { opacity: 0.5 }]}
                onPress={() => handleResgatar(r)}
                disabled={!podeResgatar || isPending}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <Text style={[s.btnResgatarText, modoSimples && sSimples.btnResgatarText]}>Resgatar</Text>
                )}
              </Pressable>
            </View>
          );
          })}
          {catalogo.length > 3 && (
            <Pressable
              style={s.verMaisCatalogo}
              onPress={() => setMostrarCatalogoCompleto(anterior => !anterior)}
              accessibilityRole="button"
              accessibilityLabel={mostrarCatalogoCompleto ? 'Mostrar menos benefícios' : 'Ver mais benefícios'}
            >
              <Text style={s.verMaisCatalogoTexto}>{mostrarCatalogoCompleto ? 'Mostrar menos benefícios' : 'Ver mais benefícios'}</Text>
              <AppIcon name={mostrarCatalogoCompleto ? 'chevron-up' : 'chevron-down'} set="Ionicons" size={20} color={theme.colors.primary} />
            </Pressable>
          )}
        </>
      )}

      {/* Conquistas — somem no modo simples */}
      {!modoSimples && (
        <>
          <View style={s.secLabelRow}>
            <Text style={s.secLabel}>Conquistas</Text>
            <Text style={s.secLabelContagem}>{conquistasDesbloqueadas.length}/{conquistas.length}</Text>
          </View>
          <View style={s.conquistasGrid}>
            {conquistas.map(c => (
              <View
                key={c.id}
                style={[s.conquistaCard, !c.desbloqueada && s.conquistaCardBloqueada]}
              >
                <View style={[s.conquistaIconWrap, c.desbloqueada && s.conquistaIconWrapAtiva]}>
                  <AppIcon
                    name={c.desbloqueada ? c.icon : 'lock-closed-outline'}
                    set={c.desbloqueada ? c.iconSet : 'Ionicons'}
                    size={20}
                    color={c.desbloqueada ? theme.colors.onPrimary : theme.colors.textMuted}
                  />
                </View>
                <Text style={[s.conquistaTitulo, !c.desbloqueada && s.conquistaTituloBloqueada]} numberOfLines={2}>
                  {c.titulo}
                </Text>
                <Text style={s.conquistaDescricao} numberOfLines={2}>{c.descricao}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Estatísticas — some no modo simples */}
      {!modoSimples && (
        <>
          <Text style={s.secLabel}>Estatísticas</Text>
          <View style={s.statsCard}>
            <View style={s.statItem}>
              <Text style={s.statValor}>{consultasConcluidasTotal}</Text>
              <Text style={s.statLabel}>Eventos concluídos</Text>
            </View>
            <View style={s.statDivisor} />
            <View style={s.statItem}>
              <Text style={s.statValor}>{saldoPontos}</Text>
              <Text style={s.statLabel}>Pontos disponíveis</Text>
            </View>
            <View style={s.statDivisor} />
            <View style={s.statItem}>
              <Text style={s.statValor}>{historicoCompleto.length}</Text>
              <Text style={s.statLabel}>Resgates realizados</Text>
            </View>
          </View>
        </>
      )}

      {carregandoResgates ? (
        <SkeletonList linhas={2} comIcone={false} />
      ) : historico.length > 0 && (
        <>
          <Text style={[s.secLabel, modoSimples && sSimples.secLabel]}>
            {modoSimples ? 'Últimos resgates' : 'Histórico de resgates'}
          </Text>
          <View style={s.historicoCard}>
            {historico.map((r, idx) => (
              <View key={r.id} style={[s.historicoRow, modoSimples && sSimples.historicoRow, idx < historico.length - 1 && s.historicoRowBorder]}>
                <AppIcon
                  name={r.status === 'VALIDADO' ? 'checkmark-circle' : r.status === 'PENDENTE' ? 'time-outline' : 'close-circle'}
                  set="Ionicons"
                  size={modoSimples ? 28 : 20}
                  color={r.status === 'VALIDADO' ? theme.colors.success : r.status === 'PENDENTE' ? theme.domain.reward.gold : theme.colors.danger}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.historicoTitulo, modoSimples && sSimples.historicoTitulo]}>{r.nomeRecompensa}</Text>
                  <Text style={[s.historicoData, modoSimples && sSimples.historicoData]}>
                    {formatarData(r.dataResgate)} • {r.status}
                  </Text>
                </View>
                <Text style={{ fontSize: modoSimples ? 16 : 13, fontWeight: '700', color: theme.colors.textSecondary }}>-{r.custoPontos} pts</Text>
              </View>
            ))}
          </View>
        </>
      )}

    </ScrollView>
  );
}

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 42 },

  banner: {
    borderRadius: 28,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 18,
  },
  bannerPaw: { position: 'absolute', right: -30, top: -31, transform: [{ rotate: '-19deg' }] },
  bannerIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 17,
  },
  bannerKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.25, color: theme.colors.onNavigation, marginBottom: 6 },
  bannerTitulo: { fontSize: 25, lineHeight: 30, fontWeight: '800', color: theme.colors.onNavigation, letterSpacing: -0.45, marginBottom: 6 },
  bannerSub: { maxWidth: 285, fontSize: 14, lineHeight: 20, color: theme.colors.onNavigation, opacity: 0.86 },

  verMaisCatalogo: { minHeight: 48, marginTop: -2, marginBottom: 18, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: theme.colors.surfaceSubtle },
  verMaisCatalogoTexto: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },

  nivelCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.domain.reward.purple,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  nivelKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: theme.domain.reward.purple, marginBottom: 11 },
  nivelHead: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 },
  nivelBadge: {
    width: 54, height: 54, borderRadius: 18,
    backgroundColor: theme.domain.reward.purple,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.domain.reward.purple, shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  nivelBadgeNumero: { fontSize: 21, fontWeight: '800', color: theme.colors.onPrimary },
  nivelTitulo: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  nivelSub: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 3 },
  barraTrackRoxo: { height: 10, backgroundColor: theme.colors.surfaceSubtle, borderRadius: 5, overflow: 'hidden', marginBottom: 9 },
  barraFillRoxo: { height: '100%', backgroundColor: theme.domain.reward.purple, borderRadius: 5 },
  nivelHint: { fontSize: 13, color: theme.colors.text, fontWeight: '700', marginBottom: 3 },
  nivelDica: { fontSize: 12, color: theme.colors.textSecondary },

  progressoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    shadowColor: theme.colors.text, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  progressoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  progressoLbl: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  progressoContagem: { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
  barraTrack: { height: 11, backgroundColor: theme.colors.surfaceSubtle, borderRadius: 6, overflow: 'hidden', marginBottom: 11 },
  barraFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 6 },
  progressoHint: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 15 },

  dotsRow: { flexDirection: 'row', gap: 9, justifyContent: 'center' },
  dotConsulta: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
  },
  dotConsultaPreenchida: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },

  secLabel: {
    fontSize: 14, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase',
    color: theme.colors.textSecondary, marginBottom: 11, marginTop: 5, paddingLeft: 2,
  },
  secLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 2,
  },
  saldoPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceSubtle, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 11 },
  secLabelContagem: { fontSize: 12, fontWeight: '800', color: theme.domain.reward.gold },

  emptyCard: {
    backgroundColor: theme.colors.surface, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed',
    padding: 26, alignItems: 'center', marginBottom: 22,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' },

  cupomCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: theme.colors.surface, borderRadius: 20,
    padding: 15, marginBottom: 11,
    shadowColor: theme.colors.text, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  cupomIconWrap: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: theme.colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center',
  },
  cupomInfo: { flex: 1 },
  cupomTitulo: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  cupomSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 3 },
  btnResgatar: {
    backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
  },
  btnResgatarText: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '700' },

  conquistasGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 22,
  },
  conquistaCard: {
    width: '31%',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 11,
    alignItems: 'center',
    shadowColor: theme.colors.text, shadowOpacity: 0.05, shadowRadius: 9, shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
  conquistaCardBloqueada: { opacity: 0.55 },
  conquistaIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  conquistaIconWrapAtiva: { backgroundColor: theme.colors.primary },
  conquistaTitulo: { fontSize: 10.5, fontWeight: '700', color: theme.colors.text, textAlign: 'center', marginBottom: 2 },
  conquistaTituloBloqueada: { color: theme.colors.textMuted },
  conquistaDescricao: { fontSize: 9, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 12 },

  statsCard: {
    flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 22,
    marginBottom: 22, overflow: 'hidden', shadowColor: theme.colors.text, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 17 },
  statValor: { fontSize: 23, fontWeight: '700', color: theme.colors.primary },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 4 },
  statDivisor: { width: 1, backgroundColor: theme.colors.border },

  historicoCard: {
    backgroundColor: theme.colors.surface, borderRadius: 22, overflow: 'hidden', shadowColor: theme.colors.text, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  historicoRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 16 },
  historicoRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  historicoTitulo: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  historicoData: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
});

/** Modo simples: ~35% maior que o padrão. Sem banner, sem ciclo de atendimentos, sem conquistas e sem estatísticas. */
const sSimples = StyleSheet.create({
  nivelCard: { padding: 27 },
  nivelBadge: { width: 70, height: 70, borderRadius: 35 },
  nivelBadgeNumero: { fontSize: 27 },
  nivelTitulo: { fontSize: 23 },
  nivelSub: { fontSize: 19 },
  barraTrackRoxo: { height: 14, borderRadius: 7 },
  nivelHint: { fontSize: 19 },

  secLabel: { fontSize: 19 },

  cupomCard: { padding: 22 },
  cupomIconWrap: { width: 65, height: 65, borderRadius: 33 },
  cupomTitulo: { fontSize: 22 },
  cupomSub: { fontSize: 18 },
  btnResgatar: { paddingHorizontal: 22, paddingVertical: 15 },
  btnResgatarText: { fontSize: 19 },

  historicoRow: { padding: 22 },
  historicoTitulo: { fontSize: 20 },
  historicoData: { fontSize: 17 },
});
