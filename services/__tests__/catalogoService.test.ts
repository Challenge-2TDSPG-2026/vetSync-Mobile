import { api } from '../api/httpClient';
import { catalogoService } from '../catalogoService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

describe('catalogoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista tipos de evento convertendo o DTO para o modelo do app', async () => {
    (api.get as jest.Mock).mockResolvedValue([
      { idTipoEvento: 1, nmTipoEvento: 'Vacina V10', dsCategoria: 'VACINA', nrPontos: 10 },
    ]);

    const tipos = await catalogoService.listarTiposEvento();

    expect(api.get).toHaveBeenCalledWith('/tipos-evento');
    expect(tipos).toEqual([{ id: '1', nome: 'Vacina V10', categoria: 'VACINA', pontos: 10 }]);
  });

  it('lista veterinários sem filtro quando nenhuma especialidade é informada', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);

    await catalogoService.listarVeterinarios();

    expect(api.get).toHaveBeenCalledWith('/veterinarios');
  });

  it('lista veterinários filtrando por especialidade via query string', async () => {
    (api.get as jest.Mock).mockResolvedValue([
      { idVeterinario: 9, nmVeterinario: 'Dra. Ana', nrCrmv: 'CRMV-SP 1', idClinica: null, nmClinica: null, dsEspecialidade: 'Cardiologia' },
    ]);

    const vets = await catalogoService.listarVeterinarios('Cardiologia');

    expect(api.get).toHaveBeenCalledWith('/veterinarios?especialidade=Cardiologia');
    expect(vets[0].idClinica).toBeNull();
  });

  it('sugere raças convertendo a espécie do app para o código da API', async () => {
    (api.get as jest.Mock).mockResolvedValue(['Labrador', 'Vira-lata']);

    const racas = await catalogoService.sugerirRacas('cachorro');

    expect(api.get).toHaveBeenCalledWith('/pets/racas?especie=CAO');
    expect(racas).toEqual(['Labrador', 'Vira-lata']);
  });

  it('inclui o texto de busca na query string quando informado', async () => {
    (api.get as jest.Mock).mockResolvedValue(['Siamês']);

    await catalogoService.sugerirRacas('gato', '  Siam  ');

    expect(api.get).toHaveBeenCalledWith('/pets/racas?especie=GATO&q=Siam');
  });

  it('não inclui o parâmetro "q" quando o texto de busca é vazio ou só espaços', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);

    await catalogoService.sugerirRacas('gato', '   ');

    expect(api.get).toHaveBeenCalledWith('/pets/racas?especie=GATO');
  });
});
