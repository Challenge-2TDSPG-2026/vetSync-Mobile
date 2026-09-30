import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants';

const CHAVE_SESSAO_PROTEGIDA = 'vetsync.sessao_protegida';

export interface SessaoProtegida {
  token: string;
  idUsuario: number;
  email: string;
  nome: string;
  perfil: 'TUTOR' | 'VETERINARIO' | 'ADMIN';
}

export interface EstadoBiometria {
  ativada: boolean;
  disponivel: boolean;
  nome: string;
  motivoIndisponibilidade?: string;
  convitePendente: boolean;
}

let sessaoEmMemoria: SessaoProtegida | null = null;

function validarSessaoProtegida(valor: unknown): valor is SessaoProtegida {
  if (!valor || typeof valor !== 'object') return false;
  const sessao = valor as Partial<SessaoProtegida>;
  return (
    typeof sessao.token === 'string' &&
    sessao.token.trim().length > 0 &&
    typeof sessao.idUsuario === 'number' &&
    Number.isInteger(sessao.idUsuario) &&
    sessao.idUsuario > 0 &&
    typeof sessao.email === 'string' &&
    sessao.email.trim().length > 0 &&
    typeof sessao.nome === 'string' &&
    sessao.nome.trim().length > 0 &&
    (sessao.perfil === 'TUTOR' || sessao.perfil === 'VETERINARIO' || sessao.perfil === 'ADMIN')
  );
}

function nomeDaAutenticacao(tipos: LocalAuthentication.AuthenticationType[]): string {
  if (Platform.OS === 'ios') {
    if (tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Touch ID';
  }

  if (tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'reconhecimento facial';
  }
  if (tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'impressão digital';
  }
  return 'biometria';
}

async function biometriaEstaAtivada(): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIA_ATIVADA)) === 'true';
}

export function definirSessaoEmMemoria(sessao: SessaoProtegida | null): void {
  sessaoEmMemoria = sessao;
}

export function obterTokenDaSessaoEmMemoria(): string | null {
  return sessaoEmMemoria?.token ?? null;
}

export async function obterEstadoBiometria(idUsuario?: number): Promise<EstadoBiometria> {
  const ativada = await biometriaEstaAtivada();
  const usuarioConvite = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIA_CONVITE_USUARIO);

  try {
    const [temHardware, estaCadastrada, tipos] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const nome = nomeDaAutenticacao(tipos);

    if (!temHardware || tipos.length === 0) {
      return {
        ativada,
        disponivel: false,
        nome,
        motivoIndisponibilidade: 'Este aparelho não possui biometria compatível.',
        convitePendente: false,
      };
    }
    if (!estaCadastrada) {
      return {
        ativada,
        disponivel: false,
        nome,
        motivoIndisponibilidade: `Cadastre ${nome} nas configurações do aparelho para usar este recurso.`,
        convitePendente: false,
      };
    }

    return {
      ativada,
      disponivel: true,
      nome,
      convitePendente: !ativada && idUsuario !== undefined && usuarioConvite !== String(idUsuario),
    };
  } catch {
    return {
      ativada,
      disponivel: false,
      nome: 'biometria',
      motivoIndisponibilidade: 'Não foi possível verificar a biometria deste aparelho.',
      convitePendente: false,
    };
  }
}

async function salvarSessaoComSenha(sessao: SessaoProtegida): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify(sessao));
  definirSessaoEmMemoria(sessao);
}

export async function salvarSessaoAposLogin(sessao: SessaoProtegida): Promise<void> {
  const [ativada, usuarioBiometria] = await Promise.all([
    biometriaEstaAtivada(),
    AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIA_USUARIO),
  ]);

  if (!ativada || usuarioBiometria !== String(sessao.idUsuario)) {
    if (ativada) await limparBiometria();
    await salvarSessaoComSenha(sessao);
    return;
  }

  try {
    await SecureStore.setItemAsync(CHAVE_SESSAO_PROTEGIDA, JSON.stringify(sessao), {
      requireAuthentication: true,
    });
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
    definirSessaoEmMemoria(sessao);
  } catch {
    await limparBiometria();
    await salvarSessaoComSenha(sessao);
  }
}

