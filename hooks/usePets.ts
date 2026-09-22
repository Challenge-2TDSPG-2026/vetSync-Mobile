import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { petService } from '../services/petService';
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
