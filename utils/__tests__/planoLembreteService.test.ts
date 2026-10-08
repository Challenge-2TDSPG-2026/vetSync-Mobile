import type { PlanoItem } from '../../utils/planoPreventivo';

const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockGetAll = jest.fn();
const mockCancel = jest.fn();
const mockSchedule = jest.fn();

jest.doMock('expo-notifications', () => ({
  getPermissionsAsync: (...a: unknown[]) => mockGetPermissions(...a),
  requestPermissionsAsync: (...a: unknown[]) => mockRequestPermissions(...a),
  getAllScheduledNotificationsAsync: (...a: unknown[]) => mockGetAll(...a),
  cancelScheduledNotificationAsync: (...a: unknown[]) => mockCancel(...a),
  scheduleNotificationAsync: (...a: unknown[]) => mockSchedule(...a),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- carrega após o doMock
const servico = require('../planoLembreteService') as typeof import('../planoLembreteService');

function daquiA(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('sv-SE');
}

const item: PlanoItem = {
  id: 'vacina:1', origem: 'VACINA', titulo: 'V10', descricao: null, status: 'VENCENDO',
  dataVencimento: daquiA(10), diasParaVencer: 10, eventoId: null, podeAgendar: true, servicoSugerido: 'Vacina',
};

describe('planoLembreteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockSchedule.mockResolvedValue('id');
  });

  it('não agenda nada sem permissão (e não pede permissão sozinho)', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'denied' });
    expect(await servico.sincronizarLembretesDoPlano('12', 'Luna', [item], [7, 1])).toBe(0);
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it('cancela só os lembretes do plano do pet antes de recriar', async () => {
    mockGetAll.mockResolvedValue([
      { identifier: 'a', content: { data: { planoPetId: '12' } } },
      { identifier: 'b', content: { data: { planoPetId: '99' } } },
      { identifier: 'c', content: { data: { eventoId: '5' } } },
    ]);
    const total = await servico.sincronizarLembretesDoPlano('12', 'Luna', [item], [7, 1]);
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockCancel).toHaveBeenCalledWith('a');
    expect(total).toBe(2);
    expect(mockSchedule).toHaveBeenCalledTimes(2);
    expect(mockSchedule.mock.calls[0][0].content.data).toMatchObject({ planoPetId: '12', planoItemId: 'vacina:1' });
  });

  it('pede permissão apenas quando solicitado explicitamente', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    expect(await servico.garantirPermissaoLembretes()).toBe(true);
    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
  });
});