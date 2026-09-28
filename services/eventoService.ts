import { api } from './api/httpClient';
import type { Evento, StatusEvento } from '../types';

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
    idVeterinario,
    nomeVeterinario: dto.nmVeterinario ?? '—',
    data: dto.dtEvento,
    observacao: dto.dsObservacao ?? undefined,
    motivoCancelamento: dto.motivoCancelamento ?? undefined,
    custo: dto.vlCusto ?? 0,
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

  async cancelarEvento(id: string, motivo: string, reagendarPara?: string): Promise<{ eventoCancelado: Evento; novoEvento: Evento | null }> {
    const dto = await api.patch<EventoCancelarResponseApi>(`/eventos/${id}/cancelar`, {
      motivo,
      reagendarPara: reagendarPara ?? null,
    });
    return {
      eventoCancelado: paraEventoApp(dto.eventoCancelado, '', ''),
      novoEvento: dto.novoEvento ? paraEventoApp(dto.novoEvento, '', '') : null,
    };
  },

  async removerEvento(id: string): Promise<void> {
    await api.delete(`/eventos/${id}`);
  },
};