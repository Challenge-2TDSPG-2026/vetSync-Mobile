import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../../constants';
import {
  limparSessaoPersistida,
  obterTokenDaSessaoEmMemoria,
  restaurarSessaoPersistida,
  salvarSessaoAposLogin,
  type SessaoProtegida,
} from '../biometriaService';

const armazenamentoSeguro = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const secureStore = jest.mocked(SecureStore);

const sessao: SessaoProtegida = {
  token: 'token-secreto',
  idUsuario: 7,
  email: 'tutor@vetsync.test',
  nome: 'Tutor de teste',
  perfil: 'TUTOR',
};

describe('biometriaService — sessão sem biometria', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    armazenamentoSeguro.clear();
    await AsyncStorage.clear();
    secureStore.setItemAsync.mockImplementation(async (chave, valor) => {
      armazenamentoSeguro.set(chave, valor);
    });
    secureStore.getItemAsync.mockImplementation(async (chave) => {
      return armazenamentoSeguro.get(chave) ?? null;
    });
    secureStore.deleteItemAsync.mockImplementation(async (chave) => {
      armazenamentoSeguro.delete(chave);
    });
  });

  it('grava o token no armazenamento seguro e não no AsyncStorage', async () => {
    await salvarSessaoAposLogin(sessao);

    expect(armazenamentoSeguro.get('vetsync.sessao')).toBe(JSON.stringify(sessao));
    expect(await AsyncStorage.getItem(STORAGE_KEYS.SESSAO)).toBeNull();
    expect(obterTokenDaSessaoEmMemoria()).toBe('token-secreto');
  });

  it('restaura a sessão a partir do armazenamento seguro', async () => {
    armazenamentoSeguro.set('vetsync.sessao', JSON.stringify(sessao));

    await expect(restaurarSessaoPersistida()).resolves.toEqual(sessao);
  });

  it('migra a sessão antiga do AsyncStorage e apaga a cópia em texto puro', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify(sessao));

    await expect(restaurarSessaoPersistida()).resolves.toEqual(sessao);

    expect(armazenamentoSeguro.get('vetsync.sessao')).toBe(JSON.stringify(sessao));
    expect(await AsyncStorage.getItem(STORAGE_KEYS.SESSAO)).toBeNull();
  });

  it('mantém a sessão antiga se a migração falhar, para não deslogar o usuário', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify(sessao));
    secureStore.setItemAsync.mockRejectedValue(new Error('keystore indisponível'));

    await expect(restaurarSessaoPersistida()).resolves.toEqual(sessao);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.SESSAO)).not.toBeNull();
  });

  it('nunca cai para texto puro quando o armazenamento seguro falha ao salvar', async () => {
    secureStore.setItemAsync.mockRejectedValue(new Error('keystore indisponível'));

    await salvarSessaoAposLogin(sessao);

    expect(await AsyncStorage.getItem(STORAGE_KEYS.SESSAO)).toBeNull();
    expect(obterTokenDaSessaoEmMemoria()).toBe('token-secreto');
  });

  it('descarta sessões inválidas', async () => {
    armazenamentoSeguro.set('vetsync.sessao', JSON.stringify({ ...sessao, token: ' ' }));

    await expect(restaurarSessaoPersistida()).resolves.toBeNull();
    expect(armazenamentoSeguro.has('vetsync.sessao')).toBe(false);
  });

  it('limpa tudo no logout', async () => {
    await salvarSessaoAposLogin(sessao);
    armazenamentoSeguro.set('vetsync.sessao_protegida', 'qualquer');

    await limparSessaoPersistida();

    expect(armazenamentoSeguro.size).toBe(0);
    expect(obterTokenDaSessaoEmMemoria()).toBeNull();
  });
});

describe('biometriaService — web', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
    jest.replaceProperty(Platform, 'OS', 'web');
    // Na web o módulo existe, mas qualquer chamada lança (não há implementação nativa).
    secureStore.setItemAsync.mockRejectedValue(new TypeError('not a function'));
    secureStore.getItemAsync.mockRejectedValue(new TypeError('not a function'));
    secureStore.deleteItemAsync.mockRejectedValue(new TypeError('not a function'));
  });

  it('guarda e restaura a sessão no AsyncStorage', async () => {
    await salvarSessaoAposLogin(sessao);

    expect(await AsyncStorage.getItem(STORAGE_KEYS.SESSAO)).toBe(JSON.stringify(sessao));
    await expect(restaurarSessaoPersistida()).resolves.toEqual(sessao);
  });

  it('o logout não quebra quando o SecureStore não existe', async () => {
    await salvarSessaoAposLogin(sessao);

    await expect(limparSessaoPersistida()).resolves.toBeUndefined();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.SESSAO)).toBeNull();
  });
});