export async function restaurarSessaoPersistida(): Promise<SessaoProtegida | null> {
  if (await biometriaEstaAtivada()) {
    try {
      const valor = await SecureStore.getItemAsync(CHAVE_SESSAO_PROTEGIDA, {
        requireAuthentication: true,
      });
      if (!valor) return null;
      const sessao: unknown = JSON.parse(valor);
      if (!validarSessaoProtegida(sessao)) {
        await limparBiometria();
        return null;
      }
      definirSessaoEmMemoria(sessao);
      return sessao;
    } catch {
      return null;
    }
  }

  const valor = await AsyncStorage.getItem(STORAGE_KEYS.SESSAO);
  if (!valor) return null;
  try {
    const sessao: unknown = JSON.parse(valor);
    if (!validarSessaoProtegida(sessao)) {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
      return null;
    }
    definirSessaoEmMemoria(sessao);
    return sessao;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
    return null;
  }
}

export async function ativarBiometria(sessao: SessaoProtegida): Promise<void> {
  const estado = await obterEstadoBiometria(sessao.idUsuario);
  if (!estado.disponivel) {
    throw new Error(estado.motivoIndisponibilidade ?? 'Biometria indisponível neste aparelho.');
  }

  const autenticacao = await LocalAuthentication.authenticateAsync({
    promptMessage: `Confirme seu ${estado.nome} para ativar o login`,
    cancelLabel: 'Cancelar',
    disableDeviceFallback: true,
    fallbackLabel: '',
    biometricsSecurityLevel: 'strong',
  });
  if (!autenticacao.success) {
    throw new Error('Não foi possível confirmar sua biometria.');
  }

  await SecureStore.setItemAsync(CHAVE_SESSAO_PROTEGIDA, JSON.stringify(sessao), {
    requireAuthentication: true,
  });
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.BIOMETRIA_ATIVADA, 'true'],
      [STORAGE_KEYS.BIOMETRIA_USUARIO, String(sessao.idUsuario)],
      [STORAGE_KEYS.BIOMETRIA_CONVITE_USUARIO, String(sessao.idUsuario)],
    ]);
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
    definirSessaoEmMemoria(sessao);
  } catch (erro) {
    await SecureStore.deleteItemAsync(CHAVE_SESSAO_PROTEGIDA);
    throw erro;
  }
}

export async function desativarBiometria(sessao: SessaoProtegida): Promise<void> {
  await SecureStore.deleteItemAsync(CHAVE_SESSAO_PROTEGIDA);
  await AsyncStorage.multiRemove([STORAGE_KEYS.BIOMETRIA_ATIVADA, STORAGE_KEYS.BIOMETRIA_USUARIO]);
  await salvarSessaoComSenha(sessao);
}

export async function limparBiometria(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(CHAVE_SESSAO_PROTEGIDA),
    AsyncStorage.multiRemove([STORAGE_KEYS.BIOMETRIA_ATIVADA, STORAGE_KEYS.BIOMETRIA_USUARIO]),
  ]);
}

export async function marcarConviteBiometriaComoVisto(idUsuario: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIA_CONVITE_USUARIO, String(idUsuario));
}

export async function limparSessaoPersistida(): Promise<void> {
  definirSessaoEmMemoria(null);
  await Promise.all([
    AsyncStorage.multiRemove([
      STORAGE_KEYS.SESSAO,
      STORAGE_KEYS.PUSH_TOKEN,
      STORAGE_KEYS.BIOMETRIA_ATIVADA,
      STORAGE_KEYS.BIOMETRIA_USUARIO,
    ]),
    SecureStore.deleteItemAsync(CHAVE_SESSAO_PROTEGIDA),
  ]);
}
