import type { PendenciaSocial } from './authService';

/**
 * Guarda, só em memória, o id_token do Google enquanto o tutor conclui o cadastro (confirmar a clínica
 * e preencher os dados). Nunca vai para o AsyncStorage nem para a URL/parâmetros de rota.
 * O Google emite tokens com validade de ~1 hora; por segurança descartamos antes disso.
 */
export const VALIDADE_GOOGLE_PENDENTE_MS = 50 * 60 * 1000;

export type GooglePendente = { idToken: string; pendencia: PendenciaSocial };

let atual: (GooglePendente & { criadoEm: number }) | null = null;

export const googlePendente = {
  definir(idToken: string, pendencia: PendenciaSocial, agora: number = Date.now()): void {
    atual = { idToken, pendencia, criadoEm: agora };
  },

  obter(agora: number = Date.now()): GooglePendente | null {
    if (!atual) return null;
    if (agora - atual.criadoEm > VALIDADE_GOOGLE_PENDENTE_MS) {
      atual = null;
      return null;
    }
    return { idToken: atual.idToken, pendencia: atual.pendencia };
  },

  limpar(): void {
    atual = null;
  },
};
