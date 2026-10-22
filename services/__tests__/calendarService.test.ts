import type { Evento, Pet } from '../../types';

const mockRequestCalendarPermissionsAsync = jest.fn();
const mockGetCalendarsAsync = jest.fn();
const mockGetDefaultCalendarAsync = jest.fn();
const mockCreateCalendarAsync = jest.fn();
const mockCreateEventAsync = jest.fn();
const mockDeleteEventAsync = jest.fn();

jest.mock('expo-calendar', () => ({
  EntityTypes: { EVENT: 'event' },
  CalendarAccessLevel: { OWNER: 'owner' },
  requestCalendarPermissionsAsync: (...args: unknown[]) => mockRequestCalendarPermissionsAsync(...args),
  getCalendarsAsync: (...args: unknown[]) => mockGetCalendarsAsync(...args),
  getDefaultCalendarAsync: (...args: unknown[]) => mockGetDefaultCalendarAsync(...args),
  createCalendarAsync: (...args: unknown[]) => mockCreateCalendarAsync(...args),
  createEventAsync: (...args: unknown[]) => mockCreateEventAsync(...args),
  deleteEventAsync: (...args: unknown[]) => mockDeleteEventAsync(...args),
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const platform = { OS: 'android', select: (spec: Record<string, unknown>) => spec.android ?? spec.default };
  return { __esModule: true, default: platform, ...platform };
});

const mockSetNotificationHandler = jest.fn();
const mockGetPermissionsAsyncNotif = jest.fn();
const mockRequestPermissionsAsyncNotif = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();

/** Reestabelece o mock "feliz" de expo-notifications. Chamado a cada teste, para nenhum vazar para o próximo. */
function mockNotificacoesDisponivel() {
  jest.doMock('expo-notifications', () => ({
    setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
    getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsyncNotif(...args),
    requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsyncNotif(...args),
    scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
    cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancelScheduledNotificationAsync(...args),
    SchedulableTriggerInputTypes: { DATE: 'date' },
  }));
}

/** Simula o require('expo-notifications') falhando, como no Expo Go Android. */
function mockNotificacoesIndisponivel() {
  jest.doMock('expo-notifications', () => {
    throw new Error('módulo indisponível no Expo Go');
  });
}

/** Cada teste carrega uma instância nova do módulo, pra não reaproveitar o cache interno de `notifications`. */
function carregarCalendarService(): typeof import('../calendarService') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- precisa ser um require() em tempo de execução para pegar o módulo pós reset (jest.resetModules)
  return require('../calendarService');
}

const petLuna: Pet = {
  id: '12', nome: 'Luna', especie: 'cachorro', sexo: 'femea', raca: 'Vira-lata',
  dataNascimento: '2020-12-25T00:00:00', peso: '12.5',
};

const eventoFuturo: Evento = {
  id: '1', petId: '12', status: 'AGENDADO', idTipoEvento: '3', nomeTipoEvento: 'Vacina V10',
  categoriaTipoEvento: 'PREVENTIVO', idVeterinario: '9', nomeVeterinario: 'Dra. Ana',
  data: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  custo: 0,
};

