import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useTheme } from '../../../context/ThemeContext';
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  type Notificacao,
} from '../../../services/notificationService';
import { rotaDaNotificacao } from '../../../utils/notificacaoRota';
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
  const s = useMemo(() => createStyles(theme), [theme]);

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

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
    } catch {
      setErroCarga('Não foi possível carregar suas notificações. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

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
    } catch {
      setErroAcao('Não foi possível marcar as notificações como lidas. Tente novamente.');
    }
  };

  return (
    <>
      <View style={s.container}>
        <View style={[s.pageHeader, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable
            style={s.backButton}
            onPress={() => router.replace('/(tutor)/(tabs)/perfil')}
            accessibilityRole="button"
            accessibilityLabel="Voltar para conta"
          >
            <Ionicons name="arrow-back" size={23} color={theme.components.header.icon} />
          </Pressable>
          <Text style={s.pageTitle}>Notificações</Text>
        </View>

        <ScrollView
          style={s.container}
          contentContainerStyle={s.content}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => void carregar(true)}
            />
          }
        >
          <View style={s.header}>
            <Text style={s.subtitle}>
              Acompanhe os avisos importantes dos seus pets.
            </Text>

            {!erroCarga && notificacoes.some(item => !item.lida) && (
              <Pressable
                onPress={() => void marcarTodasComoLidas()}
                accessibilityRole="button"
                accessibilityLabel="Marcar todas as notificações como lidas"
              >
                <Text style={s.markAll}>Marcar todas como lidas</Text>
              </Pressable>
            )}
          </View>

          {erroAcao && (
            <View style={s.error} accessibilityRole="alert">
              <Text style={s.errorText}>{erroAcao}</Text>
            </View>
          )}

          {carregando ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={s.loader}
              accessibilityLabel="Carregando notificações"
            />
          ) : erroCarga ? (
            <View style={s.error} accessibilityRole="alert">
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
          ) : notificacoes.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="Nenhuma notificação"
              subtitle="Você verá aqui lembretes e avisos importantes."
              variant="plain"
              accentColor={theme.colors.primary}
            />
          ) : (
            notificacoes.map(notificacao => (
              <Pressable
                key={notificacao.id}
                onPress={() => abrirNotificacao(notificacao)}
                style={[s.card, !notificacao.lida && s.unread]}
                accessibilityRole="button"
                accessibilityLabel={`${notificacao.lida ? 'Lida' : 'Não lida'}. ${notificacao.titulo}. ${notificacao.mensagem}`}
                accessibilityHint={notificacao.lida ? undefined : 'Toque para abrir e marcar como lida'}
                accessibilityState={{ selected: !notificacao.lida }}
              >
                <View
                  style={[
                    s.icon,
                    {
                      backgroundColor: notificacao.lida
                        ? theme.pages.notifications.cardSecondary
                        : theme.colors.infoBackground,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      notificacao.lida
                        ? 'notifications-outline'
                        : 'notifications'
                    }
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={s.copy}>
                  <View style={s.row}>
                    <Text
                      style={[s.cardTitle, notificacao.lida && s.cardTitleRead]}
                    >
                      {notificacao.titulo}
                    </Text>

                    <Text style={s.date}>
                      {formatarData(notificacao.enviadaEm ?? notificacao.criadaEm)}
                    </Text>
                  </View>

                  <Text style={s.message}>
                    {notificacao.mensagem}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingHorizontal: 18,
      paddingBottom: 15,
      backgroundColor: theme.components.header.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.components.header.border,
    },

    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },

    pageTitle: {
      color: theme.components.header.title,
      fontSize: 20,
      fontWeight: '800',
    },

    content: {
      padding: 20,
      paddingBottom: 36,
    },

    header: {
      gap: 12,
      marginBottom: 18,
    },

    subtitle: {
      color: theme.colors.textSecondary,
      marginTop: 4,
      lineHeight: 19,
    },

    markAll: {
      paddingVertical: 8,
      color: theme.colors.info,
      fontSize: 12,
      fontWeight: '700',
    },

    loader: {
      marginTop: 48,
    },

    card: {
      flexDirection: 'row',
      gap: 12,
      padding: 15,
      marginBottom: 10,
      borderRadius: 16,
      backgroundColor: theme.pages.notifications.card,
      borderWidth: 1,
      borderColor: theme.pages.notifications.border,
    },

    unread: {
      borderColor: theme.colors.info,
      backgroundColor: theme.colors.infoBackground,
    },

    icon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },

    copy: {
      flex: 1,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },

    cardTitle: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '800',
    },

    cardTitleRead: {
      fontWeight: '600',
    },

    date: {
      color: theme.colors.textMuted,
      fontSize: 11,
    },

    message: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
    },

    error: {
      padding: 14,
      borderRadius: 12,
      marginBottom: 14,
      backgroundColor: theme.colors.dangerBackground,
    },

    errorText: {
      color: theme.colors.danger,
      fontSize: 13,
    },

    retryButton: {
      alignSelf: 'flex-start',
      minHeight: 44,
      justifyContent: 'center',
      marginTop: 4,
    },

    retry: {
      color: theme.colors.danger,
      fontWeight: '800',
    },
  });
}