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

  async listarVeterinarios(): Promise<Veterinario[]> {
    const dtos = await api.get<VeterinarioResponseApi[]>('/veterinarios');
    return dtos.map(dto => ({
      id: String(dto.idVeterinario),
      nome: dto.nmVeterinario,
      crmv: dto.nrCrmv,
      idClinica: dto.idClinica != null ? String(dto.idClinica) : null,
      nomeClinica: dto.nmClinica,
    }));
  },

  async sugerirRacas(especie: Pet['especie'], texto?: string): Promise<string[]> {
    const especieApi = ESPECIE_APP_PARA_API[especie];
    const params = new URLSearchParams({ especie: especieApi });
    if (texto && texto.trim()) params.set('q', texto.trim());
    return api.get<string[]>(`/pets/racas?${params.toString()}`);
  },
};
