import { api } from '../api/httpClient';
import { recompensaService } from '../recompensaService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

describe('recompensaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista o catálogo de recompensas convertendo o DTO para o modelo do app', async () => {
    (api.get as jest.Mock).mockResolvedValue([
      { idRecompensa: 1, nome: 'Banho grátis', descricao: null, custoPontos: 100, tipo: 'SERVICO', ativa: true },
    ]);

    const recompensas = await recompensaService.listarCatalogo();

    expect(api.get).toHaveBeenCalledWith('/recompensas');
    expect(recompensas).toEqual([
      { id: '1', nome: 'Banho grátis', descricao: undefined, custoPontos: 100, tipo: 'SERVICO', ativa: true },
    ]);
  });

  it('consulta o saldo de pontos', async () => {
    (api.get as jest.Mock).mockResolvedValue(320);

    const saldo = await recompensaService.consultarSaldo();

    expect(api.get).toHaveBeenCalledWith('/recompensas/saldo');
    expect(saldo).toBe(320);
  });

  it('lista os resgates do tutor convertendo o validador nulo para undefined', async () => {
    (api.get as jest.Mock).mockResolvedValue([
      { idResgate: 5, status: 'PENDENTE', dtResgate: '2026-09-01', nmRecompensa: 'Banho grátis', custoPontos: 100, nmVeterinarioValidador: null },
    ]);

    const resgates = await recompensaService.listarMeusResgates();

    expect(api.get).toHaveBeenCalledWith('/recompensas/resgates');
    expect(resgates[0].nomeVeterinarioValidador).toBeUndefined();
  });

  it('resgata uma recompensa pelo id via PATCH', async () => {
    (api.patch as jest.Mock).mockResolvedValue({
      idResgate: 6, status: 'PENDENTE', dtResgate: '2026-09-02', nmRecompensa: 'Consulta grátis', custoPontos: 500, nmVeterinarioValidador: null,
    });

    const resgate = await recompensaService.resgatar('3');

    expect(api.patch).toHaveBeenCalledWith('/recompensas/3/resgatar');
    expect(resgate.id).toBe('6');
  });

  it('valida um resgate enviando a decisão de aprovação', async () => {
    (api.patch as jest.Mock).mockResolvedValue({
      idResgate: 6, status: 'APROVADO', dtResgate: '2026-09-02', nmRecompensa: 'Consulta grátis', custoPontos: 500, nmVeterinarioValidador: 'Dra. Ana',
    });

    const resgate = await recompensaService.validarResgate('6', true);

    expect(api.patch).toHaveBeenCalledWith('/recompensas/resgates/6/validar', { aprovado: true });
    expect(resgate.status).toBe('APROVADO');
    expect(resgate.nomeVeterinarioValidador).toBe('Dra. Ana');
  });
});
