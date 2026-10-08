import { api } from './api/httpClient';
import type { PerfilSaudePet, PerfilSaudePetAtualizacao } from '../types';

export interface ProximaAcao {
  id: string;
  tipo: string;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA' | string;
  titulo: string;
  descricao: string;
  eventoReferenciaId?: string | null;
  dataLimite?: string | null;
  podeAgendar: boolean;
}

export interface Vacina {
  id: string;
  nome: string;
  aplicadaEm?: string | null;
  proximaDoseEm?: string | null;
  status: 'EM_DIA' | 'VENCENDO' | 'ATRASADA' | 'FUTURA' | string;
  eventoId?: string | null;
  veterinario?: string | null;
  comprovanteUrl?: string | null;
  /** Identifica o tipo de vacina (backend atualizado). Ausente em versões antigas da API. */
  tipoVacinaId?: number | null;
  /** Dose já reaplicada por outra mais recente: é só histórico (backend atualizado). */
  substituida?: boolean;
}

export interface CarteiraVacinacao {
  petId: string;
  vacinas: Vacina[];
  resumo: { emDia: number; vencendo: number; atrasadas: number; futuras: number };
}

export const petHealthService = {
  listarProximasAcoes: (petId: string) => api.get<ProximaAcao[]>(`/pets/${petId}/proximas-acoes`),
  buscarCarteiraVacinacao: (petId: string) =>
    api.get<CarteiraVacinacao>(`/pets/${petId}/carteira-vacinacao`),
  buscarPerfilSaude: (petId: string) =>
    api.get<PerfilSaudePet>(`/pets/${petId}/perfil-saude`),
  atualizarPerfilSaude: (petId: string, perfil: PerfilSaudePetAtualizacao) =>
    api.put<PerfilSaudePet>(`/pets/${petId}/perfil-saude`, perfil),
};