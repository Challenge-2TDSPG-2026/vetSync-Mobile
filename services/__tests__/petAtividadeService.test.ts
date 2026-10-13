import { api } from '../api/httpClient';
import { petAtividadeService } from '../petAtividadeService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

describe('petAtividadeService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lista atividades, converte ids, ordena da mais recente e trata tipos desconhecidos', async () => {
    (api.get as jest.Mock).mockResolvedValue([
      { idAtividade: 1, tipo: 'ACESSO_CONCEDIDO', descricao: 'Maria entrou', autorNome: 'Ana', dtAtividade: '2026-10-01T10:00:00' },
      { idAtividade: 2, tipo: 'ALGO_NOVO', descricao: null, autorNome: null, dtAtividade: '2026-10-05T10:00:00' },
    ]);

    const lista = await petAtividadeService.listar('12');

    expect(api.get).toHaveBeenCalledWith('/pets/12/atividades?limite=30');
    expect(lista.map((a) => a.idAtividade)).toEqual(['2', '1']);
    expect(lista[0]).toEqual(expect.objectContaining({ tipo: 'OUTRO', descricao: 'Alteração registrada', autorNome: 'Alguém com acesso' }));
  });
});
