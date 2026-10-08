import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type * as NotificationsModule from 'expo-notifications';
import { STORAGE_KEYS } from '../constants';
import { calcularLembretes, type PlanoItem } from '../utils/planoPreventivo';

/**
 * Lembretes LOCAIS do plano preventivo. Complementam (não substituem) as
 * notificações push disparadas pelo backend.
 *
 * Cada notificação carrega `data.planoPetId`, o que permite cancelar/recriar
 * só os lembretes do plano de um pet sem tocar nos lembretes de eventos.
 */

let notifications: typeof NotificationsModule | null | undefined;

function obterNotificacoes(): typeof NotificationsModule | null {
  if (notifications !== undefined) return notifications;
  if (Platform.OS === 'web') {
    notifications = null;
    return notifications;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- carregamento sob demanda, evita crash no Expo Go Android
    notifications = require('expo-notifications') as typeof NotificationsModule;
  } catch {
    notifications = null;
  }
  return notifications;
}

export async function lembretesPlanoAtivos(): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.LEMBRETES_PLANO)) === 'true';
}

export async function definirLembretesPlanoAtivos(ativo: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.LEMBRETES_PLANO, ativo ? 'true' : 'false');
}

/** Pede permissão (se ainda não concedida). Retorna false se indisponível ou negada. */
export async function garantirPermissaoLembretes(): Promise<boolean> {
  const n = obterNotificacoes();
  if (!n) return false;
  const atual = await n.getPermissionsAsync();
  if (atual.status === 'granted') return true;
  const pedido = await n.requestPermissionsAsync();
  return pedido.status === 'granted';
}

export async function cancelarLembretesDoPlano(petId: string): Promise<void> {
  const n = obterNotificacoes();
  if (!n) return;
  const agendadas = await n.getAllScheduledNotificationsAsync();
  await Promise.all(
    agendadas
      .filter(a => a.content.data?.planoPetId === petId)
      .map(a => n.cancelScheduledNotificationAsync(a.identifier)),
  );
}

/**
 * Recria os lembretes do plano do pet. Idempotente: pode ser chamada a cada
 * mudança do plano. Não pede permissão — usa só se já concedida.
 * Retorna a quantidade de lembretes agendados.
 */
export async function sincronizarLembretesDoPlano(
  petId: string,
  nomePet: string,
  itens: PlanoItem[],
  diasAntes: number[],
): Promise<number> {
  const n = obterNotificacoes();
  if (!n) return 0;

  const permissao = await n.getPermissionsAsync();
  if (permissao.status !== 'granted') return 0;

  await cancelarLembretesDoPlano(petId);

  const lembretes = calcularLembretes(itens, nomePet, { diasAntes });
  for (const l of lembretes) {
    await n.scheduleNotificationAsync({
      content: {
        title: l.titulo,
        body: l.corpo,
        data: { planoPetId: petId, planoItemId: l.itemId, rota: '/(tutor)/plano-preventivo' },
      },
      trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: l.quando },
    });
  }
  return lembretes.length;
}