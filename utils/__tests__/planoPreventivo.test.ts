import type { CarteiraVacinacao, ProximaAcao, Vacina } from '../../services/petHealthService';
import {
  calcularLembretes,
  diasAte,
  itensDeAtencao,
  montarPlano,
  resumirPlano,
  rotuloPrazo,
} from '../planoPreventivo';

const HOJE = new Date('2026-10-08T10:00:00');

function vacina(parcial: Partial<Vacina> & Pick<Vacina, 'id' | 'nome' | 'status'>): Vacina {
  return { aplicadaEm: null, proximaDoseEm: null, eventoId: null, veterinario: null, comprovanteUrl: null, ...parcial };
}

function carteira(vacinas: Vacina[]): CarteiraVacinacao {
  return { petId: '1', vacinas, resumo: { emDia: 0, vencendo: 0, atrasadas: 0, futuras: 0 } };
}

function acao(parcial: Partial<ProximaAcao> & Pick<ProximaAcao, 'id' | 'titulo'>): ProximaAcao {
  return { tipo: 'CUIDADO', prioridade: 'MEDIA', descricao: '', podeAgendar: true, ...parcial };
}

describe('diasAte', () => {
  it('calcula dias ignorando a hora do dia', () => {
    expect(diasAte('2026-10-08', HOJE)).toBe(0);
    expect(diasAte('2026-10-09', HOJE)).toBe(1);
    expect(diasAte('2026-10-05', HOJE)).toBe(-3);
    expect(diasAte('2026-10-08T23:59:00', HOJE)).toBe(0);
  });

  it('retorna null sem data ou com data inválida', () => {
    expect(diasAte(null, HOJE)).toBeNull();
    expect(diasAte('lixo', HOJE)).toBeNull();
  });
});

describe('montarPlano', () => {
  it('respeita o status vindo da clínica e ordena por urgência', () => {
    const plano = montarPlano(
      carteira([
        vacina({ id: 'a', nome: 'Antirrábica', status: 'EM_DIA', proximaDoseEm: '2027-08-01' }),
        vacina({ id: 'b', nome: 'V10', status: 'VENCENDO', proximaDoseEm: '2026-10-20' }),
        vacina({ id: 'c', nome: 'Gripe Canina', status: 'ATRASADA', proximaDoseEm: '2026-09-01' }),
        vacina({ id: 'd', nome: 'Giárdia', status: 'FUTURA', proximaDoseEm: '2026-12-01' }),
      ]),
      [],
      HOJE,
    );

    expect(plano.map(i => i.titulo)).toEqual(['Gripe Canina', 'V10', 'Giárdia', 'Antirrábica']);
    expect(plano.map(i => i.status)).toEqual(['ATRASADO', 'VENCENDO', 'FUTURO', 'EM_DIA']);
  });

  it('só permite agendar o que está atrasado ou vencendo (vacinas)', () => {
    const plano = montarPlano(
      carteira([
        vacina({ id: 'a', nome: 'A', status: 'EM_DIA', proximaDoseEm: '2027-01-01' }),
        vacina({ id: 'b', nome: 'B', status: 'VENCENDO', proximaDoseEm: '2026-10-15' }),
      ]),
      [],
      HOJE,
    );
    expect(plano.find(i => i.titulo === 'A')?.podeAgendar).toBe(false);
    expect(plano.find(i => i.titulo === 'B')?.podeAgendar).toBe(true);
  });

  it('classifica cuidados pela data limite e prioridade informadas pela clínica', () => {
    const plano = montarPlano(
      null,
      [
        acao({ id: '1', titulo: 'Vermífugo', dataLimite: '2026-10-01' }),
        acao({ id: '2', titulo: 'Retorno', dataLimite: '2026-10-25' }),
        acao({ id: '3', titulo: 'Check-up anual', dataLimite: '2027-03-01' }),
        acao({ id: '4', titulo: 'Exame urgente', prioridade: 'ALTA', dataLimite: '2027-03-01' }),
      ],
      HOJE,
    );
    const status = Object.fromEntries(plano.map(i => [i.titulo, i.status]));
    expect(status).toEqual({
      Vermífugo: 'ATRASADO',
      Retorno: 'VENCENDO',
      'Check-up anual': 'FUTURO',
      'Exame urgente': 'VENCENDO',
    });
  });

  it('não duplica cuidado que já aparece como vacina (mesmo evento ou mesmo título)', () => {
    const plano = montarPlano(
      carteira([
        vacina({ id: 'a', nome: 'Antirrábica', status: 'VENCENDO', proximaDoseEm: '2026-10-15', eventoId: '99' }),
        vacina({ id: 'b', nome: 'V10', status: 'VENCENDO', proximaDoseEm: '2026-10-16' }),
      ]),
      [
        acao({ id: '1', titulo: 'Reforço', eventoReferenciaId: '99', dataLimite: '2026-10-15' }),
        acao({ id: '2', titulo: 'Vacina V10 pendente', dataLimite: '2026-10-16' }),
        acao({ id: '3', titulo: 'Vermífugo', dataLimite: '2026-10-20' }),
      ],
      HOJE,
    );
    expect(plano.map(i => i.titulo).sort()).toEqual(['Antirrábica', 'V10', 'Vermífugo']);
  });

  it('lida com listas vazias', () => {
    expect(montarPlano(null, null, HOJE)).toEqual([]);
    expect(montarPlano(carteira([]), [], HOJE)).toEqual([]);
  });
});

