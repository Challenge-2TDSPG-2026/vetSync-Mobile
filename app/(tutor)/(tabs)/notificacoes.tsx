import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useTheme } from '../../../context/ThemeContext';
import { useAccessibility } from '../../../context/AccessibilityContext';
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  type Notificacao,
} from '../../../services/notificationService';
import { rotaDaNotificacao } from '../../../utils/notificacaoRota';
import { observarNotificacoesRecebidas } from '../../../services/pushNotificationService';
import type { AppTheme } from '../../../constants/theme';

function formatarData(data: string): string {
  const parsed = new Date(data);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export default function NotificacoesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const queryClient = useQueryClient();
  const s = useMemo(() => createStyles(theme), [theme]);

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'TODAS' | 'NAO_LIDAS'>('TODAS');

  const carregar = useCallback(async (refresh = false) => {
    if (refresh) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }

    setErroCarga(null);
    setErroAcao(null);

    try {
      const resultado = await listarNotificacoes();
      setNotificacoes(resultado);
      queryClient.setQueryData(['notificacoes'], resultado);
    } catch {
      setErroCarga('Não foi possível carregar suas notificações. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [queryClient]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  useEffect(() => observarNotificacoesRecebidas(() => {
    void carregar(true);
  }), [carregar]);

  const marcarComoLida = async (notificacao: Notificacao) => {
    if (notificacao.lida) {
      return;
    }

    setErroAcao(null);

    try {
      await marcarNotificacaoComoLida(notificacao.id);

      setNotificacoes(current =>
        current.map(item =>
          item.id === notificacao.id
            ? { ...item, lida: true }
            : item
        )
      );
      queryClient.setQueryData<Notificacao[]>(['notificacoes'], current =>
        current?.map(item => item.id === notificacao.id ? { ...item, lida: true } : item),
      );
    } catch {
      setErroAcao('Não foi possível marcar a notificação como lida. Tente novamente.');
    }
  };

  const abrirNotificacao = (notificacao: Notificacao) => {
    void marcarComoLida(notificacao);
    const rota = rotaDaNotificacao({
      tipo: notificacao.tipo,
      referenciaTipo: notificacao.referenciaTipo,
      referenciaId: notificacao.referenciaId,
    });
    if (rota) router.push(rota as Parameters<typeof router.push>[0]);
  };

  const marcarTodasComoLidas = async () => {
    if (!notificacoes.some(item => !item.lida)) {
      return;
    }

    setErroAcao(null);

    try {
      await marcarTodasNotificacoesComoLidas();

      setNotificacoes(current =>
        current.map(item => ({
          ...item,
          lida: true,
        }))
      );
      queryClient.setQueryData<Notificacao[]>(['notificacoes'], current =>
        current?.map(item => ({ ...item, lida: true })),
      );
    } catch {
      setErroAcao('Não foi possível marcar as notificações como lidas. Tente novamente.');
    }
  };

  const naoLidas = notificacoes.filter(item => !item.lida).length;
  const notificacoesVisiveis = filtro === 'NAO_LIDAS'
    ? notificacoes.filter(item => !item.lida)
    : notificacoes;

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 20) + 26 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => void carregar(true)}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ImageBackground
          source={require('../../../assets/images/notifications.png')}
          style={s.hero}
          imageStyle={s.heroImage}
          resizeMode="cover"
          accessibilityLabel="Tutor e equipe de uma clínica veterinária"
        >
          <LinearGradient
            colors={['rgba(5, 25, 18, 0.15)', 'rgba(5, 25, 18, 0.38)', 'rgba(5, 25, 18, 0.94)']}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            style={[s.backButton, { top: Math.max(insets.top, 14) }]}
            onPress={() => router.replace('/(tutor)/(tabs)/perfil')}
            accessibilityRole="button"
            accessibilityLabel="Voltar para conta"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>
          <View style={s.heroContent}>
            <View style={s.heroIcon}>
              <Ionicons name="notifications" size={modoSimples ? 31 : 25} color={theme.colors.primary} />
            </View>
            <Text style={[s.heroEyebrow, modoSimples && sSimple.heroEyebrow]}>AVISOS DOS SEUS PETS</Text>
            <Text style={[s.heroTitle, modoSimples && sSimple.heroTitle]}>Notificações</Text>
            <View style={s.heroSummary}>
              <Text style={[s.heroSubtitle, modoSimples && sSimple.heroSubtitle]}>
                Acompanhe lembretes e atualizações importantes.
              </Text>
              {naoLidas > 0 ? (
                <View style={s.heroUnreadBadge}>
                  <View style={s.heroUnreadDot} />
                  <Text style={s.heroUnreadText}>{naoLidas} nova{naoLidas === 1 ? '' : 's'}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </ImageBackground>

        <View style={s.body}>
          <View style={s.toolbar}>
            <View style={s.introCopy}>
              <Text style={[s.sectionTitle, modoSimples && sSimple.sectionTitle]}>Sua central de avisos</Text>
              <Text style={[s.subtitle, modoSimples && sSimple.subtitle]}>
                Toque em um aviso para abrir o conteúdo relacionado e marcá-lo como visto.
              </Text>
            </View>
            {!erroCarga && naoLidas > 0 ? (
              <Pressable
                style={s.markAllButton}
                onPress={() => void marcarTodasComoLidas()}
                accessibilityRole="button"
                accessibilityLabel="Marcar todas as notificações como lidas"
              >
                <Ionicons name="checkmark-done-outline" size={17} color={theme.colors.primary} />
                <Text style={s.markAll}>Marcar todas como vistas</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={s.filters} accessibilityRole="tablist">
            <Pressable
              style={[s.filterTab, filtro === 'TODAS' && s.filterTabActive]}
              onPress={() => setFiltro('TODAS')}
              accessibilityRole="tab"
              accessibilityState={{ selected: filtro === 'TODAS' }}
            >
              <Text style={[s.filterText, filtro === 'TODAS' && s.filterTextActive]}>Todas</Text>
              <Text style={[s.filterCount, filtro === 'TODAS' && s.filterCountActive]}>{notificacoes.length}</Text>
            </Pressable>
            <Pressable
              style={[s.filterTab, filtro === 'NAO_LIDAS' && s.filterTabActive]}
              onPress={() => setFiltro('NAO_LIDAS')}
              accessibilityRole="tab"
              accessibilityState={{ selected: filtro === 'NAO_LIDAS' }}
            >
              <Text style={[s.filterText, filtro === 'NAO_LIDAS' && s.filterTextActive]}>Não vistas</Text>
              <Text style={[s.filterCount, filtro === 'NAO_LIDAS' && s.filterCountActive]}>{naoLidas}</Text>
            </Pressable>
          </View>

          {erroAcao ? (
            <View style={s.error} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" size={19} color={theme.colors.danger} />
              <Text style={s.errorText}>{erroAcao}</Text>
            </View>
          ) : null}

          {carregando ? (
            <View style={s.loadingState}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={s.loadingText}>Carregando notificações...</Text>
            </View>
          ) : erroCarga ? (
            <View style={s.error} accessibilityRole="alert">
              <Ionicons name="cloud-offline-outline" size={21} color={theme.colors.danger} />
              <View style={s.errorCopy}>
                <Text style={s.errorText}>{erroCarga}</Text>
                <Pressable
                  onPress={() => void carregar()}
                  style={s.retryButton}
                  accessibilityRole="button"
                  accessibilityLabel="Tentar carregar as notificações novamente"
                >
                  <Text style={s.retry}>Tentar novamente</Text>
                </Pressable>
              </View>
            </View>
          ) : notificacoes.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="Você está em dia"
              subtitle="Quando chegar um lembrete ou aviso da clínica, ele aparecerá aqui."
              variant="plain"
              accentColor={theme.colors.primary}
            />
          ) : notificacoesVisiveis.length === 0 ? (
            <EmptyState
              icon="checkmark-done-outline"
              title="Nenhum aviso por ver"
              subtitle="Todas as notificações foram abertas. Confira o histórico completo quando quiser."
              variant="plain"
              accentColor={theme.colors.success}
              actionLabel="Ver todas"
              onAction={() => setFiltro('TODAS')}
            />
          ) : (
            <View style={s.notificationList}>
              {notificacoesVisiveis.map(notificacao => (
                <Pressable
                  key={notificacao.id}
                  onPress={() => abrirNotificacao(notificacao)}
                  style={({ pressed }) => [s.card, !notificacao.lida && s.unread, pressed && s.cardPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`${notificacao.lida ? 'Vista' : 'Nova, não vista'}. ${notificacao.titulo}. ${notificacao.mensagem}`}
                  accessibilityHint={notificacao.lida ? undefined : 'Toque para abrir e marcar como vista'}
                  accessibilityState={{ selected: !notificacao.lida }}
                >
                  <View style={[s.icon, !notificacao.lida && s.iconUnread]}>
                    <Ionicons
                      name={notificacao.lida ? 'notifications-outline' : 'notifications'}
                      size={21}
                      color={notificacao.lida ? theme.colors.textSecondary : theme.colors.primary}
                    />
                  </View>
                  <View style={s.copy}>
                    <View style={s.row}>
                      <Text style={[s.cardTitle, notificacao.lida && s.cardTitleRead]}>
                        {notificacao.titulo}
                      </Text>
                      <Text style={s.date}>
                        {formatarData(notificacao.enviadaEm ?? notificacao.criadaEm)}
                      </Text>
                    </View>
                    <Text style={s.message}>{notificacao.mensagem}</Text>
                    {!notificacao.lida ? (
                      <View style={s.newLabel}>
                        <View style={s.newDot} />
                        <Text style={s.newLabelText}>NOVA · TOQUE PARA VER</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    content: { paddingBottom: 28 },
    hero: { height: 292, justifyContent: 'flex-end', backgroundColor: theme.pages.shared.heroBackground },
    heroImage: { width: '100%', height: '100%' },
    backButton: {
      position: 'absolute',
      left: 18,
      zIndex: 2,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.pages.shared.cardElevated,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
    },
    heroContent: { paddingHorizontal: 22, paddingTop: 80, paddingBottom: 22 },
    heroIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.pages.shared.cardElevated, marginBottom: 11 },
    heroEyebrow: { color: '#d8f1df', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
    heroTitle: { color: '#ffffff', fontSize: 29, fontWeight: '900', letterSpacing: -0.7, marginTop: 4 },
    heroSummary: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 5 },
    heroSubtitle: { color: '#f0f6f1', fontSize: 13, lineHeight: 19, flexShrink: 1 },
    heroUnreadBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: '#ffffff' },
    heroUnreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.danger },
    heroUnreadText: { color: theme.colors.danger, fontSize: 10, fontWeight: '900' },
    body: { paddingHorizontal: 19, paddingTop: 22 },
    toolbar: { gap: 10, marginBottom: 18 },
    introCopy: { flex: 1 },
    sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
    subtitle: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
    markAllButton: { alignSelf: 'flex-start', minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, borderRadius: 12, backgroundColor: theme.colors.successBackground },
    markAll: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
    filters: { flexDirection: 'row', gap: 7, padding: 4, borderRadius: 15, backgroundColor: theme.pages.shared.cardSecondary, marginBottom: 15 },
    filterTab: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, flex: 1, borderRadius: 11, paddingHorizontal: 10 },
    filterTabActive: { backgroundColor: theme.pages.shared.card, shadowColor: theme.colors.text, shadowOpacity: 0.06, shadowRadius: 5, elevation: 1 },
    filterText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
    filterTextActive: { color: theme.colors.primary, fontWeight: '900' },
    filterCount: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '800' },
    filterCountActive: { color: theme.colors.primary },
    loadingState: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 42 },
    loadingText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
    notificationList: { gap: 10 },
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 11,
      padding: 14,
      borderRadius: 18,
      backgroundColor: theme.pages.notifications.card,
      borderWidth: 1,
      borderColor: theme.pages.notifications.border,
    },
    cardPressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
    unread: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.mode === 'dark' ? theme.pages.notifications.cardElevated : theme.colors.infoBackground,
    },
    icon: {
      width: 43,
      height: 43,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.pages.notifications.cardSecondary,
    },
    iconUnread: { backgroundColor: theme.colors.infoBackground },
    copy: { flex: 1, minWidth: 0 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    cardTitle: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '900',
    },
    cardTitleRead: { fontWeight: '600' },
    date: { color: theme.colors.textMuted, fontSize: 10, marginTop: 2 },
    message: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
    newLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    newDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.danger },
    newLabelText: { color: theme.colors.danger, fontSize: 9, fontWeight: '900', letterSpacing: 0.55 },
    error: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      padding: 14,
      borderRadius: 15,
      marginBottom: 14,
      backgroundColor: theme.colors.dangerBackground,
    },
    errorCopy: { flex: 1 },
    errorText: { flex: 1, color: theme.colors.danger, fontSize: 13, lineHeight: 19 },
    retryButton: {
      alignSelf: 'flex-start',
      minHeight: 44,
      justifyContent: 'center',
      marginTop: 3,
    },
    retry: { color: theme.colors.danger, fontWeight: '900' },
  });
}

const sSimple = StyleSheet.create({
  heroEyebrow: { fontSize: 13 },
  heroTitle: { fontSize: 34 },
  heroSubtitle: { fontSize: 17, lineHeight: 24 },
  sectionTitle: { fontSize: 22 },
  subtitle: { fontSize: 17, lineHeight: 25 },
  markAll: { fontSize: 15 },
  filterText: { fontSize: 15 },
  filterCount: { fontSize: 14 },
  cardTitle: { fontSize: 18, lineHeight: 25 },
  message: { fontSize: 16, lineHeight: 24 },
});
