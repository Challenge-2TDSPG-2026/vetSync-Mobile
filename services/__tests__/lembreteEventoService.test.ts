import type { Evento, Pet } from '../../types';
import { reagendarLembretesEvento } from '../lembreteEventoService';

const mockObterERemover = jest.fn();
const mockSalvar = jest.fn();
const mockAgendar = jest.fn();
const mockCancelar = jest.fn();

jest.mock('../../storage/petStorage', () => ({
  obterERemoverLembretesEvento: (...args: unknown[]) => mockObterERemover(...args),
  salvarLembretesEvento: (...args: unknown[]) => mockSalvar(...args),
}));
jest.mock('../calendarService', () => ({
  agendarLembretes: (...args: unknown[]) => mockAgendar(...args),
  cancelarLembretes: (...args: unknown[]) => mockCancelar(...args),
}));

const pet: Pet = {
  id: '12',
  nome: 'Luna',
  especie: 'cachorro',
  sexo: 'femea',
  raca: 'Vira-lata',
  dataNascimento: '2020-12-25T00:00:00',
  peso: '12.5',
};
const evento: Evento = {
  id: '7',
  petId: '12',
  status: 'AGENDADO',
  idTipoEvento: '3',
  nomeTipoEvento: 'Vacina V10',
  categoriaTipoEvento: 'PREVENTIVO',
  idVeterinario: '9',
  nomeVeterinario: 'Dra. Ana',
  data: '2026-11-10',
  hora: '10:00',
  custo: 0,
};

describe('reagendarLembretesEvento', () => {
  beforeEach(() => jest.resetAllMocks());

  it('não faz nada quando o evento não tinha lembretes', async () => {
    mockObterERemover.mockResolvedValue([]);

    await expect(reagendarLembretesEvento(evento, pet)).resolves.toEqual([]);

    expect(mockCancelar).not.toHaveBeenCalled();
    expect(mockAgendar).not.toHaveBeenCalled();
    expect(mockSalvar).not.toHaveBeenCalled();
  });

  it('cancela os antigos e recria só as antecedências que o tutor tinha escolhido', async () => {
    mockObterERemover.mockResolvedValue(['evento-7-lembrete-30']);
    mockAgendar.mockResolvedValue(['evento-7-lembrete-30']);

    const ids = await reagendarLembretesEvento(evento, pet);

    expect(mockCancelar).toHaveBeenCalledWith(['evento-7-lembrete-30']);
    expect(mockAgendar).toHaveBeenCalledWith(evento, pet, [30]);
    expect(mockSalvar).toHaveBeenCalledWith('7', ['evento-7-lembrete-30']);
    expect(ids).toEqual(['evento-7-lembrete-30']);
  });

  it('usa 24h e 30min quando os lembretes antigos não trazem a antecedência', async () => {
    mockObterERemover.mockResolvedValue(['8f14e45f-ceea-467a-9575-1c0f9f0b2d3a']);
    mockAgendar.mockResolvedValue(['a', 'b']);

    await reagendarLembretesEvento(evento, pet);

    expect(mockAgendar).toHaveBeenCalledWith(evento, pet, [1440, 30]);
  });
});
