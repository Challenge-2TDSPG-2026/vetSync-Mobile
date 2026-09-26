import { api } from './api/httpClient';
import type { TipoEvento, Veterinario, Pet } from '../types';
import { ESPECIE_APP_PARA_API } from './petService';

interface TipoEventoResponseApi {
  idTipoEvento: number;
  nmTipoEvento: string;
  dsCategoria: TipoEvento['categoria'];
  nrPontos: number;
}

interface VeterinarioResponseApi {
  idVeterinario: number;
  nmVeterinario: string;
  nrCrmv: string;
  idClinica: number | null;
  nmClinica: string | null;
  dsEspecialidade: string | null;
}

export const catalogoService = {

  async listarTiposEvento(): Promise<TipoEvento[]> {
    const dtos = await api.get<TipoEventoResponseApi[]>('/tipos-evento');
    return dtos.map(dto => ({
      id: String(dto.idTipoEvento),
      nome: dto.nmTipoEvento,
      categoria: dto.dsCategoria,
      pontos: dto.nrPontos,
    }));
  },

  async listarVeterinarios(especialidade?: string | null): Promise<Veterinario[]> {
    const params = new URLSearchParams();
    if (especialidade) params.set('especialidade', especialidade);
    const query = params.toString();
    const dtos = await api.get<VeterinarioResponseApi[]>(`/veterinarios${query ? `?${query}` : ''}`);
    return dtos.map(dto => ({
      id: String(dto.idVeterinario),
      nome: dto.nmVeterinario,
      crmv: dto.nrCrmv,
      idClinica: dto.idClinica != null ? String(dto.idClinica) : null,
      nomeClinica: dto.nmClinica,
      especialidade: dto.dsEspecialidade ?? null,
    }));
  },

  async sugerirRacas(especie: Pet['especie'], texto?: string): Promise<string[]> {
    const especieApi = ESPECIE_APP_PARA_API[especie];
    const params = new URLSearchParams({ especie: especieApi });
    if (texto && texto.trim()) params.set('q', texto.trim());
    return api.get<string[]>(`/pets/racas?${params.toString()}`);
  },
};