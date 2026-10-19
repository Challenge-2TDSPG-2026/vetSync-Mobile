import { api } from '../api/httpClient';
import {
  registrarTokenPush,
  removerTokenPushRegistrado,
} from '../pushNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));
jest.mock('../notificationService', () => ({
  notificacaoService: {
    removerDispositivo: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../api/httpClient', () => ({
  api: { post: jest.fn().mockResolvedValue(undefined) },
}));

describe('pushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('registra o Expo Push Token no endpoint autenticado', async () => {
    await registrarTokenPush('ExponentPushToken[token]');

    expect(api.post).toHaveBeenCalledWith('/notificacoes/dispositivos', {
      token: 'ExponentPushToken[token]',
      plataforma: 'WEB',
      nomeDispositivo: 'Dispositivo móvel',
      fusoHorario: expect.any(String),
    });
  });

  it('rejeita tokens vazios sem chamar a API', async () => {
    await expect(registrarTokenPush('  ')).rejects.toThrow(
      'O Expo Push Token não foi fornecido.'
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it('remove o token registrado no backend e no armazenamento local', async () => {
    const { notificacaoService } = jest.requireMock('../notificationService') as {
      notificacaoService: { removerDispositivo: jest.Mock };
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('ExponentPushToken[token]');

    await removerTokenPushRegistrado();

    expect(notificacaoService.removerDispositivo).toHaveBeenCalledWith(
      'ExponentPushToken[token]'
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@vetsync:push_token');
  });

  it('não chama a API quando não há token armazenado', async () => {
    const { notificacaoService } = jest.requireMock('../notificationService') as {
      notificacaoService: { removerDispositivo: jest.Mock };
    };

    await removerTokenPushRegistrado();

    expect(notificacaoService.removerDispositivo).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });
});