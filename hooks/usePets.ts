import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { petService } from '../services/petService';
import type { Pet } from '../types';

const CHAVE_PETS = ['pets'] as const;
const chavePet = (id: string) => ['pets', id] as const;

export function usePets(habilitado: boolean) {
  return useQuery({
    queryKey: CHAVE_PETS,
    queryFn: petService.listarPets,
    enabled: habilitado,
  });
}

export function usePetPorId(id: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: chavePet(id ?? ''),
    queryFn: () => petService.buscarPorId(id as string),
    enabled: habilitado && id !== null,
    staleTime: 60_000,
  });
}

export function usePetsPorIds(ids: string[], habilitado: boolean) {
  const idsOrdenados = [...ids].sort();
  return useQuery({
    queryKey: ['pets-por-ids', ...idsOrdenados],
    queryFn: () => Promise.all(idsOrdenados.map(id => petService.buscarPorId(id))),
    enabled: habilitado && idsOrdenados.length > 0,
  });
}

export function useCriarPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pet: Pet) => petService.criarPet(pet),
    onSuccess: (novoPet) => {
      queryClient.setQueryData<Pet[]>(CHAVE_PETS, (antigos = []) => {
        const existe = antigos.some(p => p.id === novoPet.id);
        return existe ? antigos : [...antigos, novoPet];
      });
      queryClient.invalidateQueries({ queryKey: CHAVE_PETS });
    },
  });
}

export function useAtualizarPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pet: Pet) => petService.atualizarPet(pet),
    onSuccess: (petAtualizado) => {
      queryClient.setQueryData<Pet[]>(CHAVE_PETS, (antigos = []) =>
        antigos.map(p => (p.id === petAtualizado.id ? petAtualizado : p))
      );
      queryClient.invalidateQueries({ queryKey: CHAVE_PETS });
    },
  });
}

export function useRemoverPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => petService.removerPet(id),
    onSuccess: (_, idRemovido) => {
      queryClient.setQueryData<Pet[]>(CHAVE_PETS, (antigos = []) =>
        antigos.filter(p => p.id !== idRemovido)
      );
      queryClient.invalidateQueries({ queryKey: CHAVE_PETS });
    },
  });
}