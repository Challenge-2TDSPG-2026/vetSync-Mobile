import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook genérico para alimentar o RefreshControl (puxar a tela pra baixo) em
 * qualquer lista do app. Ao ser chamado, invalida o cache do TanStack Query,
 * forçando um refetch de tudo que está em tela — sem precisar saber quais
 * hooks/queries aquela tela específica usa.
 *
 * Uso:
 *   const { atualizando, aoAtualizar } = useRecarregarDados();
 *   <ScrollView refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}>
 */
export function useRecarregarDados() {
  const queryClient = useQueryClient();
  const [atualizando, setAtualizando] = useState(false);

  const aoAtualizar = useCallback(async () => {
    setAtualizando(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setAtualizando(false);
    }
  }, [queryClient]);

  return { atualizando, aoAtualizar };
}