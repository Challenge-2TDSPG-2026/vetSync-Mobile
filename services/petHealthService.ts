import { api } from './api/httpClient';

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
};
