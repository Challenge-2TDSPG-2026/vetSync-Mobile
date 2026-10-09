import type { Evento } from '../types';
import { parseDataEvento } from './eventoStatus';

export type EtapaSolicitacao =
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CONFIRMADO'
  | 'RECUSADO'
  | 'CANCELADO'
  | 'CONCLUIDO'
  | 'ATRASADO';

export interface VisualEtapa {
  label: string;
  descricao: string;
  bg: string;
  color: string;
  icone: 'time-outline' | 'checkmark-circle-outline' | 'close-circle-outline' | 'alert-circle-outline' | 'ribbon-outline';
}

export const ETAPA_VISUAL: Record<EtapaSolicitacao, VisualEtapa> = {
  AGUARDANDO_CONFIRMACAO: {
    label: 'Aguardando confirmação',
    descricao: 'A clínica ainda vai confirmar este horário. Ele já está reservado para você.',
    bg: '#fef3c7',
    color: '#92400e',
    icone: 'time-outline',
  },
  CONFIRMADO: {
    label: 'Confirmado',
    descricao: 'A clínica confirmou o seu horário.',
    bg: '#dcfce7',
    color: '#166534',
    icone: 'checkmark-circle-outline',
  },
  RECUSADO: {
    label: 'Não confirmado',
    descricao: 'A clínica não pôde atender neste horário. Escolha outro horário ou entre na lista de espera.',
    bg: '#fee2e2',
    color: '#991b1b',
    icone: 'close-circle-outline',
  },
  CANCELADO: {
    label: 'Cancelado',
    descricao: 'Este agendamento foi cancelado.',
    bg: '#f0ece5',
    color: '#7a6a5e',
    icone: 'close-circle-outline',
  },
  CONCLUIDO: {
    label: 'Realizado',
    descricao: 'Atendimento realizado.',
    bg: '#dcfce7',
    color: '#166534',
    icone: 'ribbon-outline',
  },
  ATRASADO: {
    label: 'Atrasado',
    descricao: 'A data deste agendamento já passou.',
    bg: '#fee2e2',
    color: '#991b1b',
    icone: 'alert-circle-outline',
  },
};

type EventoParaEtapa = Pick<Evento, 'status' | 'statusConfirmacao' | 'data'>;

/** Estado da solicitação do ponto de vista do tutor. Backends sem `statusConfirmacao` valem como confirmados. */
export function etapaSolicitacao(evento: EventoParaEtapa, agora: Date = new Date()): EtapaSolicitacao {
  if (evento.status === 'CONCLUIDO') return 'CONCLUIDO';
  if (evento.status === 'CANCELADO') return evento.statusConfirmacao === 'RECUSADO' ? 'RECUSADO' : 'CANCELADO';

  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);
  const data = parseDataEvento(evento.data);
  data.setHours(0, 0, 0, 0);
  if (data < hoje) return 'ATRASADO';

  return evento.statusConfirmacao === 'PENDENTE' ? 'AGUARDANDO_CONFIRMACAO' : 'CONFIRMADO';
}

/** Só dá para escolher outro horário enquanto o agendamento está ativo e ainda não passou. */
export function podeReagendar(evento: EventoParaEtapa, agora: Date = new Date()): boolean {
  const etapa = etapaSolicitacao(evento, agora);
  return etapa === 'AGUARDANDO_CONFIRMACAO' || etapa === 'CONFIRMADO';
}

/** Cancelado pela clínica (recusa) ou pelo tutor: ainda faz sentido oferecer "escolher outro horário" ou fila de espera. */
export function podeBuscarNovoHorario(evento: EventoParaEtapa, agora: Date = new Date()): boolean {
  const etapa = etapaSolicitacao(evento, agora);
  return etapa === 'RECUSADO' || etapa === 'CANCELADO';
}

export function ehPendenteDeConfirmacao(evento: Pick<Evento, 'status' | 'statusConfirmacao'>): boolean {
  return evento.status === 'AGENDADO' && evento.statusConfirmacao === 'PENDENTE';
}

/** "2026-10-12" + "14:30" → "12 out 2026 às 14:30". Sem hora, mostra só a data. */
export function formatarDataEHora(data: string, hora?: string | null): string {
  const base = parseDataEvento(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return hora ? `${base} às ${hora}` : base;
}

const ROTULO_ACAO: Record<string, string> = {
  CRIACAO: 'Solicitação enviada',
  CONFIRMACAO: 'Confirmado pela clínica',
  REAGENDAMENTO: 'Horário alterado',
  CANCELAMENTO: 'Cancelado',
  CONCLUSAO: 'Atendimento realizado',
};

export function rotuloAcaoHistorico(acao: string): string {
  return ROTULO_ACAO[acao] ?? acao;
}