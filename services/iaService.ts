import { IA_API_BASE_URL } from '../constants/api';
import type { Pet } from '../types';
import { api, apiRequest } from './api/httpClient';

export interface SiaHistoryMessage {
  role: 'user' | 'assistant';
  text: string;
}

export type SiaBlockType = 'SELECIONAR_DATA' | 'SELECIONAR_TIPO_ATENDIMENTO' | 'SELECIONAR_HORARIO' | 'SELECIONAR_PET' | 'SELECIONAR_PET_ACOMPANHAMENTO' | 'CONFIRMAR_RESERVA';

export interface SiaBlockOption {
  id: string;
  rotulo: string;
  descricao?: string;
  habilitado: boolean;
}

export interface SiaBlock {
  tipo: SiaBlockType;
  sessaoId: string;
  titulo: string;
  opcoes: SiaBlockOption[];
}

interface SiaResponse {
  mensagem?: string;
  bloco?: SiaBlock;
  acao?: { id: string; resumo: string; requerConfirmacao: boolean };
}

export interface SiaReply {
  texto: string;
  bloco?: SiaBlock;
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

    return { texto, bloco: resposta.bloco, acao: resposta.acao };
  },

  async selecionarBloco(sessaoId: string, opcaoId: string, tipo?: SiaBlockType): Promise<SiaReply> {
    const resposta = await apiRequest<SiaResponse>({
      method: 'POST',
      path: tipo === 'SELECIONAR_PET_ACOMPANHAMENTO' ? `/api/v1/ia/orquestrador/acompanhamentos/sessoes/${encodeURIComponent(sessaoId)}/selecoes` : `/api/v1/ia/orquestrador/agendamentos/sessoes/${encodeURIComponent(sessaoId)}/selecoes`,
      body: { opcaoId },
      baseUrl: IA_API_BASE_URL,
      timeoutMs: 60_000,
    });

    const texto = resposta.mensagem;
    if (!texto) throw new Error('A SIA respondeu sem uma mensagem para exibição.');

    return { texto, bloco: resposta.bloco, acao: resposta.acao };
  },

  async confirmarAcao(id: string): Promise<SiaReply> {
    const resposta = await api.post<{ resumo: string }>(`/ia/acoes/${encodeURIComponent(id)}/confirmar`);
    return { texto: resposta.resumo };
  },
};
