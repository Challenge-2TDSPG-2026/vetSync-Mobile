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
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  type Notificacao,
} from '../../services/notificationService';
import type { AppTheme } from '../../constants/theme';

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
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notificações',
          headerBackTitle: 'Voltar',
        }}
      />

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
          <View>
            <Text style={s.title}>Notificações</Text>
            <Text style={s.subtitle}>
              Acompanhe os avisos importantes dos seus pets.
            </Text>
          </View>

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
              onPress={() => void marcarComoLida(notificacao)}
              style={[s.card, !notificacao.lida && s.unread]}
              accessibilityRole="button"
              accessibilityLabel={`${notificacao.lida ? 'Lida' : 'Não lida'}. ${notificacao.titulo}. ${notificacao.mensagem}`}
              accessibilityHint={notificacao.lida ? undefined : 'Toque para marcar como lida'}
              accessibilityState={{ selected: !notificacao.lida }}
            >
              <View
                style={[
                  s.icon,
                  {
                    backgroundColor: notificacao.lida
                      ? theme.colors.surfaceSubtle
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
    </>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    content: {
      padding: 20,
      paddingBottom: 36,
    },

    header: {
      gap: 12,
      marginBottom: 18,
    },

    title: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: '800',
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
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
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