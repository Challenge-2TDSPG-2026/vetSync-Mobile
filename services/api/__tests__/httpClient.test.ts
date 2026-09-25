jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, apiRequest } from '../httpClient';
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
});
