import { deveSalvarOffline, deveSalvarQuery } from '../cacheOffline';

describe('deveSalvarOffline (lista de permissão do cache offline)', () => {
  it.each([
    [['pets']],
    [['pets', '12']],
    [['pets', '12', 'carteira-vacinacao']],
    [['pets', '12', 'perfil-saude']],
    [['pets', '12', 'proximas-acoes']],
  ])('salva %j', (chave) => {
    expect(deveSalvarOffline(chave)).toBe(true);
  });

  it.each([
    [['pets', '12', 'prontuario']],
    [['pets', '12', 'prontuario', 'consulta', 'x']],
    [['pets', '12', 'acessos']],
    [['pets', '12', 'atividades']],
    [['pets', 'por-ids', '1', '2']],
    [['pets', '', 'carteira-vacinacao']],
    [['pets', '12', 'carteira-vacinacao', 'extra']],
    [['tutor', 1]],
    [['eventos']],
    [['notificacoes']],
    [[]],
  ])('NÃO salva %j', (chave) => {
    expect(deveSalvarOffline(chave)).toBe(false);
  });
});

describe('deveSalvarQuery', () => {
  it('só salva consultas concluídas com sucesso', () => {
    expect(deveSalvarQuery({ queryKey: ['pets'], state: { status: 'success' } } as never)).toBe(true);
    expect(deveSalvarQuery({ queryKey: ['pets'], state: { status: 'error' } } as never)).toBe(false);
    expect(deveSalvarQuery({ queryKey: ['pets'], state: { status: 'pending' } } as never)).toBe(false);
  });
});
