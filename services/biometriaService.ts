import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants';

// Sessão protegida por biometria (exige autenticação a cada leitura).
const CHAVE_SESSAO_PROTEGIDA = 'vetsync.sessao_protegida';
// Sessão "comum": também fica no armazenamento seguro do aparelho (Keychain/Keystore), só que
// sem exigir biometria. Chaves separadas evitam regravar um item protegido com opções diferentes.
const CHAVE_SESSAO_SEGURA = 'vetsync.sessao';

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

const ehWeb = () => Platform.OS === 'web';

/**
 * Apaga uma chave do SecureStore sem nunca lançar. Na web o módulo não existe (o logout não pode
 * quebrar por isso) e, no nativo, apagar uma chave inexistente também não deve travar a limpeza.
 */
async function excluirDoSecureStore(chave: string): Promise<void> {
  if (ehWeb()) return;
  try {
    await SecureStore.deleteItemAsync(chave);
  } catch {
    // Nada a fazer: o objetivo é só garantir que a chave não exista mais.
  }
}

/** Remove a sessão "comum" de qualquer lugar onde ela possa estar (seguro e legado). */
async function removerSessaoSimples(): Promise<void> {
  await Promise.all([
    excluirDoSecureStore(CHAVE_SESSAO_SEGURA),
    AsyncStorage.removeItem(STORAGE_KEYS.SESSAO),
  ]);
}

/**
 * Versões antigas guardavam o token em texto puro no AsyncStorage. Ao encontrar essa sessão no
 * nativo, move para o SecureStore e apaga a cópia antiga. Se não der para migrar agora, mantém a
 * cópia antiga (e a sessão do usuário) até a próxima abertura do app.
 */
async function migrarSessaoLegada(): Promise<string | null> {
  const legado = await AsyncStorage.getItem(STORAGE_KEYS.SESSAO);
  if (!legado) return null;
  try {
    await SecureStore.setItemAsync(CHAVE_SESSAO_SEGURA, legado);
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
  } catch {
    // Migra na próxima vez.
  }
  return legado;
}

async function lerSessaoSimples(): Promise<string | null> {
  if (ehWeb()) return AsyncStorage.getItem(STORAGE_KEYS.SESSAO);
  try {
    const valor = await SecureStore.getItemAsync(CHAVE_SESSAO_SEGURA);
    if (valor) return valor;
  } catch {
    // Segue para a migração: pode haver uma sessão antiga no AsyncStorage.
  }
  return migrarSessaoLegada();
}

async function gravarSessaoSimples(sessao: SessaoProtegida): Promise<void> {
  const json = JSON.stringify(sessao);
  if (ehWeb()) {
    // Web não tem armazenamento seguro; o AsyncStorage (localStorage) é o que existe.
    await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, json);
    return;
  }
  try {
    await SecureStore.setItemAsync(CHAVE_SESSAO_SEGURA, json);
  } catch {
    // Sem armazenamento seguro não caímos para texto puro: a sessão vale só até fechar o app.
  }
  await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
}

async function salvarSessaoComSenha(sessao: SessaoProtegida): Promise<void> {
  await gravarSessaoSimples(sessao);
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
    await removerSessaoSimples();
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

  const valor = await lerSessaoSimples();
  if (!valor) return null;
  try {
    const sessao: unknown = JSON.parse(valor);
    if (!validarSessaoProtegida(sessao)) {
      await removerSessaoSimples();
      return null;
    }
    definirSessaoEmMemoria(sessao);
    return sessao;
  } catch {
    await removerSessaoSimples();
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
    await removerSessaoSimples();
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
    excluirDoSecureStore(CHAVE_SESSAO_PROTEGIDA),
    excluirDoSecureStore(CHAVE_SESSAO_SEGURA),
  ]);
}