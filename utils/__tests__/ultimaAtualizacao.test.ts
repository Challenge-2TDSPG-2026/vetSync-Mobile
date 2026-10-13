import {
  atualizacaoMaisAntiga,
  formatarDataHoraCurta,
  formatarTempoDecorrido,
  textoUltimaAtualizacao,
} from '../ultimaAtualizacao';

const AGORA = new Date(2026, 9, 13, 15, 0, 0).getTime();
const atras = (ms: number) => AGORA - ms;
const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

describe('formatarTempoDecorrido', () => {
  it('escolhe a unidade certa', () => {
    expect(formatarTempoDecorrido(atras(10_000), AGORA)).toBe('agora há pouco');
    expect(formatarTempoDecorrido(atras(5 * MIN), AGORA)).toBe('há 5 min');
    expect(formatarTempoDecorrido(atras(3 * HORA + 20 * MIN), AGORA)).toBe('há 3 h');
    expect(formatarTempoDecorrido(atras(DIA), AGORA)).toBe('há 1 dia');
    expect(formatarTempoDecorrido(atras(4 * DIA), AGORA)).toBe('há 4 dias');
  });

  it('não devolve tempo negativo quando o relógio do aparelho foi ajustado', () => {
    expect(formatarTempoDecorrido(AGORA + HORA, AGORA)).toBe('agora há pouco');
  });
});

describe('formatarDataHoraCurta / textoUltimaAtualizacao', () => {
  it('formata em pt-BR com zeros à esquerda', () => {
    expect(formatarDataHoraCurta(new Date(2026, 0, 5, 9, 7).getTime())).toBe('05/01/2026 às 09:07');
  });

  it('junta o tempo decorrido com a data completa', () => {
    expect(textoUltimaAtualizacao(atras(2 * HORA), AGORA)).toBe('Atualizado há 2 h (13/10/2026 às 13:00)');
  });
});

describe('atualizacaoMaisAntiga', () => {
  it('usa a mais antiga e ignora consultas que nunca carregaram', () => {
    expect(atualizacaoMaisAntiga([300, 0, 100, 200])).toBe(100);
  });

  it('devolve null quando nada carregou', () => {
    expect(atualizacaoMaisAntiga([0, 0])).toBeNull();
    expect(atualizacaoMaisAntiga([])).toBeNull();
  });
});
