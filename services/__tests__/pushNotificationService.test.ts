jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const platform = {
    OS: 'web',
    select: (spec: Record<string, unknown>) => spec.web ?? spec.default,
  };

  return { __esModule: true, default: platform, ...platform };
});
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'projeto-teste' } } } },
}));
jest.mock('../../constants', () => ({
  STORAGE_KEYS: { PUSH_TOKEN: '@vetsync:push_token' },
}));
jest.mock('../api/httpClient', () => ({
  api: { post: jest.fn().mockResolvedValue(undefined) },
}));

import { api } from '../api/httpClient';
import { registrarTokenPush } from '../pushNotificationService';

describe('pushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registra o Expo Push Token no endpoint autenticado', async () => {
    await registrarTokenPush('ExponentPushToken[token]');

    expect(api.post).toHaveBeenCalledWith('/notificacoes/registrar-token', {
      token: 'ExponentPushToken[token]',
    });
  });

  it('rejeita tokens vazios sem chamar a API', async () => {
    await expect(registrarTokenPush('  ')).rejects.toThrow(
      'O Expo Push Token não foi fornecido.'
    );
    expect(api.post).not.toHaveBeenCalled();
  });
});
