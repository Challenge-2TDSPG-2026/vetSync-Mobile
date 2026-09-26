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

  async solicitarRecuperacaoSenha(email: string): Promise<void> {
    await api.post('/auth/recuperar-senha', { email: email.trim().toLowerCase() }, false);
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