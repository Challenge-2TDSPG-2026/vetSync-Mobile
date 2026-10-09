import { api } from './api/httpClient';

export type StatusListaEspera = 'AGUARDANDO' | 'NOTIFICADO' | 'ATENDIDO' | 'CANCELADO' | 'EXPIRADO';

export interface EntradaListaEspera {
  id: string;
  status: StatusListaEspera;
  idPet: string;
  nomePet: string;
  idServico: number;
  nomeServico: string;
  dataInicio: string;
  dataFim: string;
  horaMin: string | null;
  horaMax: string | null;
  dataVaga: string | null;
  horaVaga: string | null;
  notificadaEm: string | null;
  criadaEm: string;
}

export interface EntrarListaEsperaInput {
  idPet: string;
  idServico: number;
  dataInicio: string;
  dataFim: string;
  horaMin?: string;
  horaMax?: string;
  idVeterinario?: number | null;
  idProfissionalEstetica?: number | null;
}

interface EsperaApi {
  id: number;
  status: StatusListaEspera;
  idPet: number;
  nmPet: string;
  idServico: number;
  nmServico: string;
  dataInicio: string;
  dataFim: string;
  horaMin: string | null;
  horaMax: string | null;
  dataVaga: string | null;
  horaVaga: string | null;
  notificadaEm: string | null;
  criadaEm: string;
}

function paraApp(dto: EsperaApi): EntradaListaEspera {
  return {
    id: String(dto.id),
    status: dto.status,
    idPet: String(dto.idPet),
    nomePet: dto.nmPet,
    idServico: dto.idServico,
    nomeServico: dto.nmServico,
    dataInicio: dto.dataInicio,
    dataFim: dto.dataFim,
    horaMin: dto.horaMin ?? null,
    horaMax: dto.horaMax ?? null,
    dataVaga: dto.dataVaga ?? null,
    horaVaga: dto.horaVaga ?? null,
    notificadaEm: dto.notificadaEm ?? null,
    criadaEm: dto.criadaEm,
  };
}

export const listaEsperaService = {
  async listar(): Promise<EntradaListaEspera[]> {
    const dtos = await api.get<EsperaApi[]>('/agenda/espera');
    return dtos.map(paraApp);
  },

  async entrar(input: EntrarListaEsperaInput): Promise<EntradaListaEspera> {
    const dto = await api.post<EsperaApi>('/agenda/espera', {
      idPet: Number(input.idPet),
      idServico: input.idServico,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      horaMin: input.horaMin || null,
      horaMax: input.horaMax || null,
      idVeterinario: input.idVeterinario ?? null,
      idProfissionalEstetica: input.idProfissionalEstetica ?? null,
    });
    return paraApp(dto);
  },

  async sair(id: string): Promise<void> {
    await api.delete(`/agenda/espera/${id}`);
  },
};