describe('regras reais do backend (VetSync-Java)', () => {
  it('mantém só a dose mais recente de cada vacina (dose antiga não vira atraso)', () => {
    const plano = montarPlano(
      carteira([
        vacina({ id: 'velha', nome: 'V10', status: 'ATRASADA', aplicadaEm: '2025-01-10', proximaDoseEm: '2026-01-10' }),
        vacina({ id: 'nova', nome: 'V10', status: 'EM_DIA', aplicadaEm: '2026-01-12', proximaDoseEm: '2027-01-12' }),
      ]),
      [],
      HOJE,
    );
    expect(plano).toHaveLength(1);
    expect(plano[0]).toMatchObject({ id: 'vacina:nova', status: 'EM_DIA' });
  });

  it('respeita `substituida` e `tipoVacinaId` quando o backend atualizado os envia', () => {
    const plano = montarPlano(
      carteira([
        vacina({ id: 'velha', nome: 'V10', status: 'EM_DIA', aplicadaEm: '2025-01-10', proximaDoseEm: '2026-01-10', substituida: true, tipoVacinaId: 1 }),
        vacina({ id: 'nova', nome: 'V10', status: 'EM_DIA', aplicadaEm: '2026-01-12', proximaDoseEm: '2027-01-12', tipoVacinaId: 1 }),
        // mesmo nome, tipos diferentes (ex.: clínicas distintas) não se fundem
        vacina({ id: 'outra', nome: 'V10', status: 'VENCENDO', aplicadaEm: '2025-10-20', proximaDoseEm: '2026-10-20', tipoVacinaId: 2 }),
      ]),
      [],
      HOJE,
    );
    expect(plano.map(i => i.id).sort()).toEqual(['vacina:nova', 'vacina:outra']);
  });

  it('mantém doses FUTURA como itens à parte', () => {
    const plano = montarPlano(
      carteira([
        vacina({ id: 'a', nome: 'V10', status: 'EM_DIA', aplicadaEm: '2026-01-12', proximaDoseEm: '2027-01-12' }),
        vacina({ id: 'b', nome: 'V10', status: 'FUTURA', aplicadaEm: '2026-11-01', proximaDoseEm: '2027-11-01' }),
      ]),
      [],
      HOJE,
    );
    expect(plano.map(i => i.status).sort()).toEqual(['EM_DIA', 'FUTURO']);
  });

  it('ignora "peso desatualizado" (dataLimite é a última pesagem, não um vencimento)', () => {
    const plano = montarPlano(
      null,
      [acao({ id: 'peso', tipo: 'PESO_DESATUALIZADO', titulo: 'Peso desatualizado', dataLimite: '2026-01-01', podeAgendar: false })],
      HOJE,
    );
    expect(plano).toEqual([]);
  });

  it('descarta ações VACINA_* quando a carteira carregou, mas as mantém se ela falhou', () => {
    const acoes = [acao({ id: 'vacina-1', tipo: 'VACINA_ATRASADA', prioridade: 'ALTA', titulo: 'V10 atrasada', dataLimite: '2026-01-10' })];
    expect(montarPlano(carteira([]), acoes, HOJE)).toEqual([]);
    const semCarteira = montarPlano(null, acoes, HOJE);
    expect(semCarteira).toHaveLength(1);
    expect(semCarteira[0]).toMatchObject({ status: 'ATRASADO', servicoSugerido: 'Vacina' });
  });

  it('sugere o serviço certo para agendar', () => {
    const plano = montarPlano(
      carteira([vacina({ id: 'a', nome: 'V10', status: 'VENCENDO', aplicadaEm: '2025-10-20', proximaDoseEm: '2026-10-20' })]),
      [acao({ id: 'evento-7', tipo: 'EVENTO_ATRASADO', titulo: 'Consulta atrasado', dataLimite: '2026-10-01' })],
      HOJE,
    );
    expect(plano.map(i => i.servicoSugerido).sort()).toEqual(['Consulta', 'Vacina']);
  });
});

