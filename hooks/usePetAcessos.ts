import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { petAcessoService, type PermissaoPet, type RelacaoPet } from '../services/petAcessoService';
import { petAtividadeService } from '../services/petAtividadeService';
import { ApiError } from '../services/api/httpClient';

export const petAcessoKeys = {
  acessos: (idPet: string) => ['pets', idPet, 'acessos'] as const,
  atividades: (idPet: string) => ['pets', idPet, 'atividades'] as const,
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: petAcessoKeys.acessos(idPet ?? '') });
      void queryClient.invalidateQueries({ queryKey: petAcessoKeys.atividades(idPet ?? '') });
    },
  });
}

export function useRevogarAcessoPet(idPet: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idAcesso: string) => petAcessoService.revogarAcesso(idPet as string, idAcesso),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: petAcessoKeys.acessos(idPet ?? '') });
      void queryClient.invalidateQueries({ queryKey: petAcessoKeys.atividades(idPet ?? '') });
    },
  });
}

/** Endpoints ausentes no backend (404/501) não devem ficar tentando de novo. */
export function useAtividadesPet(idPet: string | null) {
  return useQuery({
    queryKey: petAcessoKeys.atividades(idPet ?? ''),
    queryFn: () => petAtividadeService.listar(idPet as string),
    enabled: Boolean(idPet),
    retry: (tentativas, erro) =>
      !(erro instanceof ApiError && (erro.status === 404 || erro.status === 501)) && tentativas < 1,
  });
}
