import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { useMeusResgates, useValidarResgate } from '../../hooks/useRecompensas';
import { confirmar, alertar } from '../../utils/alert';

const C = {
  g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52', g500: '#22a06b',
  g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', w50: '#f9f7f4',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', ouro: '#c99a2e', ouroClaro: '#fdf6e3',
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ResgatesPendentesScreen() {
  const { data: resgates = [], isLoading, refetch, isRefetching } = useMeusResgates(true);
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
                onError: () =>
                  alertar('Não foi possível validar', 'Tente novamente em instantes.'),
              }
            );
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={C.g600} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={undefined}
    >
      <View style={s.banner}>
        <View style={s.bannerIconWrap}>
          <AppIcon name="gift-outline" set="Ionicons" size={26} color={C.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitulo}>Resgates aguardando validação</Text>
          <Text style={s.bannerSub}>
            Confira a entrega presencial antes de aprovar. Aprovar debita os pontos do tutor definitivamente.
          </Text>
        </View>
      </View>

      <Pressable style={s.btnAtualizar} onPress={() => refetch()} disabled={isRefetching}>
        <AppIcon name="refresh-outline" set="Ionicons" size={14} color={C.g600} />
        <Text style={s.btnAtualizarText}>{isRefetching ? 'Atualizando...' : 'Atualizar lista'}</Text>
      </Pressable>

      {pendentes.length === 0 ? (
        <View style={s.empty}>
          <AppIcon name="checkmark-done-outline" set="Ionicons" size={36} color={C.muted} style={{ marginBottom: 10 }} />
          <Text style={s.emptyTitle}>Nenhum resgate pendente</Text>
          <Text style={s.emptySub}>Quando um tutor resgatar uma recompensa, ela aparece aqui para validação.</Text>
        </View>
      ) : (
        pendentes.map(r => (
          <View key={r.id} style={s.card}>
            <View style={s.cardRow}>
              <View style={s.cardIconWrap}>
                <AppIcon name="gift" set="Ionicons" size={20} color={C.ouro} />
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
                <AppIcon name="close" set="Ionicons" size={15} color={C.danger} />
                <Text style={[s.btnAcaoText, { color: C.danger }]}>Negar</Text>
              </Pressable>
              <Pressable
                style={[s.btnAcao, s.btnAprovar]}
                onPress={() => handleValidar(r.id, r.nomeRecompensa, true)}
                disabled={validar.isPending}
              >
                <AppIcon name="checkmark" set="Ionicons" size={15} color={C.white} />
                <Text style={[s.btnAcaoText, { color: C.white }]}>Aprovar</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center' },

  banner: {
    backgroundColor: C.g800,
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
  bannerTitulo: { fontSize: 15, fontWeight: '700', color: C.white, marginBottom: 4 },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 16 },

  btnAtualizar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.g100,
    backgroundColor: C.g50, marginBottom: 18,
  },
  btnAtualizarText: { fontSize: 12, fontWeight: '700', color: C.g600 },

  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', paddingHorizontal: 16 },

  card: {
    backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.ouro,
    padding: 14, marginBottom: 12,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.ouroClaro, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.ouro,
  },
  cardTitulo: { fontSize: 14, fontWeight: '700', color: C.text },
  cardSub: { fontSize: 11, color: C.muted, marginTop: 2 },

  cardAcoes: { flexDirection: 'row', gap: 10 },
  btnAcao: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  btnNegar: { backgroundColor: '#fff5f5', borderWidth: 1.5, borderColor: '#fecaca' },
  btnAprovar: { backgroundColor: C.g600 },
  btnAcaoText: { fontSize: 13, fontWeight: '700' },
});