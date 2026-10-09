import { api } from '../api/httpClient';
import { eventoService } from '../eventoService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const dtoBase = {
  idEvento: 42,
  status: 'AGENDADO' as const,
  nmTipoEvento: 'Vacina V10',
  dsCategoria: 'VACINA' as const,
  nmVeterinario: 'Dra. Ana',
  dtEvento: '2026-10-05T09:00:00',
  hrEvento: '09:00',
  dsObservacao: 'Trazer carteirinha',
  motivoCancelamento: null,
  vlCusto: 150.5,
  idPet: 7,
};

describe('eventoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista eventos convertendo o DTO da API para o modelo do app', async () => {
    (api.get as jest.Mock).mockResolvedValue([dtoBase]);

    const eventos = await eventoService.listarEventos();

    expect(api.get).toHaveBeenCalledWith('/eventos');
    expect(eventos).toEqual([{
      id: '42',
      petId: '7',
      status: 'AGENDADO',
      idTipoEvento: '',
      nomeTipoEvento: 'Vacina V10',
      categoriaTipoEvento: 'VACINA',
      idVeterinario: '',
      nomeVeterinario: 'Dra. Ana',
      data: '2026-10-05T09:00:00',
      hora: '09:00',
      observacao: 'Trazer carteirinha',
      motivoCancelamento: undefined,
      custo: 150.5,
    }]);
  });

  it('usa valores padrão quando tipo, categoria, veterinário e custo vêm nulos da API', async () => {
    (api.get as jest.Mock).mockResolvedValue([{
      ...dtoBase, nmTipoEvento: null, dsCategoria: null, nmVeterinario: null, vlCusto: null, idPet: null,
    }]);

    const [evento] = await eventoService.listarEventos();

    expect(evento.petId).toBe('');
    expect(evento.nomeTipoEvento).toBe('Evento');
    expect(evento.categoriaTipoEvento).toBeNull();
    expect(evento.nomeVeterinario).toBe('—');
    expect(evento.custo).toBe(0);
  });

  it('agenda um evento convertendo os ids para número e preservando os ids de entrada na resposta', async () => {
    (api.post as jest.Mock).mockResolvedValue(dtoBase);

    const evento = await eventoService.agendarEvento({
      idPet: '7',
      idTipoEvento: '3',
      idVeterinario: '9',
      data: '2026-10-05',
      hora: '09:00',
      observacao: 'Trazer carteirinha',
    });

    expect(api.post).toHaveBeenCalledWith('/eventos', {
      idPet: 7,
      idTipoEvento: 3,
      idVeterinario: 9,
      dtEvento: '2026-10-05',
      hrEvento: '09:00',
      dsObservacao: 'Trazer carteirinha',
    });
    expect(evento.idTipoEvento).toBe('3');
    expect(evento.idVeterinario).toBe('9');
  });

  it('envia dsObservacao nulo ao agendar sem observação', async () => {
    (api.post as jest.Mock).mockResolvedValue(dtoBase);

    await eventoService.agendarEvento({
      idPet: '7', idTipoEvento: '3', idVeterinario: '9', data: '2026-10-05', hora: '09:00',
    });

    expect(api.post).toHaveBeenCalledWith('/eventos', expect.objectContaining({ dsObservacao: null }));
  });

  it('conclui um evento enviando observação e custo, usando null quando omitidos', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ ...dtoBase, status: 'CONCLUIDO' });

    const evento = await eventoService.concluirEvento('42', 'Tudo certo', 200);
    expect(api.patch).toHaveBeenCalledWith('/eventos/42/concluir', { dsObservacao: 'Tudo certo', vlCusto: 200 });
    expect(evento.status).toBe('CONCLUIDO');

    await eventoService.concluirEvento('42');
    expect(api.patch).toHaveBeenLastCalledWith('/eventos/42/concluir', { dsObservacao: null, vlCusto: null });
  });

  it('cancela um evento e mapeia tanto o evento cancelado quanto o reagendamento, quando houver', async () => {
    (api.patch as jest.Mock).mockResolvedValue({
      eventoCancelado: { ...dtoBase, status: 'CANCELADO', motivoCancelamento: 'Tutor viajou' },
      novoEvento: { ...dtoBase, idEvento: 43, dtEvento: '2026-10-12T09:00:00' },
    });

    const resultado = await eventoService.cancelarEvento('42', 'Tutor viajou', '2026-10-12T09:00:00');

    expect(api.patch).toHaveBeenCalledWith('/eventos/42/cancelar', {
      motivo: 'Tutor viajou',
      reagendarPara: '2026-10-12T09:00:00',
    });
    expect(resultado.eventoCancelado.motivoCancelamento).toBe('Tutor viajou');
    expect(resultado.novoEvento?.id).toBe('43');
  });

  it('cancela um evento sem reagendamento, devolvendo novoEvento nulo e reagendarPara nulo na requisição', async () => {
    (api.patch as jest.Mock).mockResolvedValue({
      eventoCancelado: { ...dtoBase, status: 'CANCELADO' },
      novoEvento: null,
    });

    const resultado = await eventoService.cancelarEvento('42', 'Tutor desistiu');

    expect(api.patch).toHaveBeenCalledWith('/eventos/42/cancelar', {
      motivo: 'Tutor desistiu',
      reagendarPara: null,
    });
    expect(resultado.novoEvento).toBeNull();
  });

  it('remove um evento pelo id', async () => {
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    await eventoService.removerEvento('42');

    expect(api.delete).toHaveBeenCalledWith('/eventos/42');
  });
  it('reagenda enviando data e hora e devolve o evento convertido', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ ...dtoBase, dtEvento: '2026-10-12', hrEvento: '14:30', statusConfirmacao: 'PENDENTE', idServicoClinica: 5, idVeterinario: 9 });

    const evento = await eventoService.reagendarEvento('42', '2026-10-12', '14:30');

    expect(api.patch).toHaveBeenCalledWith('/eventos/42/reagendar', { data: '2026-10-12', hora: '14:30' });
    expect(evento).toMatchObject({ data: '2026-10-12', hora: '14:30', statusConfirmacao: 'PENDENTE', idServicoClinica: 5, idVeterinario: '9' });
  });

  it('envia a hora do reagendamento no cancelamento apenas quando informada', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ eventoCancelado: dtoBase, novoEvento: dtoBase });

    await eventoService.cancelarEvento('42', 'Mudança de planos', '2026-10-12', '14:30');

    expect(api.patch).toHaveBeenCalledWith('/eventos/42/cancelar', {
      motivo: 'Mudança de planos',
      reagendarPara: '2026-10-12',
      horaReagendarPara: '14:30',
    });
  });

  it('busca o histórico da solicitação convertendo o id para texto', async () => {
    (api.get as jest.Mock).mockResolvedValue([{ id: 1, acao: 'CRIACAO', statusAnterior: null, statusNovo: 'AGENDADO', dataAnterior: null, dataNova: '2026-10-12', horaAnterior: null, horaNova: '14:30', observacaoNova: null, ator: 'Ana', ocorridoEm: '2026-10-09T10:00:00' }]);

    const historico = await eventoService.buscarHistorico('42');

    expect(api.get).toHaveBeenCalledWith('/eventos/42/historico');
    expect(historico[0]).toMatchObject({ id: '1', acao: 'CRIACAO', ator: 'Ana' });
  });

  it('confirma e recusa solicitações pelos endpoints da clínica', async () => {
    (api.patch as jest.Mock).mockResolvedValue(undefined);

    await eventoService.confirmarEvento('42');
    await eventoService.recusarEvento('42', 'Sem veterinário nesse dia');

    expect(api.patch).toHaveBeenNthCalledWith(1, '/eventos/42/confirmar', {});
    expect(api.patch).toHaveBeenNthCalledWith(2, '/eventos/42/recusar', { motivo: 'Sem veterinário nesse dia' });
  });
});