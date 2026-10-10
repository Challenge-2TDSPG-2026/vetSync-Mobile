import { ApiError, api } from '../api/httpClient';
import { authService, extrairPendenciaSocial } from '../authService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  ApiError: class MockApiError extends Error {
    status: number;
    tipo = 'http';
    campos?: Record<string, string>;
    corpo?: unknown;

    constructor(
      status: number,
      mensagem: string,
      tipo = 'http',
      campos?: Record<string, string>,
      corpo?: unknown,
    ) {
      super(mensagem);
      this.status = status;
      this.tipo = tipo;
      this.campos = campos;
      this.corpo = corpo;
    }
  },
}));

const apiPost = api.post as jest.Mock;

const sessao = {
  token: 'jwt-interno',
  idUsuario: 7,
  email: 'maria@teste.com',
  nome: 'Maria',
  perfil: 'TUTOR',
  temVinculoAtivo: true,
};

const erro409 = (corpo: unknown) => new ApiError(409, 'Já existe um registro com esses dados.', 'http', undefined, corpo);

describe('authService - login com Google', () => {
  beforeEach(() => jest.clearAllMocks());

  it('envia provider GOOGLE e o idToken, sem autenticação, e devolve a sessão', async () => {
    apiPost.mockResolvedValue(sessao);

    const resultado = await authService.loginComGoogle('id-token-google');

    expect(apiPost).toHaveBeenCalledWith(
      '/auth/social-login',
      { provider: 'GOOGLE', idToken: 'id-token-google' },
      false,
    );
    expect(resultado).toEqual({ tipo: 'SESSAO', sessao });
  });

  it.each(['CADASTRO_NECESSARIO', 'VINCULO_NECESSARIO', 'EMAIL_EM_USO'])(
    'trata o 409 %s como pendência, não como erro',
    async (status) => {
      apiPost.mockRejectedValue(
        erro409({ status, provider: 'GOOGLE', email: 'maria@gmail.com', emailVerificado: true, nome: 'Maria' }),
      );

      const resultado = await authService.loginComGoogle('id-token-google');

      expect(resultado).toEqual({
        tipo: 'PENDENTE',
        pendencia: {
          status,
          provider: 'GOOGLE',
          email: 'maria@gmail.com',
          emailVerificado: true,
          nome: 'Maria',
        },
      });
    },
  );

  it('não considera verificado um e-mail sem emailVerificado === true', async () => {
    apiPost.mockRejectedValue(erro409({ status: 'CADASTRO_NECESSARIO', email: 'x@gmail.com', emailVerificado: 'true' }));

    const resultado = await authService.loginComGoogle('id-token-google');

    expect(resultado).toMatchObject({ tipo: 'PENDENTE', pendencia: { emailVerificado: false, nome: null } });
  });

  it('repassa token inválido (401) como erro', async () => {
    apiPost.mockRejectedValue(new ApiError(401, 'Token de identidade inválido ou expirado'));

    await expect(authService.loginComGoogle('ruim')).rejects.toMatchObject({ status: 401 });
  });

  it('repassa um 409 comum (corpo sem status textual) como erro', async () => {
    apiPost.mockRejectedValue(erro409({ status: 409, erro: 'Conflict', mensagem: 'Duplicado' }));

    await expect(authService.loginComGoogle('id-token')).rejects.toMatchObject({ status: 409 });
  });

  it('repassa falhas de conexão como erro', async () => {
    apiPost.mockRejectedValue(new ApiError(0, 'Sem internet', 'sem-internet'));

    await expect(authService.loginComGoogle('id-token')).rejects.toMatchObject({ tipo: 'sem-internet' });
  });
});

describe('authService - cadastro e vínculo com Google', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registra enviando só o token e os dados do tutor, sem e-mail nem senha', async () => {
    apiPost.mockResolvedValue(sessao);

    await authService.registrarComGoogle({
      idToken: 'id-token',
      cpf: '12345678901',
      cep: '01310100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
      sessaoVinculo: 'sessao-clinica',
    });

    const [rota, corpo, autenticado] = apiPost.mock.calls[0];
    expect(rota).toBe('/auth/social-registrar');
    expect(autenticado).toBe(false);
    expect(corpo).toMatchObject({ provider: 'GOOGLE', idToken: 'id-token', sessaoVinculo: 'sessao-clinica' });
    expect(corpo).not.toHaveProperty('email');
    expect(corpo).not.toHaveProperty('senha');
  });

  it('vincula normalizando o e-mail e mantendo a senha como digitada', async () => {
    apiPost.mockResolvedValue(sessao);

    await authService.vincularGoogle('id-token', '  Maria@Teste.com ', 'Senha Com Espaço ');

    expect(apiPost).toHaveBeenCalledWith(
      '/auth/social-vincular',
      { provider: 'GOOGLE', idToken: 'id-token', email: 'maria@teste.com', senha: 'Senha Com Espaço ' },
      false,
    );
  });
});

describe('extrairPendenciaSocial', () => {
  it('ignora erros que não são ApiError e outros status', () => {
    expect(extrairPendenciaSocial(new Error('x'))).toBeNull();
    expect(extrairPendenciaSocial(null)).toBeNull();
    expect(extrairPendenciaSocial(new ApiError(400, 'x', 'http', undefined, { status: 'CADASTRO_NECESSARIO' }))).toBeNull();
  });

  it('ignora status desconhecido ou corpo ausente', () => {
    expect(extrairPendenciaSocial(erro409({ status: 'OUTRA_COISA' }))).toBeNull();
    expect(extrairPendenciaSocial(erro409(undefined))).toBeNull();
    expect(extrairPendenciaSocial(erro409('texto'))).toBeNull();
  });
});
