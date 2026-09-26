import { api } from './api/httpClient';
import type { Sessao } from '../context/AuthContext';
 
interface RegistrarPayload {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone?: string;
}
export const authService = {
  async login(email: string, senha: string): Promise<Sessao> {
    return api.post<Sessao>('/auth/login', { email: email.trim().toLowerCase(), senha }, false);
  },
 
  // ---- Fluxo "Esqueci minha senha" ----
  /** Passo 1: se o e-mail estiver cadastrado, envia um código de 6 dígitos por e-mail (válido por 15 min). */
  async esqueciSenha(email: string): Promise<{ mensagem: string }> {
    return api.post<{ mensagem: string }>(
      '/auth/esqueci-senha',
      { email: email.trim().toLowerCase() },
      false
    );
  },
 
  /** Passo 2 (opcional): confere se o código digitado ainda é válido, sem gastar a tentativa de redefinição. */
  async validarCodigo(email: string, codigo: string): Promise<{ valido: boolean }> {
    return api.post<{ valido: boolean }>(
      '/auth/validar-codigo',
      { email: email.trim().toLowerCase(), codigo: codigo.trim() },
      false
    );
  },
 
  /** Passo 3: confere o código novamente e efetiva a nova senha. */
  async redefinirSenha(
    email: string,
    codigo: string,
    novaSenha: string,
    confirmarSenha: string
  ): Promise<{ mensagem: string }> {
    return api.post<{ mensagem: string }>(
      '/auth/redefinir-senha',
      { email: email.trim().toLowerCase(), codigo: codigo.trim(), novaSenha, confirmarSenha },
      false
    );
  },
 
  async registrar(dados: RegistrarPayload): Promise<Sessao> {
    return api.post<Sessao>(
      '/auth/registrar',
      { ...dados, email: dados.email.trim().toLowerCase() },
      false
    );
  },
 
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};