import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { petAcessoService, type PermissaoPet, type RelacaoPet } from '../services/petAcessoService';

export const petAcessoKeys = {
  acessos: (idPet: string) => ['pets', idPet, 'acessos'] as const,
};

export function useAcessosPet(idPet: string | null) {
  return useQuery({
    queryKey: petAcessoKeys.acessos(idPet ?? ''),
    queryFn: () => petAcessoService.listarAcessos(idPet as string),
    enabled: Boolean(idPet),
  });
}

export function useCriarConvitePet(idPet: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { email: string; relacao: RelacaoPet; permissao: PermissaoPet }) =>
      petAcessoService.criarConvite(idPet as string, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: petAcessoKeys.acessos(idPet ?? '') }),
  });
}

export function useRevogarAcessoPet(idPet: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idAcesso: string) => petAcessoService.revogarAcesso(idPet as string, idAcesso),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: petAcessoKeys.acessos(idPet ?? '') }),
  });
}
