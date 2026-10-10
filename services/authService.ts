import { ApiError, api } from './api/httpClient';
import type { RegistrarPayload, Sessao } from '../context/AuthContext';
export type StatusPendenciaSocial = 'CADASTRO_NECESSARIO' | 'VINCULO_NECESSARIO' | 'EMAIL_EM_USO';

/** Corpo do 409 de /auth/social-login: o token do Google é válido, mas ainda não há conta VetSync vinculada. */
export interface PendenciaSocial {
  status: StatusPendenciaSocial;
  provider: string;
  email: string | null;
  emailVerificado: boolean;
  nome: string | null;
}

export type ResultadoLoginSocial =
  | { tipo: 'SESSAO'; sessao: Sessao }
  | { tipo: 'PENDENTE'; pendencia: PendenciaSocial };

export interface RegistrarGooglePayload {
  idToken: string;
  nome?: string;
  cpf: string;
  telefone?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  sessaoVinculo: string;
}

const STATUS_PENDENCIA: readonly string[] = [
  'CADASTRO_NECESSARIO',
  'VINCULO_NECESSARIO',
  'EMAIL_EM_USO',
];

/** Reconhece o 409 "token válido, mas sem vínculo"; qualquer outro erro (inclusive outros 409) retorna null. */
export function extrairPendenciaSocial(erro: unknown): PendenciaSocial | null {
  if (!(erro instanceof ApiError) || erro.status !== 409) return null;
  const corpo = erro.corpo as Partial<PendenciaSocial> | null | undefined;
  if (!corpo || typeof corpo !== 'object') return null;
  if (typeof corpo.status !== 'string' || !STATUS_PENDENCIA.includes(corpo.status)) return null;
  return {
    status: corpo.status as StatusPendenciaSocial,
    provider: typeof corpo.provider === 'string' ? corpo.provider : 'GOOGLE',
    email: typeof corpo.email === 'string' ? corpo.email : null,
    emailVerificado: corpo.emailVerificado === true,
    nome: typeof corpo.nome === 'string' ? corpo.nome : null,
  };
}

export const authService = {
  async login(email: string, senha: string): Promise<Sessao> {
    try {
      return await api.post<Sessao>(
        '/auth/login',
        { email: email.trim().toLowerCase(), senha },
        false,
      );
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 404) {
        throw new ApiError(404, 'Usuário não encontrado.', erro.tipo, erro.campos);
      }
      throw erro;
    }
  },

  // ---- Fluxo "Esqueci minha senha" ----
  /** Passo 1: se o e-mail estiver cadastrado, envia um código de 6 dígitos por e-mail (válido por 15 min). */
  async esqueciSenha(email: string): Promise<{ mensagem: string }> {
    return api.post<{ mensagem: string }>(
      '/auth/esqueci-senha',
      { email: email.trim().toLowerCase() },
      false,
    );
  },

  /** Passo 2 (opcional): confere se o código digitado ainda é válido, sem gastar a tentativa de redefinição. */
  async validarCodigo(email: string, codigo: string): Promise<{ valido: boolean }> {
    return api.post<{ valido: boolean }>(
      '/auth/validar-codigo',
      { email: email.trim().toLowerCase(), codigo: codigo.trim() },
      false,
    );
  },

  /** Passo 3: confere o código novamente e efetiva a nova senha. */
  async redefinirSenha(
    email: string,
    codigo: string,
    novaSenha: string,
    confirmarSenha: string,
  ): Promise<{ mensagem: string }> {
    return api.post<{ mensagem: string }>(
      '/auth/redefinir-senha',
      { email: email.trim().toLowerCase(), codigo: codigo.trim(), novaSenha, confirmarSenha },
      false,
    );
  },

  async registrar(dados: RegistrarPayload): Promise<Sessao> {
    return api.post<Sessao>(
      '/auth/registrar',
      { ...dados, email: dados.email.trim().toLowerCase() },
      false,
    );
  },

  // ---- Login com Google (o backend valida o id_token; o app nunca envia e-mail/nome como prova) ----
  /** 200 = sessão VetSync; 409 com status = Google válido, mas falta cadastrar ou vincular a conta. */
  async loginComGoogle(idToken: string): Promise<ResultadoLoginSocial> {
    try {
      const sessao = await api.post<Sessao>(
        '/auth/social-login',
        { provider: 'GOOGLE', idToken },
        false,
      );
      return { tipo: 'SESSAO', sessao };
    } catch (erro) {
      const pendencia = extrairPendenciaSocial(erro);
      if (pendencia) return { tipo: 'PENDENTE', pendencia };
      throw erro;
    }
  },

  /** Cria o tutor a partir do Google. E-mail e identidade vêm do token validado no servidor. */
  async registrarComGoogle(dados: RegistrarGooglePayload): Promise<Sessao> {
    return api.post<Sessao>('/auth/social-registrar', { provider: 'GOOGLE', ...dados }, false);
  },

  /** Vincula o Google a uma conta existente; a senha comprova que a conta é de quem está vinculando. */
  async vincularGoogle(idToken: string, email: string, senha: string): Promise<Sessao> {
    return api.post<Sessao>(
      '/auth/social-vincular',
      { provider: 'GOOGLE', idToken, email: email.trim().toLowerCase(), senha },
      false,
    );
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
