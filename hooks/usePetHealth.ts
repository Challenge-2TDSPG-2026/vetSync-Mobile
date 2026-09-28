import { useQuery } from '@tanstack/react-query';
import { petHealthService } from '../services/petHealthService';

export function useProximasAcoes(petId: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: ['pets', petId, 'proximas-acoes'] as const,
    queryFn: () => petHealthService.listarProximasAcoes(petId as string),
    enabled: habilitado && !!petId,
  });
}

export function useCarteiraVacinacao(petId: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: ['pets', petId, 'carteira-vacinacao'] as const,
    queryFn: () => petHealthService.buscarCarteiraVacinacao(petId as string),
    enabled: habilitado && !!petId,
  });
}
