import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tutorService, type AtualizarTutorPayload } from '../services/tutorService';

const CHAVE_TUTOR = ['tutor'] as const;

export function useTutor(idTutor?: number) {
  return useQuery({
    queryKey: [...CHAVE_TUTOR, idTutor],
    queryFn: () => tutorService.buscarPorId(idTutor!),
    enabled: Boolean(idTutor),
  });
}

export function useAtualizarTutor(idTutor?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: AtualizarTutorPayload) => tutorService.atualizar(idTutor!, dados),
    onSuccess: (dados) => {
      queryClient.setQueryData([...CHAVE_TUTOR, idTutor], dados);
    },
  });
}
