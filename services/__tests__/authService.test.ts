import { api } from '../api/httpClient';
import { authService } from '../authService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const apiPost = api.post as jest.Mock;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normaliza o e-mail (trim + minúsculas) e envia a senha sem alterações no login', async () => {
    const sessao = {
      token: 't',
      idUsuario: 1,
      email: 'tutor@vetsync.test',
      nome: 'Tutor',
      perfil: 'TUTOR',
    };
    apiPost.mockResolvedValue(sessao);

    const resultado = await authService.login('  Tutor@VetSync.test  ', 'SenhaSegura1');

    expect(apiPost).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'tutor@vetsync.test', senha: 'SenhaSegura1' },
      false,
    );
    expect(resultado).toBe(sessao);
  });

  it('passo 1: solicita o código de recuperação para o e-mail normalizado', async () => {
    apiPost.mockResolvedValue({ mensagem: 'Se o e-mail existir, enviaremos um código.' });

    await authService.esqueciSenha('  Tutor@VetSync.test  ');

    expect(apiPost).toHaveBeenCalledWith(
      '/auth/esqueci-senha',
      { email: 'tutor@vetsync.test' },
      false,
    );
  });

  it('passo 2: valida o código informado, normalizando e-mail e removendo espaços do código', async () => {
    apiPost.mockResolvedValue({ valido: true });

    const resultado = await authService.validarCodigo(' Tutor@VetSync.test ', ' 123456 ');

    expect(apiPost).toHaveBeenCalledWith(
      '/auth/validar-codigo',
      { email: 'tutor@vetsync.test', codigo: '123456' },
      false,
    );
    expect(resultado).toEqual({ valido: true });
  });

  it('passo 3: redefine a senha enviando e-mail normalizado, código sem espaços e as duas senhas', async () => {
    apiPost.mockResolvedValue({ mensagem: 'Senha redefinida.' });

    await authService.redefinirSenha(
      ' Tutor@VetSync.test ',
      ' 654321 ',
      'NovaSenha1',
      'NovaSenha1',
    );

    expect(apiPost).toHaveBeenCalledWith(
      '/auth/redefinir-senha',
      {
        email: 'tutor@vetsync.test',
        codigo: '654321',
        novaSenha: 'NovaSenha1',
        confirmarSenha: 'NovaSenha1',
      },
      false,
    );
  });

  it('registra um novo tutor normalizando o e-mail e preservando os demais campos', async () => {
    const sessao = {
      token: 't2',
      idUsuario: 2,
      email: 'novo@vetsync.test',
      nome: 'Novo Tutor',
      perfil: 'TUTOR',
    };
    apiPost.mockResolvedValue(sessao);

    const resultado = await authService.registrar({
      nome: 'Novo Tutor',
      email: '  Novo@VetSync.test  ',
      senha: 'SenhaForte1',
      cpf: '12345678900',
      telefone: '11999998888',
      cep: '01310100',
      logradouro: 'Avenida Paulista',
      numero: '1000',
      complemento: 'Apto 10',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });

    expect(apiPost).toHaveBeenCalledWith(
      '/auth/registrar',
      {
        nome: 'Novo Tutor',
        email: 'novo@vetsync.test',
        senha: 'SenhaForte1',
        cpf: '12345678900',
        telefone: '11999998888',
        cep: '01310100',
        logradouro: 'Avenida Paulista',
        numero: '1000',
        complemento: 'Apto 10',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
      },
      false,
    );
    expect(resultado).toBe(sessao);
  });

  it('faz logout chamando o endpoint autenticado (sem o terceiro argumento "false")', async () => {
    apiPost.mockResolvedValue(undefined);

    await authService.logout();

    expect(apiPost).toHaveBeenCalledWith('/auth/logout');
  });
});
