import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../../constants/api';
import { STORAGE_KEYS } from '../../constants';
import { notificarExpiracaoSessao } from './sessionEvents';

export type TipoErroApi = 'sem-internet' | 'servidor-indisponivel' | 'timeout' | 'http';

export class ApiError extends Error {
  status: number;
  tipo: TipoErroApi;
  campos?: Record<string, string>;

  constructor(status: number, mensagem: string, tipo: TipoErroApi = 'http', campos?: Record<string, string>) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.tipo = tipo;
    this.campos = campos;
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method: Metodo;
  path: string;
  body?: unknown;
  autenticado?: boolean;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface ArquivoUpload {
  uri: string;
  nome: string;
  tipoMime: string;
}

async function obterToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSAO);
  if (!raw) return null;
  try {
    const sessao = JSON.parse(raw);
    return sessao?.token ?? null;
  } catch {
    return null;
  }
}

/** Mensagens padrão por status HTTP, usadas só quando o corpo da resposta não traz uma mensagem própria. */
const MENSAGEM_PADRAO_POR_STATUS: Record<number, string> = {
  400: 'Não foi possível processar os dados enviados. Verifique as informações e tente novamente.',
  401: 'E-mail ou senha inválidos.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Não encontramos o que você está procurando.',
  409: 'Já existe um registro com esses dados.',
  422: 'Alguns dos dados enviados são inválidos. Verifique e tente novamente.',
  429: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.',
};

function mensagemPadraoPorStatus(status: number): string {
  if (MENSAGEM_PADRAO_POR_STATUS[status]) return MENSAGEM_PADRAO_POR_STATUS[status];
  if (status >= 500) return 'O servidor encontrou um problema ao processar sua solicitação. Tente novamente em instantes.';
  return 'Não foi possível completar a solicitação. Tente novamente.';
}

function extrairErro(status: number, corpo: any): ApiError {
  if (corpo && typeof corpo === 'object') {
    if (corpo.campos && typeof corpo.campos === 'object') {
      const primeiraMsg = Object.values(corpo.campos)[0];
      return new ApiError(
        status,
        typeof primeiraMsg === 'string' ? primeiraMsg : mensagemPadraoPorStatus(status),
        'http',
        corpo.campos
      );
    }
    if (typeof corpo.mensagem === 'string') {
      return new ApiError(status, corpo.mensagem, 'http');
    }
    if (typeof corpo.detail === 'string') {
      return new ApiError(status, corpo.detail, 'http');
    }
  }
  return new ApiError(status, mensagemPadraoPorStatus(status), 'http');
}

async function interpretarResposta<T>(resposta: Response, autenticado: boolean): Promise<T> {
  if (resposta.status === 204) return undefined as T;

  const texto = await resposta.text();
  let corpo: unknown = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    corpo = texto;
  }

  if (resposta.status === 401 && autenticado) {
    notificarExpiracaoSessao();
    throw new ApiError(401, 'Sua sessão expirou. Entre novamente.', 'http');
  }

  if (!resposta.ok) throw extrairErro(resposta.status, corpo);
  return corpo as T;
}

/**
 * Quando o fetch falha sem chegar a uma resposta HTTP, checa o estado real de conexão do
 * aparelho pra não confundir "sem internet" com "servidor fora do ar" na mensagem exibida.
 */
async function erroDeConexao(mensagemSemInternet: string, mensagemServidorIndisponivel: string): Promise<ApiError> {
  try {
    const estado = await NetInfo.fetch();
    if (estado.isConnected === false || estado.isInternetReachable === false) {
      return new ApiError(0, mensagemSemInternet, 'sem-internet');
    }
  } catch {
    // Se nem o próprio NetInfo responder, seguimos com o diagnóstico de servidor indisponível.
  }
  return new ApiError(0, mensagemServidorIndisponivel, 'servidor-indisponivel');
}

export async function apiRequest<T = unknown>({
  method,
  path,
  body,
  autenticado = true,
  baseUrl = API_BASE_URL,
  timeoutMs = 60_000,
}: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (autenticado) {
    const token = await obterToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let resposta: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    resposta = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'AbortError') {
      throw new ApiError(0, 'A solicitação demorou mais que o esperado. Tente novamente.', 'timeout');
    }
    throw await erroDeConexao(
      'Você está sem conexão com a internet. Verifique o Wi-Fi ou os dados móveis e tente novamente.',
      'Não foi possível conectar ao servidor. Tente novamente em instantes.'
    );
  } finally {
    clearTimeout(timeout);
  }

  return interpretarResposta<T>(resposta, autenticado);
}

async function uploadMultipart<T>(path: string, arquivo: ArquivoUpload, autenticado = true): Promise<T> {
  const headers: Record<string, string> = {};
  if (autenticado) {
    const token = await obterToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let resposta: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const formData = new FormData();
    if (typeof window !== 'undefined') {
      const arquivoResposta = await fetch(arquivo.uri);
      const blob = await arquivoResposta.blob();
      formData.append('foto', blob, arquivo.nome);
    } else {
      formData.append('foto', {
        uri: arquivo.uri,
        name: arquivo.nome,
        type: arquivo.tipoMime,
      } as unknown as Blob);
    }

    resposta = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'AbortError') {
      throw new ApiError(0, 'O envio da foto demorou mais que o esperado. Tente novamente.', 'timeout');
    }
    throw await erroDeConexao(
      'Você está sem conexão com a internet. Verifique sua conexão para enviar a foto.',
      'Não foi possível enviar a foto porque o servidor não respondeu. Tente novamente em instantes.'
    );
  } finally {
    clearTimeout(timeout);
  }

  return interpretarResposta<T>(resposta, autenticado);
}

export const api = {
  get: <T>(path: string, autenticado = true) => apiRequest<T>({ method: 'GET', path, autenticado }),
  post: <T>(path: string, body?: unknown, autenticado = true) =>
    apiRequest<T>({ method: 'POST', path, body, autenticado }),
  put: <T>(path: string, body?: unknown, autenticado = true) =>
    apiRequest<T>({ method: 'PUT', path, body, autenticado }),
  patch: <T>(path: string, body?: unknown, autenticado = true) =>
    apiRequest<T>({ method: 'PATCH', path, body, autenticado }),
  delete: <T = void>(path: string, autenticado = true) =>
    apiRequest<T>({ method: 'DELETE', path, autenticado }),
  uploadMultipart,
};