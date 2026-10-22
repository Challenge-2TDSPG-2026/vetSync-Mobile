import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { petService } from '../services/petService';
import { definirImagemLocal, invalidarImagem } from '../services/imagemCache';
import type { ArquivoUpload } from '../services/api/httpClient';
import type { Pet } from '../types';
import { petKeys } from './queryKeys';

export function usePets(habilitado: boolean) {
  return useQuery({
    queryKey: petKeys.all,
    queryFn: petService.listarPets,
    enabled: habilitado,
  });
}

export function usePetPorId(id: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: petKeys.detalhe(id ?? ''),
    queryFn: () => petService.buscarPorId(id as string),
    enabled: habilitado && id !== null,
    staleTime: 60_000,
  });
}

export function usePetsPorIds(ids: string[], habilitado: boolean) {
  const idsOrdenados = [...ids].sort();
  return useQuery({
    queryKey: petKeys.listaPorIds(idsOrdenados),
    queryFn: () => Promise.all(idsOrdenados.map(id => petService.buscarPorId(id))),
    enabled: habilitado && idsOrdenados.length > 0,
  });
}

export function useCriarPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pet: Pet) => petService.criarPet(pet),
    onSuccess: (novoPet) => {
      queryClient.setQueryData<Pet[]>(petKeys.all, (antigos = []) => {
        const existe = antigos.some(p => p.id === novoPet.id);
        return existe ? antigos : [...antigos, novoPet];
      });
      queryClient.invalidateQueries({ queryKey: petKeys.all });
    },
  });
}

export function useAtualizarPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pet: Pet) => petService.atualizarPet(pet),
    onSuccess: (petAtualizado) => {
      queryClient.setQueryData<Pet[]>(petKeys.all, (antigos = []) =>
        antigos.map(p => (p.id === petAtualizado.id ? petAtualizado : p))
      );
      queryClient.invalidateQueries({ queryKey: petKeys.all });
    },
  });
}

export function useRemoverPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => petService.removerPet(id),
    onSuccess: (_, idRemovido) => {
      queryClient.setQueryData<Pet[]>(petKeys.all, (antigos = []) =>
        antigos.filter(p => p.id !== idRemovido)
      );
      queryClient.invalidateQueries({ queryKey: petKeys.all });
    },
  });
}

/** Descarta a cópia local da foto antiga/nova para as telas buscarem a imagem atualizada. */
function descartarFotoEmCache(queryClient: QueryClient, petAtualizado: Pet) {
  const anterior =
    queryClient.getQueryData<Pet>(petKeys.detalhe(petAtualizado.id))?.fotoUrl ??
    queryClient.getQueryData<Pet[]>(petKeys.all)?.find(pet => pet.id === petAtualizado.id)?.fotoUrl;
  void invalidarImagem(anterior);
  if (petAtualizado.fotoUrl !== anterior) void invalidarImagem(petAtualizado.fotoUrl);
}

function fotoAtualDoPet(queryClient: QueryClient, idPet: string): string | null {
  return (
    queryClient.getQueryData<Pet>(petKeys.detalhe(idPet))?.fotoUrl ??
    queryClient.getQueryData<Pet[]>(petKeys.all)?.find(pet => pet.id === idPet)?.fotoUrl ??
    null
  );
}

export function useEnviarFotoPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idPet, arquivo }: { idPet: string; arquivo: ArquivoUpload }) =>
      petService.enviarFoto(idPet, arquivo),
    // Já mostra a foto nova enquanto o envio acontece (a foto recortada está no aparelho).
    onMutate: ({ idPet, arquivo }) => {
      const anterior = fotoAtualDoPet(queryClient, idPet);
      if (anterior) void definirImagemLocal(anterior, arquivo.uri);
      return { anterior };
    },
    onError: (_erro, _variaveis, contexto) => {
      void invalidarImagem(contexto?.anterior); // envio falhou: volta para a foto que está no servidor
    },
    onSuccess: (petAtualizado, { arquivo }, contexto) => {
      const nova = petAtualizado.fotoUrl;
      if (contexto?.anterior && contexto.anterior !== nova) void invalidarImagem(contexto.anterior);
      if (nova && nova !== contexto?.anterior) void definirImagemLocal(nova, arquivo.uri);
      queryClient.setQueryData<Pet[]>(petKeys.all, (antigos = []) =>
        antigos.map(pet => (pet.id === petAtualizado.id ? petAtualizado : pet))
      );
      queryClient.setQueryData<Pet>(petKeys.detalhe(petAtualizado.id), petAtualizado);
      queryClient.invalidateQueries({ queryKey: petKeys.all });
      queryClient.invalidateQueries({ queryKey: petKeys.detalhe(petAtualizado.id) });
    },
  });
}

export function useRemoverFotoPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idPet: string) => petService.removerFoto(idPet),
    onSuccess: (petAtualizado) => {
      descartarFotoEmCache(queryClient, petAtualizado);
      queryClient.setQueryData<Pet[]>(petKeys.all, (antigos = []) =>
        antigos.map(pet => (pet.id === petAtualizado.id ? petAtualizado : pet))
      );
      queryClient.setQueryData<Pet>(petKeys.detalhe(petAtualizado.id), petAtualizado);
      queryClient.invalidateQueries({ queryKey: petKeys.all });
      queryClient.invalidateQueries({ queryKey: petKeys.detalhe(petAtualizado.id) });
    },
  });
}
