import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogoService } from '../services/catalogoService';
import type { Pet } from '../types';

function useDebounce<T>(valor: T, atrasoMs: number): T {
  const [valorAtrasado, setValorAtrasado] = useState(valor);
  useEffect(() => {
    const timer = setTimeout(() => setValorAtrasado(valor), atrasoMs);
    return () => clearTimeout(timer);
  }, [valor, atrasoMs]);
  return valorAtrasado;
}

export function useRacas(especie: Pet['especie'] | null, texto: string) {
  const textoDebounced = useDebounce(texto, 250);

  return useQuery({
    queryKey: ['racas', especie, textoDebounced.trim().toLowerCase()],
    queryFn: () => catalogoService.sugerirRacas(especie as Pet['especie'], textoDebounced),
    enabled: !!especie,
    staleTime: 5 * 60 * 1000,
    retry: false, // falha rápido em vez de tentar de novo silenciosamente por vários segundos
  });
}