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

  // Desde o SDK 53, o Expo Go para Android não inclui a implementação nativa
  // necessária para push remoto. A checagem precisa acontecer antes do require,
  // pois o próprio carregamento do módulo lança uma exceção nesse ambiente.
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
    notifications = null;
    return notifications;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- carregamento sob demanda intencional, evita crash no Expo Go Android
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

  const plataforma = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
  await api.post('/notificacoes/dispositivos', {
    token: token.trim(),
    plataforma,
    nomeDispositivo: 'Dispositivo móvel',
    fusoHorario: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
  });
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

export interface ToqueEmNotificacao {
  /** Identificador estável do toque; evita tratar o mesmo toque duas vezes. */
  chave: string;
  dados: Record<string, unknown> | null;
}

function paraToque(resposta: NotificationsModule.NotificationResponse | null | undefined): ToqueEmNotificacao | null {
  if (!resposta) return null;
  const dados = resposta.notification.request.content.data;
  return {
    chave: `${resposta.notification.request.identifier}:${resposta.notification.date}`,
    dados: dados && typeof dados === 'object' ? (dados as Record<string, unknown>) : null,
  };
}

/**
 * Notificação que abriu o app a partir do estado encerrado (cold start). Retorna null quando
 * não houve toque ou quando push não é suportado na plataforma.
 */
export async function obterToqueQueAbriuOApp(): Promise<ToqueEmNotificacao | null> {
  const notificacoes = obterNotificacoes();
  if (!notificacoes) return null;
  try {
    return paraToque(await notificacoes.getLastNotificationResponseAsync());
  } catch {
    return null;
  }
}

/** Escuta toques em notificações com o app aberto ou em segundo plano. Retorna a função que cancela a escuta. */
export function observarToquesEmNotificacao(aoTocar: (toque: ToqueEmNotificacao) => void): () => void {
  const notificacoes = obterNotificacoes();
  if (!notificacoes) return () => {};
  const assinatura = notificacoes.addNotificationResponseReceivedListener(resposta => {
    const toque = paraToque(resposta);
    if (toque) aoTocar(toque);
  });
  return () => assinatura.remove();
}