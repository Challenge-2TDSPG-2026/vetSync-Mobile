import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { responsavelService, type PermissaoResponsavel } from '../services/responsavelService';

const responsavelKeys = {
  todos: ['responsaveis'] as const,
};

export function useResponsaveis() {
  return useQuery({
    queryKey: responsavelKeys.todos,
    queryFn: responsavelService.listar,
  });
}

export function useCriarConviteResponsavel() {
  return useMutation({
    mutationFn: (dados: { email: string; permissao: PermissaoResponsavel }) =>
      responsavelService.criarConvite(dados),
  });
}

export function useRevogarResponsavel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: responsavelService.revogar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: responsavelKeys.todos }),
  });
}
