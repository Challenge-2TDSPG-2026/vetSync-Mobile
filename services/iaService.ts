import { IA_API_BASE_URL } from '../constants/api';
import type { Pet } from '../types';
import { apiRequest } from './api/httpClient';

export interface SiaHistoryMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface SiaResponse {
  mensagem?: string;
}

export interface SiaReply {
  texto: string;
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

    return { texto };
  },
};
