import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { veterinarioService } from '../services/veterinarioService';
import { petHealthService } from '../services/petHealthService';
import { petKeys } from './queryKeys';
import type { PerfilSaudePetAtualizacao } from '../types';

export function useRelatorioClinica(inicio: string, fim: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['veterinario', 'relatorio', inicio, fim],
    queryFn: () => veterinarioService.buscarRelatorio(inicio, fim),
    enabled: habilitado,
    staleTime: 60_000,
  });
}

export function usePerfilSaudePet(idPet: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: petKeys.perfilSaude(idPet ?? ''),
    queryFn: () => petHealthService.buscarPerfilSaude(idPet as string),
    enabled: habilitado && idPet !== null,
  });
}

export function useAtualizarPerfilSaudePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idPet, perfil }: { idPet: string; perfil: PerfilSaudePetAtualizacao }) =>
      petHealthService.atualizarPerfilSaude(idPet, perfil),
    onSuccess: (perfil, variaveis) => {
      queryClient.setQueryData(petKeys.perfilSaude(variaveis.idPet), perfil);
      queryClient.invalidateQueries({ queryKey: petKeys.detalhe(variaveis.idPet) });
      queryClient.invalidateQueries({ queryKey: petKeys.all });
    },
  });
}

export function useAuditoria(entidade: string, entidadeId: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: ['auditoria', entidade, entidadeId],
    queryFn: () => veterinarioService.listarAuditoria(entidade, entidadeId as string),
    enabled: habilitado && entidadeId !== null,
  });
}
