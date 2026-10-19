import { api } from '../api/httpClient';
import {
  listarNotificacoes,
  notificacaoService,
} from '../notificationService';

jest.mock('../api/httpClient', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('notificacaoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista notificações lidas e não lidas', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      content: [
        {
          id: 1,
          tipo: 'EVENTO_CONFIRMADO',
          titulo: 'Agendamento confirmado',
          mensagem: 'Sua consulta foi confirmada.',
          lida: true,
          criadaEm: '2026-10-19T12:00:00',
        },
      ],
    });

    const notificacoes = await listarNotificacoes();

    expect(api.get).toHaveBeenCalledWith('/notificacoes?page=0&size=50');
    expect(notificacoes).toHaveLength(1);
    expect(notificacoes[0].lida).toBe(true);
  });

  it('mantém filtros opcionais quando solicitados', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);

    await notificacaoService.listar(false);

    expect(api.get).toHaveBeenCalledWith(
      '/notificacoes?lida=false&page=0&size=50'
    );
  });
});
