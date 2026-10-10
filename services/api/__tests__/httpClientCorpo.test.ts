import { apiRequest } from '../httpClient';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }) },
}));

function responder(status: number, corpo: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: jest.fn().mockResolvedValue(typeof corpo === 'string' ? corpo : JSON.stringify(corpo)),
  } as Partial<Response>) as typeof fetch;
}

describe('ApiError.corpo', () => {
  it('guarda o corpo da resposta de erro (necessário para o 409 do login com Google)', async () => {
    const corpo = { status: 'VINCULO_NECESSARIO', email: 'maria@gmail.com' };
    responder(409, corpo);

    await expect(
      apiRequest({ method: 'POST', path: '/auth/social-login', body: {}, autenticado: false }),
    ).rejects.toMatchObject({ status: 409, corpo });
  });

  it('mantém a mensagem padrão por status quando o corpo não traz mensagem', async () => {
    responder(409, { status: 'CADASTRO_NECESSARIO' });

    await expect(
      apiRequest({ method: 'POST', path: '/auth/social-login', body: {}, autenticado: false }),
    ).rejects.toMatchObject({ message: 'Já existe um registro com esses dados.' });
  });

  it('continua usando a mensagem enviada pela API', async () => {
    responder(401, { mensagem: 'Token de identidade inválido ou expirado' });

    await expect(
      apiRequest({ method: 'POST', path: '/auth/social-login', body: {}, autenticado: false }),
    ).rejects.toMatchObject({ status: 401, message: 'Token de identidade inválido ou expirado' });
  });
});
