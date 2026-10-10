import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, type ArquivoUpload } from '../services/api/httpClient';
import {
  prontuarioService,
  type DadosCompartilhamento,
  type DadosExame,
  type FiltrosProntuario,
} from '../services/prontuarioService';
import { chaveFiltros } from '../utils/prontuario';
import { prontuarioKeys } from './queryKeys';

/** Erros de permissão ou de recurso inexistente não melhoram com nova tentativa. */
function tentarNovamente(tentativas: number, erro: unknown): boolean {
  if (erro instanceof ApiError && [401, 403, 404].includes(erro.status)) return false;
  return tentativas < 2;
}

export function useProntuario(idPet: string | null, filtros: FiltrosProntuario, habilitado: boolean) {
  return useQuery({
    queryKey: prontuarioKeys.consulta(idPet ?? '', chaveFiltros(filtros)),
    queryFn: () => prontuarioService.consultar(idPet as string, filtros),
    enabled: habilitado && idPet !== null,
    staleTime: 30_000,
    retry: tentarNovamente,
  });
}

export function useCompartilhamentosProntuario(idPet: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: prontuarioKeys.compartilhamentos(idPet ?? ''),
    queryFn: () => prontuarioService.listarCompartilhamentos(idPet as string),
    enabled: habilitado && idPet !== null,
    retry: tentarNovamente,
  });
}

export function useCriarCompartilhamento(idPet: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: DadosCompartilhamento) => prontuarioService.criarCompartilhamento(idPet as string, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prontuarioKeys.compartilhamentos(idPet ?? '') }),
  });
}

export function useRevogarCompartilhamento(idPet: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idCompartilhamento: string) =>
      prontuarioService.revogarCompartilhamento(idPet as string, idCompartilhamento),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prontuarioKeys.compartilhamentos(idPet ?? '') }),
  });
}

export function useOrientacoesEvento(idEvento: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: prontuarioKeys.orientacoes(idEvento ?? ''),
    queryFn: () => prontuarioService.listarOrientacoes(idEvento as string),
    enabled: habilitado && idEvento !== null,
    retry: tentarNovamente,
  });
}

export function useCriarOrientacao(idPet: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idEvento, titulo, texto }: { idEvento: string; titulo: string; texto: string }) =>
      prontuarioService.criarOrientacao(idEvento, { titulo, texto }),
    onSuccess: (_orientacao, variaveis) => {
      queryClient.invalidateQueries({ queryKey: prontuarioKeys.orientacoes(variaveis.idEvento) });
      queryClient.invalidateQueries({ queryKey: prontuarioKeys.raiz(idPet ?? '') });
    },
  });
}

export function useRemoverOrientacao(idPet: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idEvento, idOrientacao }: { idEvento: string; idOrientacao: string }) =>
      prontuarioService.removerOrientacao(idEvento, idOrientacao),
    onSuccess: (_resultado, variaveis) => {
      queryClient.invalidateQueries({ queryKey: prontuarioKeys.orientacoes(variaveis.idEvento) });
      queryClient.invalidateQueries({ queryKey: prontuarioKeys.raiz(idPet ?? '') });
    },
  });
}

/** Registra o exame e o laudo (se houver). Ver `registrarExameComLaudo` para o tratamento de falha parcial. */
export function useRegistrarExame(idPet: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dados, arquivo }: { dados: DadosExame; arquivo?: ArquivoUpload | null }) =>
      prontuarioService.registrarExameComLaudo(idPet as string, dados, arquivo),
    onSettled: () => queryClient.invalidateQueries({ queryKey: prontuarioKeys.raiz(idPet ?? '') }),
  });
}

export function useRemoverExame(idPet: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idExame: string) => prontuarioService.removerExame(idPet as string, idExame),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prontuarioKeys.raiz(idPet ?? '') }),
  });
}