describe('resumirPlano e itensDeAtencao', () => {
  it('conta por status', () => {
    const plano = montarPlano(
      carteira([
        vacina({ id: 'a', nome: 'A', status: 'ATRASADA', proximaDoseEm: '2026-09-01' }),
        vacina({ id: 'b', nome: 'B', status: 'VENCENDO', proximaDoseEm: '2026-10-15' }),
        vacina({ id: 'c', nome: 'C', status: 'EM_DIA', proximaDoseEm: '2027-10-15' }),
      ]),
      [],
      HOJE,
    );
    expect(resumirPlano(plano)).toEqual({ atrasados: 1, vencendo: 1, futuros: 0, emDia: 1, atencao: 2 });
    expect(itensDeAtencao(plano)).toHaveLength(2);
  });
});

describe('rotuloPrazo', () => {
  it.each([
    [{ status: 'ATRASADO', diasParaVencer: -1 }, 'Atrasado há 1 dia'],
    [{ status: 'ATRASADO', diasParaVencer: -12 }, 'Atrasado há 12 dias'],
    [{ status: 'VENCENDO', diasParaVencer: 0 }, 'Vence hoje'],
    [{ status: 'VENCENDO', diasParaVencer: 1 }, 'Vence amanhã'],
    [{ status: 'VENCENDO', diasParaVencer: 9 }, 'Vence em 9 dias'],
    [{ status: 'EM_DIA', diasParaVencer: null }, 'Em dia'],
    [{ status: 'FUTURO', diasParaVencer: null }, 'Sem data definida'],
  ] as const)('%j → %s', (item, esperado) => {
    expect(rotuloPrazo(item)).toBe(esperado);
  });
});

describe('calcularLembretes', () => {
  const plano = montarPlano(
    carteira([
      vacina({ id: 'a', nome: 'V10', status: 'VENCENDO', proximaDoseEm: '2026-10-20' }),
      vacina({ id: 'b', nome: 'Gripe', status: 'ATRASADA', proximaDoseEm: '2026-09-01' }),
      vacina({ id: 'c', nome: 'Antirrábica', status: 'EM_DIA', proximaDoseEm: '2027-08-01' }),
    ]),
    [],
    HOJE,
  );

  it('agenda D-7 e D-1 às 9h para o que está vencendo e um aviso para o atrasado', () => {
    const lembretes = calcularLembretes(plano, 'Luna', { diasAntes: [7, 1] }, HOJE);
    const v10 = lembretes.filter(l => l.itemId === 'vacina:a').map(l => l.quando.toISOString());
    expect(v10).toEqual([new Date('2026-10-13T09:00:00').toISOString(), new Date('2026-10-19T09:00:00').toISOString()]);

    const atrasado = lembretes.filter(l => l.itemId === 'vacina:b');
    expect(atrasado).toHaveLength(1);
    expect(atrasado[0].quando.getTime()).toBeGreaterThan(HOJE.getTime());
    expect(atrasado[0].titulo).toContain('atrasado');
  });

  it('ignora itens em dia e disparos que já passaram', () => {
    const agora = new Date('2026-10-19T12:00:00');
    const lembretes = calcularLembretes(plano, 'Luna', { diasAntes: [7, 1] }, agora);
    expect(lembretes.some(l => l.itemId === 'vacina:c')).toBe(false);
    expect(lembretes.filter(l => l.itemId === 'vacina:a')).toHaveLength(0);
  });

  it('respeita as preferências (sem dias = só atrasados) e o limite', () => {
    expect(calcularLembretes(plano, 'Luna', { diasAntes: [] }, HOJE).map(l => l.itemId)).toEqual(['vacina:b']);
    expect(calcularLembretes(plano, 'Luna', { diasAntes: [7, 1], limite: 1 }, HOJE)).toHaveLength(1);
  });
});