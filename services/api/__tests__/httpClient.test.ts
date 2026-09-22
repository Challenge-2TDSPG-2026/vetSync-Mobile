jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../httpClient';
import { assinarExpiracaoSessao } from '../sessionEvents';

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ token: 'token-valido' }));
  });

  it('notifica a aplicação e devolve ApiError quando a sessão expira', async () => {
    const aoExpirar = jest.fn();
    const cancelarAssinatura = assinarExpiracaoSessao(aoExpirar);
    globalThis.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      text: jest.fn().mockResolvedValue(JSON.stringify({ mensagem: 'Token expirado' })),
    } as Partial<Response>) as typeof fetch;

    await expect(apiRequest({ method: 'GET', path: '/pets' })).rejects.toMatchObject({
      status: 401,
      message: 'Sua sessão expirou. Entre novamente.',
    });

    expect(aoExpirar).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token-valido' }),
    }));
    cancelarAssinatura();
  });
});
