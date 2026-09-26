import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { STORAGE_KEYS } from '../constants';
import { ApiError } from '../services/api/httpClient';
import { authService } from '../services/authService';
import { assinarExpiracaoSessao } from '../services/api/sessionEvents';

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

export function validarSessao(valor: unknown): valor is Sessao {
  if (!valor || typeof valor !== 'object') return false;
  const candidata = valor as Partial<Sessao>;
  return (
    typeof candidata.token === 'string' &&
    candidata.token.trim().length > 0 &&
    typeof candidata.idUsuario === 'number' &&
    Number.isInteger(candidata.idUsuario) &&
    candidata.idUsuario > 0 &&
    typeof candidata.email === 'string' &&
    candidata.email.trim().length > 0 &&
    typeof candidata.nome === 'string' &&
    candidata.nome.trim().length > 0 &&
    (candidata.perfil === 'TUTOR' || candidata.perfil === 'VETERINARIO' || candidata.perfil === 'ADMIN')
  );
}

async function salvarSessao(sessao: Sessao): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify(sessao));
}

async function carregarSessaoSalva(): Promise<Sessao | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSAO);
  if (!raw) return null;
  let sessao: unknown;
  try {
    sessao = JSON.parse(raw) as unknown;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
    return null;
  }
  if (!validarSessao(sessao)) {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
    return null;
  }
  return sessao;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const encerrandoSessao = React.useRef<Promise<void> | null>(null);

  useEffect(() => {
    async function restaurarSessao() {
      try {
        const salva = await carregarSessaoSalva();
        setSessao(salva);
      } catch {
        setSessao(null);
        setErro('Não foi possível restaurar sua sessão. Entre novamente.');
      } finally {
        setCarregando(false);
      }
    }
    void restaurarSessao();
  }, []);

  const encerrarSessaoLocal = useCallback(async () => {
    if (encerrandoSessao.current) return encerrandoSessao.current;
    const encerramento = (async () => {
      try {
        await AsyncStorage.multiRemove([STORAGE_KEYS.SESSAO, STORAGE_KEYS.PUSH_TOKEN]);
        setSessao(null);
        queryClient.clear();
      } finally {
        encerrandoSessao.current = null;
      }
    })();
    encerrandoSessao.current = encerramento;
    return encerramento;
  }, [queryClient]);

  useEffect(() => {
    return assinarExpiracaoSessao(() => {
      void encerrarSessaoLocal().catch(() => {
        setErro('Não foi possível encerrar sua sessão. Tente novamente.');
      });
    });
  }, [encerrarSessaoLocal]);

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
    await encerrarSessaoLocal();
    try {
      await authService.logout();
    } catch (erro) {
      console.warn('Não foi possível invalidar a sessão no servidor.', erro);
    }
  }, [encerrarSessaoLocal]);

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
