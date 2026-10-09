import { api } from './api/httpClient';
import type { Evento, StatusConfirmacao, StatusEvento } from '../types';

interface EventoResponseApi {
  idEvento: number;
  status: StatusEvento;
  nmTipoEvento: string | null;
  dsCategoria: Evento['categoriaTipoEvento'];
  nmVeterinario: string | null;
  dtEvento: string;
  hrEvento: string | null;
  dsObservacao: string | null;
  motivoCancelamento: string | null;
  vlCusto: number | null;
  idPet: number | null;
  idVeterinario?: number | null;
  criadoEm?: string | null;
  statusConfirmacao?: StatusConfirmacao | null;
  idServicoClinica?: number | null;
  idProfissionalEstetica?: number | null;
}

export interface EventoHistoricoItem {
  id: string;
  acao: string;
  statusAnterior: string | null;
  statusNovo: string | null;
  dataAnterior: string | null;
  dataNova: string | null;
  horaAnterior: string | null;
  horaNova: string | null;
  observacaoNova: string | null;
  ator: string | null;
  ocorridoEm: string;
}

interface EventoHistoricoApi {
  id: number;
  acao: string;
  statusAnterior: string | null;
  statusNovo: string | null;
  dataAnterior: string | null;
  dataNova: string | null;
  horaAnterior: string | null;
  horaNova: string | null;
  observacaoNova: string | null;
  ator: string | null;
  ocorridoEm: string;
}

interface EventoCancelarResponseApi {
  eventoCancelado: EventoResponseApi;
  novoEvento: EventoResponseApi | null;
}

export interface EventoDetalhes {
  id: string;
  pet: { id: string; nome: string };
  tipo: { id: string; nome: string; categoria: Evento['categoriaTipoEvento'] };
  status: StatusEvento;
  dataAgendada: string;
  criadoEm?: string;
  tutorObservacao?: string | null;
  observacaoClinica?: string | null;
  diagnostico?: string | null;
  conduta?: string | null;
  custo?: number | null;
  veterinario?: { id: string; nome: string; crmv?: string | null } | null;
  cancelamento?: { motivo?: string | null; criadoEm?: string | null } | null;
  statusConfirmacao?: StatusConfirmacao;
}

interface EventoDetalhesApi extends EventoResponseApi {
  observacaoTutor?: string | null;
  observacaoClinica?: string | null;
  diagnostico?: string | null;
  conduta?: string | null;
  criadoEm?: string | null;
}

function paraDetalhesApp(dto: EventoDetalhesApi): EventoDetalhes {
  return {
    id: String(dto.idEvento),
    pet: { id: String(dto.idPet ?? ''), nome: 'Pet' },
    tipo: { id: '', nome: dto.nmTipoEvento ?? 'Evento', categoria: dto.dsCategoria ?? null },
    status: dto.status,
    dataAgendada: `${dto.dtEvento}${dto.hrEvento ? `T${dto.hrEvento}` : ''}`,
    criadoEm: dto.criadoEm ?? undefined,
    tutorObservacao: dto.observacaoTutor ?? dto.dsObservacao ?? null,
    observacaoClinica: dto.observacaoClinica ?? null,
    diagnostico: dto.diagnostico ?? null,
    conduta: dto.conduta ?? null,
    custo: dto.vlCusto ?? null,
    veterinario: dto.nmVeterinario ? { id: '', nome: dto.nmVeterinario } : null,
    cancelamento: dto.motivoCancelamento ? { motivo: dto.motivoCancelamento } : null,
    statusConfirmacao: dto.statusConfirmacao ?? undefined,
  };
}

