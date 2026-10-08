import { encontrarServicoPorNome } from '../planoNavegacao';

const servicos = [
  { id: 1, nome: 'Consulta de rotina' },
  { id: 2, nome: 'Vacinação' },
  { id: 3, nome: 'Vermífugo' },
];

describe('encontrarServicoPorNome', () => {
  it('casa ignorando acentos e caixa', () => {
    expect(encontrarServicoPorNome(servicos, 'VERMIFUGO')?.id).toBe(3);
    expect(encontrarServicoPorNome(servicos, 'vacinação')?.id).toBe(2);
  });

  it('casa por inclusão em qualquer direção', () => {
    expect(encontrarServicoPorNome(servicos, 'Vermífugo trimestral')?.id).toBe(3);
    expect(encontrarServicoPorNome([{ id: 9, nome: 'Vacinação antirrábica' }], 'Vacinação')?.id).toBe(9);
  });

  it('o hint "Vacina" encontra o serviço "Vacinação" da clínica', () => {
    expect(encontrarServicoPorNome(servicos, 'Vacina')?.id).toBe(2);
  });

  it('retorna null quando não há correspondência ou nome', () => {
    expect(encontrarServicoPorNome(servicos, 'Cirurgia')).toBeNull();
    expect(encontrarServicoPorNome(servicos, undefined)).toBeNull();
    expect(encontrarServicoPorNome(servicos, '   ')).toBeNull();
  });
});