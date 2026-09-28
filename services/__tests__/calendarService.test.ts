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

    it('agenda um lembrete por dia informado, pulando disparos que já ficariam no passado', async () => {
      const { agendarLembretes } = carregarCalendarService();
      mockRequestPermissionsAsyncNotif.mockResolvedValue({ status: 'granted' });
      mockScheduleNotificationAsync.mockResolvedValue('lembrete-1-dia');

      // Evento daqui a 5 dias: o lembrete de "7 dias antes" já ficaria no passado e deve ser pulado.
      const eventoEm5Dias: Evento = {
        ...eventoFuturo,
        data: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const ids = await agendarLembretes(eventoEm5Dias, petLuna, [7, 1]);

      expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.objectContaining({
          title: 'Evento em 1 dia',
          body: 'Vacina V10 — Luna',
          data: { eventoId: eventoFuturo.id },
        }),
      }));
      expect(ids).toEqual(['lembrete-1-dia']);
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
