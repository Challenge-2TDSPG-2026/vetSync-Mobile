import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonBlock, SkeletonList } from '../../components/ui/Skeleton';
import { mostrarToast } from '../../components/ui/Toast';
import { DicaTela } from '../../components/ui/DicaTela';
import { useMeusResgates, useValidarResgate } from '../../hooks/useRecompensas';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { confirmar } from '../../utils/alert';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ResgatesPendentesScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { data: resgates = [], isLoading, refetch, isRefetching } = useMeusResgates(true);
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-resgates');
  const validar = useValidarResgate();

  const pendentes = resgates.filter(r => r.status === 'PENDENTE');

  function handleValidar(idResgate: string, nomeRecompensa: string, aprovado: boolean) {
    confirmar(
      aprovado ? 'Aprovar resgate?' : 'Negar resgate?',
      aprovado
        ? `Confirma a entrega de "${nomeRecompensa}" para o tutor? Os pontos serão debitados definitivamente.`
        : `O resgate de "${nomeRecompensa}" será negado e os pontos voltam para o saldo do tutor.`,
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        {
          texto: aprovado ? 'Aprovar' : 'Negar',
          estilo: aprovado ? 'default' : 'destructive',
          aoConfirmar: () => {
            validar.mutate(
              { idResgate, aprovado },
              {
                onSuccess: () =>
                  mostrarToast('sucesso', aprovado ? 'Resgate aprovado' : 'Resgate negado'),
                onError: () =>
                  mostrarToast('erro', 'Não foi possível validar', 'Tente novamente em instantes.'),
              }
            );
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <SkeletonBlock height={84} borderRadius={16} style={{ marginBottom: 14 }} />
        <SkeletonList linhas={3} comIcone={false} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.pages.vetRedemptions.primary} colors={[theme.pages.vetRedemptions.primary]} />}
    >
      <View style={s.banner}>
        <View style={s.bannerIconWrap}>
          <AppIcon name="gift-outline" set="Ionicons" size={26} color={theme.pages.vetRedemptions.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitulo}>Resgates aguardando validação</Text>
          <Text style={s.bannerSub}>
            Confira a entrega presencial antes de aprovar. Aprovar debita os pontos do tutor definitivamente.
          </Text>
        </View>
      </View>

      {dicaVisivel && (
        <DicaTela
          titulo="Como validar um resgate"
          texto="Confira a entrega com o tutor pessoalmente e toque em aprovar ou negar em cada card abaixo. Aprovar debita os pontos definitivamente."
          accentColor={theme.domain.reward.gold}
          onFechar={fecharDica}
        />
      )}

      {pendentes.length === 0 ? (
        <EmptyState
          icon="checkmark-done-outline"
          title="Nenhum resgate pendente"
          subtitle="Quando um tutor resgatar uma recompensa, ela aparece aqui para validação."
          accentColor={theme.pages.vetRedemptions.primary}
        />
      ) : (
        pendentes.map(r => (
          <View key={r.id} style={s.card}>
            <View style={s.cardRow}>
              <View style={s.cardIconWrap}>
                <AppIcon name="gift" set="Ionicons" size={20} color={theme.domain.reward.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitulo}>{r.nomeRecompensa}</Text>
                <Text style={s.cardSub}>{r.custoPontos} pontos • solicitado em {formatarData(r.dataResgate)}</Text>
              </View>
            </View>
            <View style={s.cardAcoes}>
              <Pressable
                style={[s.btnAcao, s.btnNegar]}
                onPress={() => handleValidar(r.id, r.nomeRecompensa, false)}
                disabled={validar.isPending}
              >
                <AppIcon name="close" set="Ionicons" size={15} color={theme.pages.vetRedemptions.danger} />
                <Text style={[s.btnAcaoText, { color: theme.pages.vetRedemptions.danger }]}>Negar</Text>
              </Pressable>
              <Pressable
                style={[s.btnAcao, s.btnAprovar]}
                onPress={() => handleValidar(r.id, r.nomeRecompensa, true)}
                disabled={validar.isPending}
              >
                <AppIcon name="checkmark" set="Ionicons" size={15} color={theme.pages.vetRedemptions.white} />
                <Text style={[s.btnAcaoText, { color: theme.pages.vetRedemptions.white }]}>Aprovar</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.pages.vetRedemptions.background },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: theme.pages.vetRedemptions.background, justifyContent: 'center', alignItems: 'center' },

  banner: {
    backgroundColor: theme.pages.vetRedemptions.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  bannerIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  bannerTitulo: { fontSize: 15, fontWeight: '700', color: theme.pages.vetRedemptions.white, marginBottom: 4 },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 16 },

  btnAtualizar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: theme.pages.vetRedemptions.successBackground,
    backgroundColor: theme.pages.vetRedemptions.cardSecondary, marginBottom: 18,
  },
  btnAtualizarText: { fontSize: 12, fontWeight: '700', color: theme.pages.vetRedemptions.primary },

  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: theme.pages.vetRedemptions.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: theme.pages.vetRedemptions.textSecondary, textAlign: 'center', paddingHorizontal: 16 },

  card: {
    backgroundColor: theme.pages.vetRedemptions.card, borderRadius: 14, borderWidth: 1.5, borderColor: theme.domain.reward.gold,
    padding: 14, marginBottom: 12,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: theme.pages.vetRedemptions.warningBackground, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.domain.reward.gold,
  },
  cardTitulo: { fontSize: 14, fontWeight: '700', color: theme.pages.vetRedemptions.text },
  cardSub: { fontSize: 11, color: theme.pages.vetRedemptions.textSecondary, marginTop: 2 },

  cardAcoes: { flexDirection: 'row', gap: 10 },
  btnAcao: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  btnNegar: { backgroundColor: theme.pages.vetRedemptions.dangerBackground, borderWidth: 1.5, borderColor: theme.pages.vetRedemptions.danger },
  btnAprovar: { backgroundColor: theme.pages.vetRedemptions.primary },
  btnAcaoText: { fontSize: 13, fontWeight: '700' },
});
