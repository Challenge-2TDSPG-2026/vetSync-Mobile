import { api } from './api/httpClient';

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  referenciaTipo?: string | null;
  referenciaId?: string | null;
  lida: boolean;
  criadaEm: string;
}

export interface PreferenciasNotificacao {
  pushAtivo: boolean;
  lembreteSeteDias: boolean;
  lembreteUmDia: boolean;
  lembreteDuasHoras: boolean;
  vacinasVencendo: boolean;
  retornosPendentes: boolean;
  convitesDeAcesso: boolean;
  resgates: boolean;
}

interface PaginaNotificacoes {
  content: Notificacao[];
}

export const notificacaoService = {
  async listar(lida?: boolean): Promise<Notificacao[]> {
    const query =
      lida === undefined
        ? ''
        : `?lida=${lida}&page=0&size=50`;

    const resposta = await api.get<
      Notificacao[] | PaginaNotificacoes
    >(`/notificacoes${query}`);

    return Array.isArray(resposta)
      ? resposta
      : resposta.content;
  },

  async marcarComoLida(id: string): Promise<void> {
    await api.patch(`/notificacoes/${id}/lida`, {});
  },

  async marcarTodasComoLidas(): Promise<void> {
    await api.patch('/notificacoes/lidas', {});
  },

  async obterPreferencias(): Promise<PreferenciasNotificacao> {
    return api.get<PreferenciasNotificacao>(
      '/usuarios/preferencias/notificacoes'
    );
  },

  async atualizarPreferencias(
    preferencias: PreferenciasNotificacao
  ): Promise<PreferenciasNotificacao> {
    return api.put<PreferenciasNotificacao>(
      '/usuarios/preferencias/notificacoes',
      preferencias
    );
  },

  async removerDispositivo(token: string): Promise<void> {
    await api.delete(
      `/notificacoes/dispositivos/${encodeURIComponent(token)}`
    );
  },
};

export async function listarNotificacoes(): Promise<Notificacao[]> {
  return notificacaoService.listar(false);
}

export function marcarNotificacaoComoLida(
  id: string
): Promise<void> {
  return notificacaoService.marcarComoLida(id);
}

export function marcarTodasNotificacoesComoLidas(): Promise<void> {
  return notificacaoService.marcarTodasComoLidas();
}