function paraEventoApp(dto: EventoResponseApi, idTipoEvento: string, idVeterinario: string): Evento {
  return {
    id: String(dto.idEvento),
    petId: dto.idPet != null ? String(dto.idPet) : '',
    status: dto.status,
    idTipoEvento,
    nomeTipoEvento: dto.nmTipoEvento ?? 'Evento',
    categoriaTipoEvento: dto.dsCategoria ?? null,
    idVeterinario: dto.idVeterinario != null ? String(dto.idVeterinario) : idVeterinario,
    nomeVeterinario: dto.nmVeterinario ?? '—',
    data: dto.dtEvento,
    hora: dto.hrEvento ?? undefined,
    observacao: dto.dsObservacao ?? undefined,
    motivoCancelamento: dto.motivoCancelamento ?? undefined,
    custo: dto.vlCusto ?? 0,
    statusConfirmacao: dto.statusConfirmacao ?? undefined,
    idServicoClinica: dto.idServicoClinica ?? undefined,
    idProfissionalEstetica: dto.idProfissionalEstetica ?? undefined,
    criadoEm: dto.criadoEm ?? undefined,
  };
}

interface SolicitarEventoInput {
  idPet: string;
  idTipoEvento: string;
  idVeterinario: string;
  data: string;
  hora: string;
  observacao?: string;
}

export const eventoService = {

  async listarEventos(): Promise<Evento[]> {
    const dtos = await api.get<EventoResponseApi[]>('/eventos');
    return dtos.map(dto => paraEventoApp(dto, '', ''));
  },

  async buscarDetalhes(id: string): Promise<EventoDetalhes> {
    const dto = await api.get<EventoDetalhesApi>(`/eventos/${id}/detalhes`);
    return paraDetalhesApp(dto);
  },

  async agendarEvento(input: SolicitarEventoInput): Promise<Evento> {
    const dto = await api.post<EventoResponseApi>('/eventos', {
      idPet: Number(input.idPet),
      idTipoEvento: Number(input.idTipoEvento),
      idVeterinario: Number(input.idVeterinario),
      dtEvento: input.data,
      hrEvento: input.hora,
      dsObservacao: input.observacao ?? null,
    });
    return paraEventoApp(dto, input.idTipoEvento, input.idVeterinario);
  },

  async concluirEvento(id: string, observacao?: string, custo?: number): Promise<Evento> {
    const dto = await api.patch<EventoResponseApi>(`/eventos/${id}/concluir`, {
      dsObservacao: observacao ?? null,
      vlCusto: custo ?? null,
    });
    return paraEventoApp(dto, '', '');
  },

  async cancelarEvento(
    id: string,
    motivo: string,
    reagendarPara?: string,
    horaReagendarPara?: string,
  ): Promise<{ eventoCancelado: Evento; novoEvento: Evento | null }> {
    const dto = await api.patch<EventoCancelarResponseApi>(`/eventos/${id}/cancelar`, {
      motivo,
      reagendarPara: reagendarPara ?? null,
      ...(horaReagendarPara ? { horaReagendarPara } : {}),
    });
    return {
      eventoCancelado: paraEventoApp(dto.eventoCancelado, '', ''),
      novoEvento: dto.novoEvento ? paraEventoApp(dto.novoEvento, '', '') : null,
    };
  },

  /** Troca data/hora mantendo o mesmo profissional e serviço. */
  async reagendarEvento(id: string, data: string, hora: string): Promise<Evento> {
    const dto = await api.patch<EventoResponseApi>(`/eventos/${id}/reagendar`, { data, hora });
    return paraEventoApp(dto, '', '');
  },

  async buscarHistorico(id: string): Promise<EventoHistoricoItem[]> {
    const dtos = await api.get<EventoHistoricoApi[]>(`/eventos/${id}/historico`);
    return dtos.map(dto => ({ ...dto, id: String(dto.id) }));
  },

  /** Ação da clínica (veterinário/estética): confirma uma solicitação pendente. */
  async confirmarEvento(id: string): Promise<void> {
    await api.patch(`/eventos/${id}/confirmar`, {});
  },

  /** Ação da clínica: recusa a solicitação com motivo (o horário volta para a agenda). */
  async recusarEvento(id: string, motivo: string): Promise<void> {
    await api.patch(`/eventos/${id}/recusar`, { motivo });
  },

  async removerEvento(id: string): Promise<void> {
    await api.delete(`/eventos/${id}`);
  },
};