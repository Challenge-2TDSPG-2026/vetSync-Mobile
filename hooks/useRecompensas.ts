import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recompensaService } from '../services/recompensaService';

const CHAVE_CATALOGO = ['recompensas', 'catalogo'] as const;
const CHAVE_SALDO = ['recompensas', 'saldo'] as const;
const CHAVE_RESGATES = ['recompensas', 'resgates'] as const;

export function useCatalogoRecompensas(habilitado: boolean) {
  return useQuery({
    queryKey: CHAVE_CATALOGO,
    queryFn: recompensaService.listarCatalogo,
    enabled: habilitado,
    staleTime: 5 * 60_000,
  });
}

export function useSaldoRecompensas(habilitado: boolean) {
  return useQuery({
    queryKey: CHAVE_SALDO,
    queryFn: recompensaService.consultarSaldo,
    enabled: habilitado,
  });
}

export function useMeusResgates(habilitado: boolean) {
  return useQuery({
    queryKey: CHAVE_RESGATES,
    queryFn: recompensaService.listarMeusResgates,
    enabled: habilitado,
  });
}

export function useResgatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idRecompensa: string) => recompensaService.resgatar(idRecompensa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_SALDO });
      queryClient.invalidateQueries({ queryKey: CHAVE_RESGATES });
    },
  });
}

export function useValidarResgate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idResgate, aprovado }: { idResgate: string; aprovado: boolean }) =>
      recompensaService.validarResgate(idResgate, aprovado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_RESGATES });
    },
  });
}