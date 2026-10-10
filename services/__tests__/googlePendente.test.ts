import { googlePendente, VALIDADE_GOOGLE_PENDENTE_MS } from '../googlePendente';
import type { PendenciaSocial } from '../authService';

const pendencia: PendenciaSocial = {
  status: 'CADASTRO_NECESSARIO',
  provider: 'GOOGLE',
  email: 'maria@gmail.com',
  emailVerificado: true,
  nome: 'Maria',
};

describe('googlePendente', () => {
  afterEach(() => googlePendente.limpar());

  it('guarda e devolve o token e a pendência', () => {
    googlePendente.definir('id-token', pendencia, 1_000);
    expect(googlePendente.obter(2_000)).toEqual({ idToken: 'id-token', pendencia });
  });

  it('descarta o token depois da validade', () => {
    googlePendente.definir('id-token', pendencia, 1_000);
    expect(googlePendente.obter(1_000 + VALIDADE_GOOGLE_PENDENTE_MS + 1)).toBeNull();
    expect(googlePendente.obter(1_000)).toBeNull(); // continua descartado
  });

  it('limpar apaga o token', () => {
    googlePendente.definir('id-token', pendencia);
    googlePendente.limpar();
    expect(googlePendente.obter()).toBeNull();
  });

  it('sem nada guardado devolve null', () => {
    expect(googlePendente.obter()).toBeNull();
  });
});
