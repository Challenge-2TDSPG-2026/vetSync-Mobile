import { rotaDaNotificacao } from '../notificacaoRota';

describe('rotaDaNotificacao', () => {
  it('abre o agendamento já preenchido quando surge uma vaga', () => {
    expect(rotaDaNotificacao({ tipo: 'VAGA_DISPONIVEL', petId: '7', servicoId: 5, data: '2026-10-12', hora: '14:30' })).toEqual({
      pathname: '/(tutor)/agendar-servico',
      params: { petId: '7', servicoId: '5', data: '2026-10-12', hora: '14:30' },
    });
  });

  it('vai para a lista de espera quando a vaga não traz pet e serviço (item da lista de notificações)', () => {
    expect(rotaDaNotificacao({ tipo: 'VAGA_DISPONIVEL', referenciaTipo: 'LISTA_ESPERA', referenciaId: '3' })).toEqual({ pathname: '/(tutor)/lista-espera' });
  });

  it('descarta data e hora mal formatadas em vez de repassá-las', () => {
    const rota = rotaDaNotificacao({ tipo: 'VAGA_DISPONIVEL', petId: '7', servicoId: '5', data: '12/10', hora: '99:99' });
    expect(rota?.params).toEqual({ petId: '7', servicoId: '5' });
  });

  it('abre o detalhe do evento quando a clínica confirma ou recusa', () => {
    expect(rotaDaNotificacao({ tipo: 'EVENTO_CONFIRMADO', referenciaTipo: 'EVENTO', referenciaId: 42 })).toEqual({ pathname: '/evento/[id]', params: { id: '42' } });
    expect(rotaDaNotificacao({ tipo: 'EVENTO_RECUSADO', referenciaTipo: 'EVENTO', referenciaId: '42' })).toEqual({ pathname: '/evento/[id]', params: { id: '42' } });
  });

  it('cai na agenda quando o evento não tem id válido', () => {
    expect(rotaDaNotificacao({ tipo: 'EVENTO_CONFIRMADO', referenciaTipo: 'EVENTO', referenciaId: '../../x' })).toEqual({ pathname: '/(tutor)/(tabs)/agenda' });
  });

  it('abre o plano preventivo para o lembrete local do plano', () => {
    expect(rotaDaNotificacao({ planoPetId: 1, planoItemId: 2, rota: '/(tutor)/plano-preventivo' })).toEqual({ pathname: '/(tutor)/plano-preventivo' });
  });

  it('ignora rotas livres vindas do payload', () => {
    expect(rotaDaNotificacao({ rota: '/(vet)/resgates' })).toBeNull();
    expect(rotaDaNotificacao({ tipo: 'QUALQUER', rota: '/gerenciar-conta' })).toBeNull();
  });

  it('retorna null sem dados', () => {
    expect(rotaDaNotificacao(null)).toBeNull();
    expect(rotaDaNotificacao(undefined)).toBeNull();
  });
});