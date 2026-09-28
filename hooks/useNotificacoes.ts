import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacaoService, type PreferenciasNotificacao } from '../services/notificacaoService';

const notificacaoKeys = { all: ['notificacoes'] as const, preferencias: ['preferencias-notificacoes'] as const };

export function useNotificacoes(habilitado: boolean) {
  return useQuery({ queryKey: notificacaoKeys.all, queryFn: () => notificacaoService.listar(), enabled: habilitado });
}

export function usePreferenciasNotificacao(habilitado: boolean) {
  return useQuery({
    queryKey: notificacaoKeys.preferencias,
    queryFn: notificacaoService.obterPreferencias,
    enabled: habilitado,
  });
}

export function useMarcarNotificacaoLida() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificacaoService.marcarComoLida(id),
    onSuccess: () => client.invalidateQueries({ queryKey: notificacaoKeys.all }),
  });
}

export function useMarcarTodasNotificacoesLidas() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: notificacaoService.marcarTodasComoLidas,
    onSuccess: () => client.invalidateQueries({ queryKey: notificacaoKeys.all }),
  });
}

export function useAtualizarPreferenciasNotificacao() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (preferencias: PreferenciasNotificacao) => notificacaoService.atualizarPreferencias(preferencias),
    onSuccess: preferencias => client.setQueryData(notificacaoKeys.preferencias, preferencias),
  });
}
