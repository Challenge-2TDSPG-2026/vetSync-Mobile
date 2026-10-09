import { api } from '../api/httpClient';
import { listaEsperaService } from '../listaEsperaService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const dto = {
  id: 3,
  status: 'AGUARDANDO' as const,
  idPet: 7,
  nmPet: 'Rex',
  idServico: 5,
  nmServico: 'Consulta',
  dataInicio: '2026-10-12',
  dataFim: '2026-10-20',
  horaMin: null,
  horaMax: '18:00',
  dataVaga: null,
  horaVaga: null,
  notificadaEm: null,
  criadaEm: '2026-10-09T10:00:00',
};

describe('listaEsperaService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lista as entradas ativas convertendo ids para texto', async () => {
    (api.get as jest.Mock).mockResolvedValue([dto]);

    const lista = await listaEsperaService.listar();

    expect(api.get).toHaveBeenCalledWith('/agenda/espera');
    expect(lista[0]).toMatchObject({ id: '3', idPet: '7', nomePet: 'Rex', idServico: 5, nomeServico: 'Consulta', horaMax: '18:00' });
  });

  it('entra na fila enviando ids numéricos e campos opcionais nulos', async () => {
    (api.post as jest.Mock).mockResolvedValue(dto);

    await listaEsperaService.entrar({ idPet: '7', idServico: 5, dataInicio: '2026-10-12', dataFim: '2026-10-20', horaMax: '18:00' });

    expect(api.post).toHaveBeenCalledWith('/agenda/espera', {
      idPet: 7,
      idServico: 5,
      dataInicio: '2026-10-12',
      dataFim: '2026-10-20',
      horaMin: null,
      horaMax: '18:00',
      idVeterinario: null,
      idProfissionalEstetica: null,
    });
  });

  it('sai da fila pelo id', async () => {
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    await listaEsperaService.sair('3');

    expect(api.delete).toHaveBeenCalledWith('/agenda/espera/3');
  });
});