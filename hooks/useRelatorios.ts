import { useQuery } from '@tanstack/react-query';
import { veterinarioService } from '../services/veterinarioService';

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
    queryKey: ['pet', idPet, 'perfil-saude'],
    queryFn: () => veterinarioService.buscarPerfilSaude(idPet as string),
    enabled: habilitado && idPet !== null,
  });
}

export function useAuditoria(entidade: string, entidadeId: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: ['auditoria', entidade, entidadeId],
    queryFn: () => veterinarioService.listarAuditoria(entidade, entidadeId as string),
    enabled: habilitado && entidadeId !== null,
  });
}
