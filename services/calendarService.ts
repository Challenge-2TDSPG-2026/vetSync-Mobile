import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Evento, Pet } from '../types';
import { parseDataEvento } from '../utils/eventoStatus';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NOME_CALENDARIO = 'VetSync';

export async function pedirPermissaoCalendario(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function pedirPermissaoNotificacao(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function obterOuCriarCalendarioId(): Promise<string> {
  const calendarios = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existente = calendarios.find(c => c.title === NOME_CALENDARIO);
  if (existente) return existente.id;

  const origemPadrao =
    Platform.OS === 'ios'
      ? await Calendar.getDefaultCalendarAsync()
      : { isLocalAccount: true, name: NOME_CALENDARIO };

  return Calendar.createCalendarAsync({
    title: NOME_CALENDARIO,
    color: '#22a06b',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: Platform.OS === 'ios' ? (origemPadrao as any).source?.id : undefined,
    source:
      Platform.OS === 'android'
        ? { isLocalAccount: true, name: NOME_CALENDARIO, type: 'LOCAL' }
        : (origemPadrao as any).source,
    name: NOME_CALENDARIO,
    ownerAccount: NOME_CALENDARIO,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export async function adicionarEventoAoCalendario(evento: Evento, pet?: Pet | null): Promise<string | null> {
  const ok = await pedirPermissaoCalendario();
  if (!ok) return null;

  const calendarioId = await obterOuCriarCalendarioId();
  const inicio = parseDataEvento(evento.data);
  const fim = new Date(inicio.getTime() + 60 * 60 * 1000);

  return Calendar.createEventAsync(calendarioId, {
    title: `${evento.nomeTipoEvento}${pet ? ` — ${pet.nome}` : ''}`,
    notes: evento.observacao ?? '',
    startDate: inicio,
    endDate: fim,
    timeZone: undefined,
  });
}

export async function removerEventoDoCalendario(calendarEventId: string): Promise<void> {
  try {
    await Calendar.deleteEventAsync(calendarEventId);
  } catch {}
}

export async function agendarLembretes(
  evento: Evento,
  pet: Pet | null,
  diasAntes: number[] = [7, 1],
): Promise<string[]> {
  const ok = await pedirPermissaoNotificacao();
  if (!ok) return [];

  const dataEvento = parseDataEvento(evento.data);
  const ids: string[] = [];

  for (const dias of diasAntes) {
    const disparo = new Date(dataEvento);
    disparo.setDate(disparo.getDate() - dias);
    disparo.setHours(9, 0, 0, 0);
    if (disparo.getTime() <= Date.now()) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: dias === 0 ? 'Evento hoje' : `Evento em ${dias} dia${dias > 1 ? 's' : ''}`,
        body: `${evento.nomeTipoEvento}${pet ? ` — ${pet.nome}` : ''}`,
        data: { eventoId: evento.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: disparo },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelarLembretes(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
}