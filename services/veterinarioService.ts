import { api } from './api/httpClient';
import type { Veterinario, FaixaDisponibilidade, BloqueioAgenda } from '../types';

interface VeterinarioResponseApi {
  idVeterinario: number;
  nmVeterinario: string;
  nrCrmv: string;
  idClinica: number | null;
  nmClinica: string | null;
  dsEspecialidade: string | null;
}

interface DisponibilidadeResponseApi {
  idDisponibilidade: number;
  nrDiaSemana: number;
  hrInicio: string;
  hrFim: string;
}

interface BloqueioResponseApi {
  idBloqueio: number;
  dtInicio: string;
  dtFim: string;
  motivo: string | null;
}

function paraVeterinarioApp(dto: VeterinarioResponseApi): Veterinario {
  return {
    id: String(dto.idVeterinario),
    nome: dto.nmVeterinario,
    crmv: dto.nrCrmv,
    idClinica: dto.idClinica != null ? String(dto.idClinica) : null,
    nomeClinica: dto.nmClinica,
    especialidade: dto.dsEspecialidade ?? null,
  };
}

function paraFaixaApp(dto: DisponibilidadeResponseApi): FaixaDisponibilidade {
  return {
    id: String(dto.idDisponibilidade),
    diaSemana: dto.nrDiaSemana,
    horaInicio: dto.hrInicio,
    horaFim: dto.hrFim,
  };
}

function paraBloqueioApp(dto: BloqueioResponseApi): BloqueioAgenda {
  return {
    id: String(dto.idBloqueio),
    dataInicio: dto.dtInicio,
    dataFim: dto.dtFim,
    motivo: dto.motivo ?? undefined,
  };
}

export const veterinarioService = {
  async listarVeterinarios(especialidade?: string | null): Promise<Veterinario[]> {
    const params = new URLSearchParams();
    if (especialidade) params.set('especialidade', especialidade);
    const query = params.toString();
    const dtos = await api.get<VeterinarioResponseApi[]>(`/veterinarios${query ? `?${query}` : ''}`);
    return dtos.map(paraVeterinarioApp);
  },

  async buscarPorId(id: string): Promise<Veterinario> {
    const dto = await api.get<VeterinarioResponseApi>(`/veterinarios/${id}`);
    return paraVeterinarioApp(dto);
  },

  async listarDisponibilidade(idVeterinario: string): Promise<FaixaDisponibilidade[]> {
    const dtos = await api.get<DisponibilidadeResponseApi[]>(`/veterinarios/${idVeterinario}/disponibilidade`);
    return dtos.map(paraFaixaApp);
  },

  async adicionarFaixaDisponibilidade(
    idVeterinario: string,
    faixa: { diaSemana: number; horaInicio: string; horaFim: string }
  ): Promise<FaixaDisponibilidade> {
    const dto = await api.post<DisponibilidadeResponseApi>(`/veterinarios/${idVeterinario}/disponibilidade`, {
      nrDiaSemana: faixa.diaSemana,
      hrInicio: faixa.horaInicio,
      hrFim: faixa.horaFim,
    });
    return paraFaixaApp(dto);
  },

  async removerFaixaDisponibilidade(idVeterinario: string, idFaixa: string): Promise<void> {
    await api.delete(`/veterinarios/${idVeterinario}/disponibilidade/${idFaixa}`);
  },

  async listarBloqueios(idVeterinario: string): Promise<BloqueioAgenda[]> {
    const dtos = await api.get<BloqueioResponseApi[]>(`/veterinarios/${idVeterinario}/bloqueios`);
    return dtos.map(paraBloqueioApp);
  },

  async adicionarBloqueio(
    idVeterinario: string,
    bloqueio: { dataInicio: string; dataFim: string; motivo?: string }
  ): Promise<BloqueioAgenda> {
    const dto = await api.post<BloqueioResponseApi>(`/veterinarios/${idVeterinario}/bloqueios`, {
      dtInicio: bloqueio.dataInicio,
      dtFim: bloqueio.dataFim,
      motivo: bloqueio.motivo ?? null,
    });
    return paraBloqueioApp(dto);
  },

  async removerBloqueio(idVeterinario: string, idBloqueio: string): Promise<void> {
    await api.delete(`/veterinarios/${idVeterinario}/bloqueios/${idBloqueio}`);
  },
};