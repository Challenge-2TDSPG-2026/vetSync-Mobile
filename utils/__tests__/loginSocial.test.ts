import { ApiError } from '../../services/api/httpClient';
import type { PendenciaSocial } from '../../services/authService';
import { destinoDaPendencia, erroDeTokenGoogle } from '../loginSocial';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}));

const base: PendenciaSocial = {
  status: 'CADASTRO_NECESSARIO',
  provider: 'GOOGLE',
  email: 'maria@gmail.com',
  emailVerificado: true,
  nome: 'Maria',
};

describe('destinoDaPendencia', () => {
  it('manda cadastrar quem não tem conta e tem e-mail verificado pelo Google', () => {
    expect(destinoDaPendencia(base)).toEqual({ acao: 'CADASTRAR' });
  });

  it('pede a senha da conta existente para vincular (nunca vincula só pelo e-mail)', () => {
    expect(destinoDaPendencia({ ...base, status: 'VINCULO_NECESSARIO' })).toEqual({ acao: 'VINCULAR' });
  });

  it('bloqueia e-mail de conta de clínica/veterinário', () => {
    expect(destinoDaPendencia({ ...base, status: 'EMAIL_EM_USO' })).toMatchObject({ acao: 'BLOQUEAR' });
  });

  it('bloqueia o cadastro quando o Google não confirmou o e-mail', () => {
    expect(destinoDaPendencia({ ...base, emailVerificado: false })).toMatchObject({ acao: 'BLOQUEAR' });
    expect(destinoDaPendencia({ ...base, email: null })).toMatchObject({ acao: 'BLOQUEAR' });
  });

  it('bloqueia status desconhecido por segurança', () => {
    const desconhecido = { ...base, status: 'NOVO_STATUS' } as unknown as PendenciaSocial;
    expect(destinoDaPendencia(desconhecido)).toMatchObject({ acao: 'BLOQUEAR' });
  });
});

describe('erroDeTokenGoogle', () => {
  it('reconhece token do Google recusado pela API', () => {
    expect(erroDeTokenGoogle(new ApiError(401, 'Token de identidade inválido ou expirado'))).toBe(true);
  });

  it('não confunde senha errada com token expirado', () => {
    expect(erroDeTokenGoogle(new ApiError(401, 'E-mail ou senha inválidos'))).toBe(false);
    expect(erroDeTokenGoogle(new ApiError(500, 'Token de identidade inválido'))).toBe(false);
    expect(erroDeTokenGoogle(new Error('Token de identidade inválido'))).toBe(false);
  });
});
