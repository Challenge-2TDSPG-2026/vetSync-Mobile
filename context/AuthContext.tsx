import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { STORAGE_KEYS } from '../constants';
import { ApiError } from '../services/api/httpClient';
import { authService } from '../services/authService';

export type Perfil = 'TUTOR' | 'VETERINARIO' | 'ADMIN';

export interface Sessao {
  token: string;
  idUsuario: number;
  email: string;
  nome: string;
  perfil: Perfil;
}

interface RegistrarPayload {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone?: string;
}

type AuthContextValue = {
  sessao: Sessao | null;
  autenticado: boolean;
  carregando: boolean;
  erro: string | null;
  login: (email: string, senha: string) => Promise<void>;
  registrar: (dados: RegistrarPayload) => Promise<void>;
  logout: () => Promise<void>;
  limparErro: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function salvarSessao(sessao: Sessao): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify(sessao));
}

async function carregarSessaoSalva(): Promise<Sessao | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSAO);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Sessao;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function restaurarSessao() {
      const salva = await carregarSessaoSalva();
      setSessao(salva);
      setCarregando(false);
    }
    restaurarSessao();
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    setErro(null);
    try {
      const resposta = await authService.login(email, senha);
      await salvarSessao(resposta);
      setSessao(resposta);
    } catch (e) {
      const mensagem = e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.';
      setErro(mensagem);
      throw e;
    }
  }, []);

  const registrar = useCallback(async (dados: RegistrarPayload) => {
    setErro(null);
    try {
      const resposta = await authService.registrar(dados);
      await salvarSessao(resposta);
      setSessao(resposta);
    } catch (e) {
      const mensagem = e instanceof ApiError ? e.message : 'Não foi possível criar sua conta. Tente novamente.';
      setErro(mensagem);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    // 1. Limpa sessão local e notifica o app imediatamente
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
    setSessao(null);
    // 2. Limpa cache do React Query
    queryClient.clear();
    // 3. Notifica backend em segundo plano (não trava a saída do usuário)
    authService.logout().catch(() => {});
  }, [queryClient]);

  const limparErro = useCallback(() => setErro(null), []);

  return (
    <AuthContext.Provider
      value={{
        sessao,
        autenticado: sessao !== null,
        carregando,
        erro,
        login,
        registrar,
        logout,
        limparErro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() deve ser usado dentro de <AuthProvider>');
  return ctx;
}