import { api } from '../api/httpClient';
import { petHealthService } from '../petHealthService';
import type { PerfilSaudePetAtualizacao } from '../../types';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), put: jest.fn() },
}));

const perfil: PerfilSaudePetAtualizacao = {
  pesoAtual: 12.5,
  alergias: 'Dipirona',
  medicamentosContinuos: null,
  restricoesAlimentares: null,
  condicoesPreExistentes: 'Cardiopatia',
  observacoesImportantes: null,
  contatoEmergencia: 'Ana · (11) 99999-0000',
  veterinarioPreferencialId: null,
};

describe('petHealthService - perfil de saúde', () => {
  beforeEach(() => jest.clearAllMocks());

  it('busca o perfil de saúde do pet', async () => {
    (api.get as jest.Mock).mockResolvedValue(perfil);

    await petHealthService.buscarPerfilSaude('12');

    expect(api.get).toHaveBeenCalledWith('/pets/12/perfil-saude');
  });

  it('atualiza os campos registrados sem incluir dados derivados', async () => {
    (api.put as jest.Mock).mockResolvedValue(perfil);

    await petHealthService.atualizarPerfilSaude('12', perfil);

    expect(api.put).toHaveBeenCalledWith('/pets/12/perfil-saude', perfil);
  });
});
