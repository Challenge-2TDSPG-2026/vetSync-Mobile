import { ehPendenteDeConfirmacao, etapaSolicitacao, formatarDataEHora, podeBuscarNovoHorario, podeReagendar, rotuloAcaoHistorico } from '../solicitacao';

const agora = new Date('2026-10-09T12:00:00');

describe('solicitacao', () => {
  it('trata evento agendado sem statusConfirmacao como confirmado', () => {
    expect(etapaSolicitacao({ status: 'AGENDADO', data: '2026-10-12' }, agora)).toBe('CONFIRMADO');
  });

  it('mostra aguardando confirmação quando a clínica ainda não respondeu', () => {
    const evento = { status: 'AGENDADO' as const, statusConfirmacao: 'PENDENTE' as const, data: '2026-10-12' };
    expect(etapaSolicitacao(evento, agora)).toBe('AGUARDANDO_CONFIRMACAO');
    expect(ehPendenteDeConfirmacao(evento)).toBe(true);
  });

  it('diferencia recusa da clínica de cancelamento comum', () => {
    expect(etapaSolicitacao({ status: 'CANCELADO', statusConfirmacao: 'RECUSADO', data: '2026-10-12' }, agora)).toBe('RECUSADO');
    expect(etapaSolicitacao({ status: 'CANCELADO', statusConfirmacao: 'CONFIRMADO', data: '2026-10-12' }, agora)).toBe('CANCELADO');
  });

  it('marca como atrasado o agendamento de dia passado e como realizado o concluído', () => {
    expect(etapaSolicitacao({ status: 'AGENDADO', data: '2026-10-01' }, agora)).toBe('ATRASADO');
    expect(etapaSolicitacao({ status: 'CONCLUIDO', data: '2026-10-01' }, agora)).toBe('CONCLUIDO');
  });

  it('não considera o próprio dia como atrasado', () => {
    expect(etapaSolicitacao({ status: 'AGENDADO', data: '2026-10-09' }, agora)).toBe('CONFIRMADO');
  });

  it('só permite reagendar agendamentos ativos e futuros', () => {
    expect(podeReagendar({ status: 'AGENDADO', data: '2026-10-12' }, agora)).toBe(true);
    expect(podeReagendar({ status: 'AGENDADO', statusConfirmacao: 'PENDENTE', data: '2026-10-12' }, agora)).toBe(true);
    expect(podeReagendar({ status: 'CANCELADO', data: '2026-10-12' }, agora)).toBe(false);
    expect(podeReagendar({ status: 'AGENDADO', data: '2026-10-01' }, agora)).toBe(false);
    expect(podeReagendar({ status: 'CONCLUIDO', data: '2026-10-12' }, agora)).toBe(false);
  });

  it('oferece novo horário apenas para cancelados e recusados', () => {
    expect(podeBuscarNovoHorario({ status: 'CANCELADO', data: '2026-10-12' }, agora)).toBe(true);
    expect(podeBuscarNovoHorario({ status: 'CANCELADO', statusConfirmacao: 'RECUSADO', data: '2026-10-12' }, agora)).toBe(true);
    expect(podeBuscarNovoHorario({ status: 'AGENDADO', data: '2026-10-12' }, agora)).toBe(false);
  });

  it('formata data com e sem hora', () => {
    expect(formatarDataEHora('2026-10-12', '14:30')).toMatch(/12.*2026 às 14:30/);
    expect(formatarDataEHora('2026-10-12')).not.toContain('às');
  });

  it('traduz as ações do histórico e preserva as desconhecidas', () => {
    expect(rotuloAcaoHistorico('REAGENDAMENTO')).toBe('Horário alterado');
    expect(rotuloAcaoHistorico('OUTRA')).toBe('OUTRA');
  });
});