import { IA_API_BASE_URL } from '../constants/api';
import type { Pet } from '../types';
import { apiRequest } from './api/httpClient';

export type CategoriaSia = 'AGENDAMENTO' | 'TRIAGEM' | 'POS_ATENDIMENTO' | 'CHECKIN' | 'OUTRO';

interface SiaResponse {
  categoria_identificada?: CategoriaSia;
  categoria?: CategoriaSia;
  mensagem?: string;
  motivo?: string;
  dados_ia?: {
    message_draft?: string;
    auto_reply_draft?: string;
    suggested_action?: string;
    urgency_level?: string;
    recovery_status?: string;
    [key: string]: unknown;
  };
}

export interface SiaReply {
  texto: string;
  categoria: CategoriaSia;
  destaque?: string;
}

function montarContexto(pet: Pet | null) {
  if (!pet) return undefined;
  return {
    pet_ativo: {
      id: pet.id,
      nome: pet.nome,
      especie: pet.especie,
      raca: pet.raca,
    },
  };
}

export const iaService = {
  async perguntar(message: string, pet: Pet | null): Promise<SiaReply> {
    const resposta = await apiRequest<SiaResponse>({
      method: 'POST',
      path: '/api/v1/ia/orquestrador/processar',
      body: { message, contexto: montarContexto(pet) },
      baseUrl: IA_API_BASE_URL,
      timeoutMs: 60_000,
    });

    const categoria = resposta.categoria_identificada ?? resposta.categoria ?? 'OUTRO';
    const dados = resposta.dados_ia;
    const texto = dados?.message_draft ?? dados?.auto_reply_draft ?? resposta.mensagem ?? dados?.suggested_action;
    if (!texto) throw new Error('A SIA respondeu sem uma mensagem para exibição.');

    const destaque = categoria === 'TRIAGEM'
      ? dados?.urgency_level
      : categoria === 'CHECKIN'
        ? dados?.recovery_status
        : undefined;
    return { texto, categoria, destaque };
  },
};
