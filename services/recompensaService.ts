import { api } from './api/httpClient';
import type { Recompensa, Resgate } from '../types';

interface RecompensaResponseApi {
  idRecompensa: number;
  nome: string;
  descricao: string | null;
  custoPontos: number;
  tipo: Recompensa['tipo'];
  ativa: boolean;
}

interface ResgateResponseApi {
  idResgate: number;
  status: Resgate['status'];
  dtResgate: string;
  nmRecompensa: string;
  custoPontos: number;
  nmVeterinarioValidador: string | null;
}

function paraRecompensaApp(dto: RecompensaResponseApi): Recompensa {
  return {
    id: String(dto.idRecompensa),
    nome: dto.nome,
    descricao: dto.descricao ?? undefined,
    custoPontos: dto.custoPontos,
    tipo: dto.tipo,
    ativa: dto.ativa,
  };
}

function paraResgateApp(dto: ResgateResponseApi): Resgate {
  return {
    id: String(dto.idResgate),
    status: dto.status,
    dataResgate: dto.dtResgate,
    nomeRecompensa: dto.nmRecompensa,
    custoPontos: dto.custoPontos,
    nomeVeterinarioValidador: dto.nmVeterinarioValidador ?? undefined,
  };
}

export const recompensaService = {
  async listarCatalogo(): Promise<Recompensa[]> {
    const dtos = await api.get<RecompensaResponseApi[]>('/recompensas');
    return dtos.map(paraRecompensaApp);
  },

  async consultarSaldo(): Promise<number> {
    return api.get<number>('/recompensas/saldo');
  },

  async listarMeusResgates(): Promise<Resgate[]> {
    const dtos = await api.get<ResgateResponseApi[]>('/recompensas/resgates');
    return dtos.map(paraResgateApp);
  },

  async resgatar(idRecompensa: string): Promise<Resgate> {
    const dto = await api.patch<ResgateResponseApi>(`/recompensas/${idRecompensa}/resgatar`);
    return paraResgateApp(dto);
  },

  async validarResgate(idResgate: string, aprovado: boolean): Promise<Resgate> {
    const dto = await api.patch<ResgateResponseApi>(`/recompensas/resgates/${idResgate}/validar`, { aprovado });
    return paraResgateApp(dto);
  },
};