import { api } from '../api/httpClient';
import { petAcessoService } from '../petAcessoService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

describe('petAcessoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cria um convite de acesso e converte o id numérico para string', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      idConvite: 10, email: 'cuidador@vetsync.test', nomePet: 'Luna',
      relacao: 'CUIDADOR', permissao: 'LEITURA', status: 'PENDENTE', expiraEm: '2026-10-10T00:00:00',
    });

    const dados = { email: 'cuidador@vetsync.test', relacao: 'CUIDADOR' as const, permissao: 'LEITURA' as const };
    const convite = await petAcessoService.criarConvite('12', dados);

    expect(api.post).toHaveBeenCalledWith('/pets/12/convites', dados);
    expect(convite.idConvite).toBe('10');
    expect(convite.status).toBe('PENDENTE');
  });

  it('lista os acessos de um pet convertendo idAcesso e idTutor para string', async () => {
    (api.get as jest.Mock).mockResolvedValue([{
      idAcesso: 4, idTutor: 8, nomeTutor: 'Maria', emailTutor: 'maria@vetsync.test',
      relacao: 'CONJUGE', permissao: 'EDICAO', status: 'ATIVO', dtConcedido: '2026-08-01T00:00:00',
    }]);

    const acessos = await petAcessoService.listarAcessos('12');

    expect(api.get).toHaveBeenCalledWith('/pets/12/acessos');
    expect(acessos[0]).toEqual(expect.objectContaining({ idAcesso: '4', idTutor: '8' }));
  });

  it('revoga um acesso pelos ids de pet e acesso', async () => {
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    await petAcessoService.revogarAcesso('12', '4');

    expect(api.delete).toHaveBeenCalledWith('/pets/12/acessos/4');
  });
});
