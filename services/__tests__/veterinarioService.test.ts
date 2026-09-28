import { api } from '../api/httpClient';
import { veterinarioService } from '../veterinarioService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const dtoVet = {
  idVeterinario: 9, nmVeterinario: 'Dra. Ana', nrCrmv: 'CRMV-SP 12345',
  idClinica: 3, nmClinica: 'Clínica VetSync', dsEspecialidade: 'Cardiologia',
};

describe('veterinarioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista veterinários sem query string quando nenhuma especialidade é informada', async () => {
    (api.get as jest.Mock).mockResolvedValue([dtoVet]);

    const vets = await veterinarioService.listarVeterinarios();

    expect(api.get).toHaveBeenCalledWith('/veterinarios');
    expect(vets[0]).toEqual({
      id: '9', nome: 'Dra. Ana', crmv: 'CRMV-SP 12345',
      idClinica: '3', nomeClinica: 'Clínica VetSync', especialidade: 'Cardiologia',
    });
  });

  it('filtra por especialidade via query string quando informada', async () => {
    (api.get as jest.Mock).mockResolvedValue([dtoVet]);

    await veterinarioService.listarVeterinarios('Cardiologia');

    expect(api.get).toHaveBeenCalledWith('/veterinarios?especialidade=Cardiologia');
  });

  it('mapeia idClinica e especialidade nulos corretamente', async () => {
    (api.get as jest.Mock).mockResolvedValue({ ...dtoVet, idClinica: null, nmClinica: null, dsEspecialidade: null });

    const vet = await veterinarioService.buscarPorId('9');

    expect(api.get).toHaveBeenCalledWith('/veterinarios/9');
    expect(vet.idClinica).toBeNull();
    expect(vet.especialidade).toBeNull();
  });

  it('lista faixas de disponibilidade de um veterinário', async () => {
    (api.get as jest.Mock).mockResolvedValue([
      { idDisponibilidade: 1, nrDiaSemana: 2, hrInicio: '08:00', hrFim: '12:00' },
    ]);

    const faixas = await veterinarioService.listarDisponibilidade('9');

    expect(api.get).toHaveBeenCalledWith('/veterinarios/9/disponibilidade');
    expect(faixas).toEqual([{ id: '1', diaSemana: 2, horaInicio: '08:00', horaFim: '12:00' }]);
  });

  it('adiciona uma faixa de disponibilidade convertendo os campos para o payload da API', async () => {
    (api.post as jest.Mock).mockResolvedValue({ idDisponibilidade: 5, nrDiaSemana: 3, hrInicio: '13:00', hrFim: '18:00' });

    const faixa = await veterinarioService.adicionarFaixaDisponibilidade('9', {
      diaSemana: 3, horaInicio: '13:00', horaFim: '18:00',
    });

    expect(api.post).toHaveBeenCalledWith('/veterinarios/9/disponibilidade', {
      nrDiaSemana: 3, hrInicio: '13:00', hrFim: '18:00',
    });
    expect(faixa.id).toBe('5');
  });

  it('remove uma faixa de disponibilidade pelos ids de veterinário e faixa', async () => {
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    await veterinarioService.removerFaixaDisponibilidade('9', '5');

    expect(api.delete).toHaveBeenCalledWith('/veterinarios/9/disponibilidade/5');
  });

  it('lista bloqueios de agenda mapeando motivo ausente para undefined', async () => {
    (api.get as jest.Mock).mockResolvedValue([
      { idBloqueio: 2, dtInicio: '2026-11-01', dtFim: '2026-11-10', motivo: null },
    ]);

    const bloqueios = await veterinarioService.listarBloqueios('9');

    expect(api.get).toHaveBeenCalledWith('/veterinarios/9/bloqueios');
    expect(bloqueios[0].motivo).toBeUndefined();
  });

  it('adiciona um bloqueio de agenda enviando motivo nulo quando omitido', async () => {
    (api.post as jest.Mock).mockResolvedValue({ idBloqueio: 4, dtInicio: '2026-12-01', dtFim: '2026-12-05', motivo: null });

    await veterinarioService.adicionarBloqueio('9', { dataInicio: '2026-12-01', dataFim: '2026-12-05' });

    expect(api.post).toHaveBeenCalledWith('/veterinarios/9/bloqueios', {
      dtInicio: '2026-12-01', dtFim: '2026-12-05', motivo: null,
    });
  });

  it('remove um bloqueio de agenda pelos ids de veterinário e bloqueio', async () => {
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    await veterinarioService.removerBloqueio('9', '4');

    expect(api.delete).toHaveBeenCalledWith('/veterinarios/9/bloqueios/4');
  });
});