describe('calendarService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    mockNotificacoesDisponivel();
  });

  describe('pedirPermissaoCalendario', () => {
    it('devolve true quando a permissão é concedida', async () => {
      const { pedirPermissaoCalendario } = carregarCalendarService();
      mockRequestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });

      await expect(pedirPermissaoCalendario()).resolves.toBe(true);
    });

    it('devolve false quando a permissão é negada', async () => {
      const { pedirPermissaoCalendario } = carregarCalendarService();
      mockRequestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });

      await expect(pedirPermissaoCalendario()).resolves.toBe(false);
    });
  });

  describe('adicionarEventoAoCalendario', () => {
    it('devolve null sem criar nada quando a permissão de calendário é negada', async () => {
      const { adicionarEventoAoCalendario } = carregarCalendarService();
      mockRequestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const resultado = await adicionarEventoAoCalendario(eventoFuturo, petLuna);

      expect(resultado).toBeNull();
      expect(mockCreateEventAsync).not.toHaveBeenCalled();
    });

    it('reaproveita o calendário "VetSync" existente e cria o evento com título e notas do pet', async () => {
      const { adicionarEventoAoCalendario } = carregarCalendarService();
      mockRequestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetCalendarsAsync.mockResolvedValue([{ id: 'cal-1', title: 'VetSync' }]);
      mockCreateEventAsync.mockResolvedValue('evento-calendario-1');

      const resultado = await adicionarEventoAoCalendario(eventoFuturo, petLuna);

      expect(mockCreateCalendarAsync).not.toHaveBeenCalled();
      expect(mockCreateEventAsync).toHaveBeenCalledWith(
        'cal-1',
        expect.objectContaining({ title: 'Vacina V10 — Luna', notes: '' })
      );
      expect(resultado).toBe('evento-calendario-1');
    });

    it('cria o calendário "VetSync" no Android como conta local quando ele ainda não existe', async () => {
      const { adicionarEventoAoCalendario } = carregarCalendarService();
      mockRequestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetCalendarsAsync.mockResolvedValue([]);
      mockCreateCalendarAsync.mockResolvedValue('cal-novo');
      mockCreateEventAsync.mockResolvedValue('evento-calendario-2');

      await adicionarEventoAoCalendario(eventoFuturo, petLuna);

      expect(mockGetDefaultCalendarAsync).not.toHaveBeenCalled();
      expect(mockCreateCalendarAsync).toHaveBeenCalledWith(expect.objectContaining({
        title: 'VetSync',
        source: { isLocalAccount: true, name: 'VetSync', type: 'LOCAL' },
      }));
      expect(mockCreateEventAsync).toHaveBeenCalledWith('cal-novo', expect.any(Object));
    });

    it('monta o título só com o tipo de evento quando nenhum pet é informado', async () => {
      const { adicionarEventoAoCalendario } = carregarCalendarService();
      mockRequestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetCalendarsAsync.mockResolvedValue([{ id: 'cal-1', title: 'VetSync' }]);
      mockCreateEventAsync.mockResolvedValue('evento-calendario-3');

      await adicionarEventoAoCalendario(eventoFuturo);

      expect(mockCreateEventAsync).toHaveBeenCalledWith('cal-1', expect.objectContaining({ title: 'Vacina V10' }));
    });
  });

  describe('removerEventoDoCalendario', () => {
    it('remove o evento do calendário pelo id', async () => {
      const { removerEventoDoCalendario } = carregarCalendarService();
      mockDeleteEventAsync.mockResolvedValue(undefined);

      await removerEventoDoCalendario('evento-calendario-1');

      expect(mockDeleteEventAsync).toHaveBeenCalledWith('evento-calendario-1');
    });

    it('não lança erro quando a remoção falha (ex.: evento já removido do calendário)', async () => {
      const { removerEventoDoCalendario } = carregarCalendarService();
      mockDeleteEventAsync.mockRejectedValue(new Error('Evento não encontrado'));

      await expect(removerEventoDoCalendario('evento-inexistente')).resolves.toBeUndefined();
    });
  });

  describe('agendarLembretes', () => {
    it('devolve lista vazia sem pedir permissão quando o módulo de notificações não carrega', async () => {
      mockNotificacoesIndisponivel();
      const { agendarLembretes } = carregarCalendarService();

      const resultado = await agendarLembretes(eventoFuturo, petLuna);

      expect(resultado).toEqual([]);
      expect(mockRequestPermissionsAsyncNotif).not.toHaveBeenCalled();
    });

    it('devolve lista vazia quando a permissão de notificação é negada', async () => {
      const { agendarLembretes } = carregarCalendarService();
      mockRequestPermissionsAsyncNotif.mockResolvedValue({ status: 'denied' });

      const resultado = await agendarLembretes(eventoFuturo, petLuna);

      expect(resultado).toEqual([]);
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('agenda por padrão os avisos de 24 horas e 30 minutos antes do horário exato do evento', async () => {
      const { agendarLembretes } = carregarCalendarService();
      mockRequestPermissionsAsyncNotif.mockResolvedValue({ status: 'granted' });
      mockScheduleNotificationAsync.mockImplementation(async ({ identifier }: { identifier: string }) => identifier);

      const inicio = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      inicio.setSeconds(0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      const evento: Evento = {
        ...eventoFuturo,
        data: `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())}`,
        hora: `${pad(inicio.getHours())}:${pad(inicio.getMinutes())}`,
      };

      const ids = await agendarLembretes(evento, petLuna);

      expect(ids).toEqual(['evento-1-lembrete-1440', 'evento-1-lembrete-30']);
      expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(2);

      const [aviso24h, aviso30min] = mockScheduleNotificationAsync.mock.calls.map(([arg]) => arg);
      expect(aviso24h.content.title).toBe('Evento em 24 horas');
      expect(aviso24h.trigger.date.getTime()).toBe(inicio.getTime() - 24 * 60 * 60 * 1000);
      expect(aviso30min.content.title).toBe('Evento em 30 minutos');
      expect(aviso30min.trigger.date.getTime()).toBe(inicio.getTime() - 30 * 60 * 1000);
      expect(aviso30min.content.body).toBe(`Vacina V10 — Luna às ${evento.hora}`);
      expect(aviso30min.content.data).toEqual({
        tipo: 'EVENTO_PROXIMO',
        referenciaTipo: 'EVENTO',
        referenciaId: String(eventoFuturo.id),
        petId: String(petLuna.id),
      });
    });

    it('pula os avisos cujo horário já passou (evento daqui a 10 horas não recebe o de 24h)', async () => {
      const { agendarLembretes } = carregarCalendarService();
      mockRequestPermissionsAsyncNotif.mockResolvedValue({ status: 'granted' });
      mockScheduleNotificationAsync.mockResolvedValue('lembrete-30-min');

      const eventoEm10Horas: Evento = {
        ...eventoFuturo,
        data: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
        hora: undefined,
      };

      const ids = await agendarLembretes(eventoEm10Horas, petLuna);

      expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.objectContaining({ title: 'Evento em 30 minutos', body: 'Vacina V10 — Luna' }),
      }));
      expect(ids).toEqual(['lembrete-30-min']);
    });

    it('não agenda nada quando o evento começa em menos de 30 minutos', async () => {
      const { agendarLembretes } = carregarCalendarService();
      mockRequestPermissionsAsyncNotif.mockResolvedValue({ status: 'granted' });

      const eventoEm10Minutos: Evento = {
        ...eventoFuturo,
        data: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        hora: undefined,
      };

      await expect(agendarLembretes(eventoEm10Minutos, petLuna)).resolves.toEqual([]);
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelarLembretes', () => {
    it('cancela todos os ids de lembrete informados', async () => {
      const { cancelarLembretes } = carregarCalendarService();
      mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);

      await cancelarLembretes(['lembrete-1', 'lembrete-2']);

      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('lembrete-1');
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('lembrete-2');
    });

    it('não chama a API de cancelamento quando a lista de ids é vazia', async () => {
      const { cancelarLembretes } = carregarCalendarService();

      await cancelarLembretes([]);

      expect(mockCancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    it('não faz nada quando o módulo de notificações não carrega', async () => {
      mockNotificacoesIndisponivel();
      const { cancelarLembretes } = carregarCalendarService();

      await expect(cancelarLembretes(['lembrete-1'])).resolves.toBeUndefined();
      expect(mockCancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
