import { useCallback } from 'react';
import { criarStoreLocalVet } from './storeLocalVet';

const ehFoto = (valor: unknown): valor is string => typeof valor === 'string' && valor.startsWith('data:image/');

const useStoreFoto = criarStoreLocalVet<string>('@vetsync:vet_foto:', ehFoto);

/**
 * Foto do veterinário. Hoje a API não tem endpoint de foto para veterinários, então a imagem fica salva
 * apenas neste aparelho. Quando o endpoint existir, basta trocar a implementação deste hook.
 */
export function useVetFoto() {
  const { valor, carregado, definir } = useStoreFoto();
  const salvarFoto = useCallback((dataUri: string) => definir(dataUri), [definir]);
  const removerFoto = useCallback(() => definir(null), [definir]);
  return { fotoUri: valor, carregado, salvarFoto, removerFoto };
}
