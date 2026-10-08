import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { petHealthService } from '../services/petHealthService';
import { montarPlano, resumirPlano, type PlanoItem, type ResumoPlano } from '../utils/planoPreventivo';

export interface PlanoPreventivoResultado {
  itens: PlanoItem[];
  resumo: ResumoPlano;
  carregando: boolean;
  /** Só é erro quando NENHUMA das fontes respondeu; uma fonte isolada degrada o plano, não o derruba. */
  erro: boolean;
  parcial: boolean;
  recarregar: () => void;
}

/**
 * Plano preventivo = carteira de vacinação + próximas ações do backend.
 * Reaproveita as mesmas chaves de cache de `usePetHealth`, então não gera
 * requisições extras quando o dashboard já carregou esses dados.
 */
export function usePlanoPreventivo(petId: string | null, habilitado: boolean): PlanoPreventivoResultado {
  const ativo = habilitado && !!petId;
  const [carteira, acoes] = useQueries({
    queries: [
      {
        queryKey: ['pets', petId, 'carteira-vacinacao'] as const,
        queryFn: () => petHealthService.buscarCarteiraVacinacao(petId as string),
        enabled: ativo,
      },
      {
        queryKey: ['pets', petId, 'proximas-acoes'] as const,
        queryFn: () => petHealthService.listarProximasAcoes(petId as string),
        enabled: ativo,
      },
    ],
  });

  const itens = useMemo(
    () => montarPlano(carteira.data, acoes.data),
    [carteira.data, acoes.data],
  );
  const resumo = useMemo(() => resumirPlano(itens), [itens]);

  return {
    itens,
    resumo,
    carregando: ativo && (carteira.isLoading || acoes.isLoading),
    erro: carteira.isError && acoes.isError,
    parcial: carteira.isError !== acoes.isError,
    recarregar: () => {
      void carteira.refetch();
      void acoes.refetch();
    },
  };
}