import {
  LIMITE_BYTES_OBSERVACAO,
  bytesDisponiveisParaNotas,
  bytesUtf8,
  cortarEmBytes,
  formatarDuracao,
  montarCabecalho,
  montarObservacao,
} from '../atendimentoVet';

const inicio = new Date(2026, 9, 21, 14, 2);
const fim = new Date(2026, 9, 21, 14, 41);
const dados = { clinica: 'Clínica VetCare', veterinario: 'Mariana Souza', inicio, fim };

describe('atendimentoVet', () => {
  it('conta bytes UTF-8 (acentos valem 2)', () => {
    expect(bytesUtf8('abc')).toBe(3);
    expect(bytesUtf8('ação')).toBe(6);
  });

  it('corta em bytes sem partir caracteres', () => {
    const cortado = cortarEmBytes('é'.repeat(10), 5);
    expect(cortado).toBe('éé');
    expect(bytesUtf8(cortado)).toBeLessThanOrEqual(5);
    expect(cortarEmBytes('curto', 100)).toBe('curto');
  });

  it('monta o cabeçalho com clínica, veterinário, data e horários', () => {
    expect(montarCabecalho(dados)).toBe(
      'Atendimento • Clínica VetCare\nVeterinário(a): Mariana Souza\nData: 21/10/2026 • Início: 14:02 • Término: 14:41',
    );
  });

  it('omite a clínica quando não há vínculo', () => {
    expect(montarCabecalho({ ...dados, clinica: null }).split('\n')[0]).toBe('Atendimento');
  });

  it('junta cabeçalho e notas, e mantém só o cabeçalho sem notas', () => {
    expect(montarObservacao(dados, '  Paciente calmo.  ')).toContain('\n\nPaciente calmo.');
    expect(montarObservacao(dados, '   ')).toBe(montarCabecalho(dados));
  });

  it('reserva espaço do cabeçalho dentro do limite do backend', () => {
    const livres = bytesDisponiveisParaNotas({ clinica: 'Clínica VetCare', veterinario: 'Mariana Souza', inicio });
    const notas = cortarEmBytes('ã'.repeat(2000), livres);
    expect(bytesUtf8(montarObservacao(dados, notas))).toBeLessThanOrEqual(LIMITE_BYTES_OBSERVACAO);
  });

  it('formata a duração', () => {
    expect(formatarDuracao(65_000)).toBe('01:05');
    expect(formatarDuracao(3_725_000)).toBe('1:02:05');
    expect(formatarDuracao(-5)).toBe('00:00');
  });
});
