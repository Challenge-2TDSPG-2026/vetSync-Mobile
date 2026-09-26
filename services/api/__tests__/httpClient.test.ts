jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockNetInfoFetch = jest.fn();
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: (...args: unknown[]) => mockNetInfoFetch(...args) },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, apiRequest } from '../httpClient';
import { assinarExpiracaoSessao } from '../sessionEvents';

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ token: 'token-valido' }));
    mockNetInfoFetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
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

  it('envia a foto no campo multipart esperado pelo Java', async () => {
    const append = jest.fn();
    globalThis.FormData = jest.fn(() => ({ append })) as unknown as typeof FormData;
    globalThis.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ idPet: 12 })),
      blob: jest.fn().mockResolvedValue({}),
    } as Partial<Response>) as typeof fetch;

    await api.uploadMultipart('/pets/12/foto', {
      uri: 'file:///foto.jpg',
      nome: 'foto-pet.jpg',
      tipoMime: 'image/jpeg',
    });

    expect(append.mock.calls[0][0]).toBe('foto');
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      'https://vetsync-java.onrender.com/pets/12/foto',
      expect.objectContaining({ method: 'PUT', headers: { Authorization: 'Bearer token-valido' } })
    );
  });

  it('devolve ApiError "sem-internet" quando o fetch falha e o aparelho está sem conexão', async () => {
    mockNetInfoFetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(apiRequest({ method: 'GET', path: '/pets' })).rejects.toMatchObject({
      status: 0,
      tipo: 'sem-internet',
      message: 'Você está sem conexão com a internet. Verifique o Wi-Fi ou os dados móveis e tente novamente.',
    });
  });

  it('devolve ApiError "servidor-indisponivel" quando o fetch falha mas o aparelho está conectado', async () => {
    mockNetInfoFetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(apiRequest({ method: 'GET', path: '/pets' })).rejects.toMatchObject({
      status: 0,
      tipo: 'servidor-indisponivel',
      message: 'Não foi possível conectar ao servidor. Tente novamente em instantes.',
    });
  });

  it('devolve ApiError "timeout" quando a requisição excede o tempo limite', async () => {
    const erroAbort = Object.assign(new Error('Aborted'), { name: 'AbortError' });
    globalThis.fetch = jest.fn().mockRejectedValue(erroAbort);

    await expect(apiRequest({ method: 'GET', path: '/pets' })).rejects.toMatchObject({
      status: 0,
      tipo: 'timeout',
      message: 'A solicitação demorou mais que o esperado. Tente novamente.',
    });
    expect(mockNetInfoFetch).not.toHaveBeenCalled();
  });

  it('usa a mensagem padrão por status quando o corpo do erro não traz mensagem própria', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      status: 404,
      ok: false,
      text: jest.fn().mockResolvedValue(''),
    } as Partial<Response>) as typeof fetch;

    await expect(apiRequest({ method: 'GET', path: '/pets/999' })).rejects.toMatchObject({
      status: 404,
      tipo: 'http',
      message: 'Não encontramos o que você está procurando.',
    });
  });
});