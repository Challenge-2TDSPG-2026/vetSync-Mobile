import type { Evento, StatusEventoExibicao } from '../types';

export function parseDataEvento(iso: string): Date {
  return iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
}

export function statusExibicao(evento: Evento): StatusEventoExibicao {
  if (evento.status === 'CONCLUIDO' || evento.status === 'CANCELADO') return evento.status;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const data = parseDataEvento(evento.data); data.setHours(0, 0, 0, 0);
  return data < hoje ? 'ATRASADO' : evento.status;
}

export const STATUS_EXIBICAO_BADGE: Record<StatusEventoExibicao, { bg: string; color: string; label: string }> = {
  AGENDADO: { bg: '#dbeafe', color: '#1e40af', label: 'Agendado' },
  CONCLUIDO: { bg: '#dcfce7', color: '#166534', label: 'Realizado' },
  CANCELADO: { bg: '#f0ece5', color: '#7a6a5e', label: 'Cancelado' },
  ATRASADO: { bg: '#fee2e2', color: '#991b1b', label: 'Atrasado' },
};

export function formatarDataEvento(iso: string): string {
  return parseDataEvento(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatarDataHoraEvento(iso: string): string {
  return parseDataEvento(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}