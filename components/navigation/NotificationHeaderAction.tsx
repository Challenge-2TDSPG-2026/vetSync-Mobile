import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';

export function NotificationHeaderAction() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const atualizar = (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
      setOffline(state.isConnected === false || state.isInternetReachable === false);
    };
    const unsubscribe = NetInfo.addEventListener(atualizar);
    void NetInfo.fetch().then(atualizar);
    return unsubscribe;
  }, []);

  async function tentarNovamente() {
    const state = await NetInfo.fetch();
    const conectado = state.isConnected !== false && state.isInternetReachable !== false;
    setOffline(!conectado);
    if (conectado) {
      await queryClient.invalidateQueries();
    }
  }

  function aoPressionar() {
    if (!offline) {
      router.push('/(tutor)/(tabs)/notificacoes');
      return;
    }

    Alert.alert(
      'Sem conexão',
      'Você está sem internet. Mostrando os dados salvos neste aparelho; podem estar desatualizados.',
      [
        { text: 'OK', style: 'cancel' },
        { text: 'Tentar novamente', onPress: () => void tentarNovamente() },
      ],
    );
  }

  return (
    <Pressable
      onPress={aoPressionar}
      style={[
        s.button,
        offline && { backgroundColor: theme.colors.warningBackground, borderColor: theme.colors.warning },
      ]}
      accessibilityRole="button"
      accessibilityLabel={offline ? 'Sem conexão. Toque para ver detalhes' : 'Abrir notificações'}
      hitSlop={8}
    >
      <Ionicons
        name={offline ? 'cloud-offline-outline' : 'notifications-outline'}
        size={offline ? 20 : 23}
        color={offline ? theme.colors.warning : theme.components.header.icon}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: { padding: 6, marginRight: 2, borderRadius: 18, borderWidth: 1, borderColor: 'transparent' },
});
