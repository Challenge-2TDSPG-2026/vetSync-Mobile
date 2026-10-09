import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listaEsperaService, type EntrarListaEsperaInput } from '../services/listaEsperaService';

export const CHAVE_LISTA_ESPERA = ['lista-espera'] as const;

export function useListaEspera(habilitado: boolean) {
  return useQuery({
    queryKey: CHAVE_LISTA_ESPERA,
    queryFn: listaEsperaService.listar,
    enabled: habilitado,
  });
}

export function useEntrarListaEspera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EntrarListaEsperaInput) => listaEsperaService.entrar(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_LISTA_ESPERA }),
  });
}

export function useSairListaEspera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listaEsperaService.sair(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_LISTA_ESPERA }),
  });
}