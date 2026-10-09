import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventoService } from '../services/eventoService';
import { catalogoService } from '../services/catalogoService';

const CHAVE_EVENTOS = ['eventos'] as const;
const CHAVE_TIPOS_EVENTO = ['tipos-evento'] as const;
const CHAVE_VETERINARIOS = ['veterinarios'] as const;

export function useEventos(habilitado: boolean) {
  return useQuery({
    queryKey: CHAVE_EVENTOS,
    queryFn: eventoService.listarEventos,
    enabled: habilitado,
  });
}

export function useTiposEvento(habilitado: boolean) {
  return useQuery({
    queryKey: CHAVE_TIPOS_EVENTO,
    queryFn: catalogoService.listarTiposEvento,
    enabled: habilitado,
    staleTime: 5 * 60_000,
  });
}

export function useVeterinarios(habilitado: boolean, especialidade?: string | null) {
  return useQuery({
    queryKey: [...CHAVE_VETERINARIOS, especialidade ?? null] as const,
    queryFn: () => catalogoService.listarVeterinarios(especialidade),
    enabled: habilitado,
    staleTime: 5 * 60_000,
  });
}

interface SolicitarEventoInput {
  idPet: string;
  idTipoEvento: string;
  idVeterinario: string;
  data: string;
  hora: string;
  observacao?: string;
}

export function useAgendarEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SolicitarEventoInput) => eventoService.agendarEvento(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_EVENTOS }),
  });
}

export function useConcluirEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, observacao, custo }: { id: string; observacao?: string; custo?: number }) =>
      eventoService.concluirEvento(id, observacao, custo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_EVENTOS }),
  });
}

export function useCancelarEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo, reagendarPara, horaReagendarPara }: { id: string; motivo: string; reagendarPara?: string; horaReagendarPara?: string }) =>
      eventoService.cancelarEvento(id, motivo, reagendarPara, horaReagendarPara),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_EVENTOS }),
  });
}

export function useReagendarEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, hora }: { id: string; data: string; hora: string }) =>
      eventoService.reagendarEvento(id, data, hora),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_EVENTOS }),
  });
}

export function useConfirmarEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventoService.confirmarEvento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_EVENTOS }),
  });
}

export function useRecusarEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => eventoService.recusarEvento(id, motivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_EVENTOS }),
  });
}

export function useHistoricoEvento(id: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: [...CHAVE_EVENTOS, 'historico', id] as const,
    queryFn: () => eventoService.buscarHistorico(id as string),
    enabled: habilitado && !!id,
  });
}

export function useRemoverEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventoService.removerEvento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_EVENTOS }),
  });
}

export function useEventoDetalhes(id: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: [...CHAVE_EVENTOS, 'detalhes', id] as const,
    queryFn: () => eventoService.buscarDetalhes(id as string),
    enabled: habilitado && !!id,
  });
}
 