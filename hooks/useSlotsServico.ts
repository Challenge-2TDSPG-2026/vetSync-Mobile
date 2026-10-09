import { useQuery } from '@tanstack/react-query';
import { clinicaService } from '../services/clinicaService';

export function useServicosClinica(habilitado: boolean) {
  return useQuery({
    queryKey: ['clinica', 'servicos'] as const,
    queryFn: clinicaService.listarServicos,
    enabled: habilitado,
    staleTime: 5 * 60_000,
  });
}

export function useSlotsServico(idServico: number | null, data: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['clinica', 'slots', idServico, data] as const,
    queryFn: () => clinicaService.listarSlots(idServico as number, data),
    enabled: habilitado && idServico != null && /^\d{4}-\d{2}-\d{2}$/.test(data),
    staleTime: 0,
  });
}