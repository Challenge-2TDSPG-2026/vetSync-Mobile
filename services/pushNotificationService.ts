import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { api } from './api/httpClient';

let notifications: typeof NotificationsModule | null | undefined;

function obterNotificacoes(): typeof NotificationsModule | null {
  if (notifications !== undefined) return notifications;

  try {
    notifications = require('expo-notifications') as typeof NotificationsModule;
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    notifications = null;
  }

  return notifications;
}

export async function registrarTokenPush(token: string): Promise<void> {
  if (!token.trim()) {
    throw new Error('O Expo Push Token não foi fornecido.');
  }

  await api.post('/notificacoes/registrar-token', { token });
}

/**
 * Solicita a permissão e registra o token no backend para o usuário autenticado.
 * Retorna false em plataformas que não suportam push remoto ou quando a permissão
 * não foi concedida.
 */
export async function configurarNotificacoesPush(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const notificacoes = obterNotificacoes();
  if (!notificacoes) return false;

  const permissaoAtual = await notificacoes.getPermissionsAsync();
  const permissao =
    permissaoAtual.status === 'granted'
      ? permissaoAtual
      : await notificacoes.requestPermissionsAsync();

  if (permissao.status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await notificacoes.setNotificationChannelAsync('default', {
      name: 'Notificações',
      importance: notificacoes.AndroidImportance.DEFAULT,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const resposta = await notificacoes.getExpoPushTokenAsync({ projectId });
  await registrarTokenPush(resposta.data);
  return true;
}
