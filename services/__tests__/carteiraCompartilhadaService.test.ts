import { api } from '../api/httpClient';
import { carteiraCompartilhadaService } from '../carteiraCompartilhadaService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

describe('carteiraCompartilhadaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('busca a carteira compartilhável ativa de um pet', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      id: 1, criadaEm: '2026-09-01T00:00:00', expiraEm: '2026-09-08T00:00:00', ultimoAcessoEm: null,
    });

    const carteira = await carteiraCompartilhadaService.buscarAtiva('12');

    expect(api.get).toHaveBeenCalledWith('/pets/12/carteira-compartilhavel');
    expect(carteira).toEqual({ id: '1', criadaEm: '2026-09-01T00:00:00', expiraEm: '2026-09-08T00:00:00', ultimoAcessoEm: null });
  });

  it('cria ou renova a carteira compartilhável, devolvendo a URL pública', async () => {
    (api.post as jest.Mock).mockResolvedValue({ id: 2, urlPublica: 'https://vetsync.com/c/abc123', expiraEm: '2026-09-15T00:00:00' });

    const criada = await carteiraCompartilhadaService.criarOuRenovar('12');

    expect(api.post).toHaveBeenCalledWith('/pets/12/carteira-compartilhavel');
    expect(criada).toEqual({ id: '2', urlPublica: 'https://vetsync.com/c/abc123', expiraEm: '2026-09-15T00:00:00' });
  });

  it('revoga a carteira compartilhável pelos ids de pet e carteira', async () => {
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    await carteiraCompartilhadaService.revogar('12', '2');

    expect(api.delete).toHaveBeenCalledWith('/pets/12/carteira-compartilhavel/2');
  });
});
