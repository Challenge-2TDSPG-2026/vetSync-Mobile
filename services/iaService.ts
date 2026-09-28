import { IA_API_BASE_URL } from '../constants/api';
import type { Pet } from '../types';
import { api, apiRequest } from './api/httpClient';

export interface SiaHistoryMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface SiaResponse {
  mensagem?: string;
  acao?: { id: string; resumo: string; requerConfirmacao: boolean };
}

export interface SiaReply {
  texto: string;
  acao?: { id: string; resumo: string; requerConfirmacao: boolean };
}

function montarContexto(pet: Pet | null, history: SiaHistoryMessage[]) {
  const contexto: Record<string, unknown> = { history };
  if (pet) {
    contexto.pet_ativo = {
      id: pet.id,
      nome: pet.nome,
      especie: pet.especie,
      raca: pet.raca,
    };
  }
  return contexto;
}

export const iaService = {
  async perguntar(message: string, pet: Pet | null, history: SiaHistoryMessage[]): Promise<SiaReply> {
    const resposta = await apiRequest<SiaResponse>({
      method: 'POST',
      path: '/api/v1/ia/orquestrador/processar',
      body: { message, contexto: montarContexto(pet, history) },
      baseUrl: IA_API_BASE_URL,
      timeoutMs: 60_000,
    });

    const texto = resposta.mensagem;
    if (!texto) throw new Error('A SIA respondeu sem uma mensagem para exibição.');

    return { texto, acao: resposta.acao };
  },

  async confirmarAcao(id: string): Promise<SiaReply> {
    const resposta = await api.post<{ resumo: string }>(`/ia/acoes/${encodeURIComponent(id)}/confirmar`);
    return { texto: resposta.resumo };
  },
};
