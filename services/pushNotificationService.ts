import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { api } from './api/httpClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

let notifications: typeof NotificationsModule | null | undefined;
let registroTokenEmAndamento: Promise<void> | null = null;

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

async function registrarTokenPushUmaVez(token: string): Promise<void> {
  if (registroTokenEmAndamento) return registroTokenEmAndamento;

  registroTokenEmAndamento = (async () => {
    const tokenAnterior = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
    if (tokenAnterior === token) return;
    await registrarTokenPush(token);
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
  })();

  try {
    await registroTokenEmAndamento;
  } finally {
    registroTokenEmAndamento = null;
  }
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
  if (!projectId) {
    throw new Error('O projectId do Expo não está configurado para notificações push.');
  }
  const resposta = await notificacoes.getExpoPushTokenAsync({ projectId });
  await registrarTokenPushUmaVez(resposta.data);
  return true;
}
