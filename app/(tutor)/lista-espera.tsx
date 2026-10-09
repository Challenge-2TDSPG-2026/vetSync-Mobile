import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useListaEspera, useSairListaEspera } from '../../hooks/useListaEspera';
import { EmptyState } from '../../components/ui/EmptyState';
import { mostrarToast } from '../../components/ui/Toast';
import { mensagemDeErro } from '../../services/api/errorMessages';
import { descreverPeriodo, STATUS_ESPERA_VISUAL } from '../../utils/listaEspera';
import type { EntradaListaEspera } from '../../services/listaEsperaService';
import type { AppTheme } from '../../constants/theme';

export default function ListaEsperaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { autenticado } = useAuth();
  const s = useMemo(() => createStyles(theme), [theme]);
  const lista = useListaEspera(autenticado);
  const sair = useSairListaEspera();

  async function sairDaFila(entrada: EntradaListaEspera) {
    try {
      await sair.mutateAsync(entrada.id);
      mostrarToast('sucesso', 'Você saiu da lista de espera');
    } catch (e) {
      mostrarToast('erro', 'Não foi possível sair da lista', mensagemDeErro(e, 'Tente novamente.'));
    }
  }

  function agendarVaga(entrada: EntradaListaEspera) {
    router.push({
      pathname: '/(tutor)/agendar-servico',
      params: {
        petId: entrada.idPet,
        servicoId: String(entrada.idServico),
        ...(entrada.dataVaga ? { data: entrada.dataVaga } : {}),
        ...(entrada.horaVaga ? { hora: entrada.horaVaga } : {}),
      },
    });
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={s.voltar} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={23} color={theme.colors.text} />
        </Pressable>
        <Text style={s.titulo} accessibilityRole="header">Lista de espera</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.conteudo}
        refreshControl={<RefreshControl refreshing={lista.isRefetching} onRefresh={() => void lista.refetch()} tintColor={theme.colors.primary} />}
      >
        <Text style={s.intro}>Quando surgir uma vaga compatível, você recebe um aviso e pode agendar na hora.</Text>

        {lista.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} accessibilityLabel="Carregando lista de espera" />
        ) : lista.isError ? (
          <View style={s.erro} accessibilityRole="alert">
            <Text style={s.erroTexto}>Não foi possível carregar sua lista de espera.</Text>
            <Pressable onPress={() => void lista.refetch()} accessibilityRole="button" accessibilityLabel="Tentar novamente">
              <Text style={s.link}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : !lista.data?.length ? (
          <EmptyState
            icon="hourglass-outline"
            title="Você não está em nenhuma fila"
            subtitle="Ao escolher outro horário, toque em “Avise-me quando surgir uma vaga”."
            variant="plain"
            accentColor={theme.colors.primary}
          />
        ) : (
          lista.data.map(entrada => {
            const visual = STATUS_ESPERA_VISUAL[entrada.status];
            const saindo = sair.isPending && sair.variables === entrada.id;
            return (
              <View key={entrada.id} style={[s.card, entrada.status === 'NOTIFICADO' && s.cardDestaque]}>
                <View style={s.cardTopo}>
                  <View style={s.cardTextos}>
                    <Text style={s.cardTitulo}>{entrada.nomeServico}</Text>
                    <Text style={s.cardMeta}>{entrada.nomePet}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: visual.bg }]}>
                    <Text style={[s.badgeTexto, { color: visual.color }]}>{visual.label}</Text>
                  </View>
                </View>
                <Text style={s.cardMeta}>{descreverPeriodo(entrada)}</Text>

                {entrada.status === 'NOTIFICADO' && entrada.dataVaga && (
                  <Text style={s.vaga}>
                    Vaga em {entrada.dataVaga.split('-').reverse().join('/')}{entrada.horaVaga ? ` às ${entrada.horaVaga}` : ''}
                  </Text>
                )}

                <View style={s.acoes}>
                  {entrada.status === 'NOTIFICADO' && (
                    <Pressable style={s.btnPrimario} onPress={() => agendarVaga(entrada)} accessibilityRole="button" accessibilityLabel={`Agendar vaga de ${entrada.nomeServico}`}>
                      <Text style={s.btnPrimarioTexto}>Agendar agora</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={s.btnSecundario}
                    onPress={() => void sairDaFila(entrada)}
                    disabled={saindo}
                    accessibilityRole="button"
                    accessibilityLabel={`Sair da lista de espera de ${entrada.nomeServico}`}
                    accessibilityState={{ disabled: saindo, busy: saindo }}
                  >
                    {saindo
                      ? <ActivityIndicator size="small" color={theme.colors.textMuted} />
                      : <Text style={s.btnSecundarioTexto}>Sair da lista</Text>}
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, paddingBottom: 12 },
  voltar: { padding: 4 },
  titulo: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  conteudo: { padding: 18, paddingBottom: 40 },
  intro: { color: theme.colors.textSecondary, lineHeight: 21, marginBottom: 16 },
  erro: { padding: 16, borderRadius: 12, backgroundColor: theme.colors.dangerBackground },
  erroTexto: { color: theme.colors.danger, marginBottom: 8 },
  link: { color: theme.colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: theme.pages.agenda.eventCard.background, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: theme.pages.agenda.border, gap: 6,
  },
  cardDestaque: { borderColor: theme.colors.primary, borderWidth: 2 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTextos: { flex: 1 },
  cardTitulo: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  cardMeta: { fontSize: 13, color: theme.colors.textSecondary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTexto: { fontSize: 11, fontWeight: '800' },
  vaga: { fontSize: 14, fontWeight: '800', color: theme.colors.primary, marginTop: 4 },
  acoes: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btnPrimario: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  btnPrimarioTexto: { color: theme.colors.onPrimary, fontWeight: '800' },
  btnSecundario: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1, borderColor: theme.pages.agenda.border, minWidth: 110, alignItems: 'center' },
  btnSecundarioTexto: { color: theme.colors.textSecondary, fontWeight: '700' },
});