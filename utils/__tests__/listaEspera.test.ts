import { adicionarDias, dataValida, descreverPeriodo, horaValida, validarJanelaEspera } from '../listaEspera';

const hoje = new Date('2026-10-09T10:00:00');

describe('listaEspera', () => {
  it('valida datas reais e rejeita datas inexistentes', () => {
    expect(dataValida('2026-10-09')).toBe(true);
    expect(dataValida('2026-02-30')).toBe(false);
    expect(dataValida('09/10/2026')).toBe(false);
  });

  it('valida horas HH:mm', () => {
    expect(horaValida('08:00')).toBe(true);
    expect(horaValida('24:00')).toBe(false);
    expect(horaValida('8:00')).toBe(false);
  });

  it('soma dias atravessando o mês', () => {
    expect(adicionarDias('2026-10-25', 10)).toBe('2026-11-04');
  });

  it('aceita uma janela válida', () => {
    expect(validarJanelaEspera({ dataInicio: '2026-10-09', dataFim: '2026-10-20', horaMin: '08:00', horaMax: '18:00' }, hoje)).toBeNull();
  });

  it('rejeita período no passado, invertido ou maior que 60 dias', () => {
    expect(validarJanelaEspera({ dataInicio: '2026-10-08', dataFim: '2026-10-20' }, hoje)).toMatch(/passado/);
    expect(validarJanelaEspera({ dataInicio: '2026-10-20', dataFim: '2026-10-10' }, hoje)).toMatch(/igual ou depois/);
    expect(validarJanelaEspera({ dataInicio: '2026-10-09', dataFim: '2026-12-31' }, hoje)).toMatch(/60 dias/);
  });

  it('aceita exatamente 60 dias', () => {
    expect(validarJanelaEspera({ dataInicio: '2026-10-09', dataFim: adicionarDias('2026-10-09', 59) }, hoje)).toBeNull();
  });

  it('rejeita faixa de horário inválida ou invertida', () => {
    expect(validarJanelaEspera({ dataInicio: '2026-10-09', dataFim: '2026-10-10', horaMin: '9h' }, hoje)).toMatch(/mínimo inválido/);
    expect(validarJanelaEspera({ dataInicio: '2026-10-09', dataFim: '2026-10-10', horaMin: '18:00', horaMax: '08:00' }, hoje)).toMatch(/não pode ser maior/);
  });

  it('descreve o período com e sem faixa de horário', () => {
    expect(descreverPeriodo({ dataInicio: '2026-10-12', dataFim: '2026-10-20', horaMin: '08:00', horaMax: '18:00' })).toBe('12/10 a 20/10 · entre 08:00 e 18:00');
    expect(descreverPeriodo({ dataInicio: '2026-10-12', dataFim: '2026-10-12', horaMin: null, horaMax: null })).toBe('12/10 · qualquer horário');
    expect(descreverPeriodo({ dataInicio: '2026-10-12', dataFim: '2026-10-13', horaMin: '09:00', horaMax: null })).toBe('12/10 a 13/10 · a partir de 09:00');
  });
});