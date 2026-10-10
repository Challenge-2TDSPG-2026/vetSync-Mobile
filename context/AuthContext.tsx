import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../services/api/httpClient';
import {
  authService,
  type PendenciaSocial,
  type RegistrarGooglePayload,
} from '../services/authService';
import { assinarExpiracaoSessao } from '../services/api/sessionEvents';
import {
  ativarBiometria,
  desativarBiometria,
  EstadoBiometria,
  limparSessaoPersistida,
  marcarConviteBiometriaComoVisto,
  obterEstadoBiometria,
  restaurarSessaoPersistida,
  salvarSessaoAposLogin,
  SessaoProtegida,
} from '../services/biometriaService';

export type Perfil = 'TUTOR' | 'VETERINARIO' | 'ADMIN';

export interface Sessao extends SessaoProtegida {
  perfil: Perfil;
  temVinculoAtivo: boolean;
}

export interface RegistrarPayload {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  sessaoVinculo?: string;
}

const ESTADO_BIOMETRIA_INICIAL: EstadoBiometria = {
  ativada: false,
  disponivel: false,
  nome: 'biometria',
  convitePendente: false,
};

type AuthContextValue = {
  sessao: Sessao | null;
  autenticado: boolean;
  carregando: boolean;
  erro: string | null;
  biometria: EstadoBiometria;
  login: (email: string, senha: string) => Promise<void>;
  entrarComBiometria: () => Promise<void>;
  ativarLoginBiometrico: () => Promise<void>;
  desativarLoginBiometrico: () => Promise<void>;
  dispensarConviteBiometria: () => Promise<void>;
  atualizarBiometria: () => Promise<void>;
  registrar: (dados: RegistrarPayload) => Promise<void>;
  /** Devolve a pendência (cadastrar/vincular) ou null quando a sessão já foi iniciada. */
  loginComGoogle: (idToken: string) => Promise<PendenciaSocial | null>;
  registrarComGoogle: (dados: RegistrarGooglePayload) => Promise<void>;
  vincularGoogle: (idToken: string, email: string, senha: string) => Promise<void>;
  atualizarVinculoClinica: (temVinculoAtivo: boolean) => Promise<void>;
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
    (candidata.perfil === 'TUTOR' ||
      candidata.perfil === 'VETERINARIO' ||
      candidata.perfil === 'ADMIN') &&
    typeof candidata.temVinculoAtivo === 'boolean'
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [biometria, setBiometria] = useState<EstadoBiometria>(ESTADO_BIOMETRIA_INICIAL);
  const encerrandoSessao = React.useRef<Promise<void> | null>(null);

  const atualizarEstadoBiometria = useCallback(async (idUsuario?: number) => {
    const estado = await obterEstadoBiometria(idUsuario);
    setBiometria(estado);
    return estado;
  }, []);

  useEffect(() => {
    async function restaurarSessao() {
      try {
        const salva = await restaurarSessaoPersistida();
        const sessaoRestaurada = validarSessao(salva) ? salva : null;
        setSessao(sessaoRestaurada);
        await atualizarEstadoBiometria(sessaoRestaurada?.idUsuario);
      } catch {
        setSessao(null);
        setErro('Não foi possível restaurar sua sessão. Entre novamente.');
        await atualizarEstadoBiometria();
      } finally {
        setCarregando(false);
      }
    }
    void restaurarSessao();
  }, [atualizarEstadoBiometria]);

  const encerrarSessaoLocal = useCallback(async () => {
    if (encerrandoSessao.current) return encerrandoSessao.current;
    const encerramento = (async () => {
      try {
        await limparSessaoPersistida();
        setSessao(null);
        queryClient.clear();
        await atualizarEstadoBiometria();
      } finally {
        encerrandoSessao.current = null;
      }
    })();
    encerrandoSessao.current = encerramento;
    return encerramento;
  }, [atualizarEstadoBiometria, queryClient]);

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
      await salvarSessaoAposLogin(resposta);
      setSessao(resposta);
      await atualizarEstadoBiometria(resposta.idUsuario);
    } catch (e) {
      const mensagem =
        e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.';
      setErro(mensagem);
      throw e;
    }
  }, [atualizarEstadoBiometria]);

  const entrarComBiometria = useCallback(async () => {
    setErro(null);
    const salva = await restaurarSessaoPersistida();
    if (!validarSessao(salva)) {
      throw new Error('Não foi possível confirmar sua biometria. Entre com e-mail e senha.');
    }
    setSessao(salva);
    await atualizarEstadoBiometria(salva.idUsuario);
  }, [atualizarEstadoBiometria]);

  const ativarLoginBiometrico = useCallback(async () => {
    if (!sessao) throw new Error('Entre na sua conta para ativar a biometria.');
    await ativarBiometria(sessao);
    await atualizarEstadoBiometria(sessao.idUsuario);
  }, [atualizarEstadoBiometria, sessao]);

  const desativarLoginBiometrico = useCallback(async () => {
    if (!sessao) throw new Error('Entre na sua conta para desativar a biometria.');
    await desativarBiometria(sessao);
    await atualizarEstadoBiometria(sessao.idUsuario);
  }, [atualizarEstadoBiometria, sessao]);

  const dispensarConviteBiometria = useCallback(async () => {
    if (!sessao) return;
    await marcarConviteBiometriaComoVisto(sessao.idUsuario);
    await atualizarEstadoBiometria(sessao.idUsuario);
  }, [atualizarEstadoBiometria, sessao]);

  const registrar = useCallback(async (dados: RegistrarPayload) => {
    setErro(null);
    try {
      const resposta = await authService.registrar(dados);
      await salvarSessaoAposLogin(resposta);
      setSessao(resposta);
      await atualizarEstadoBiometria();
    } catch (e) {
      const mensagem =
        e instanceof ApiError ? e.message : 'Não foi possível criar sua conta. Tente novamente.';
      setErro(mensagem);
      throw e;
    }
  }, [atualizarEstadoBiometria]);

  const iniciarSessaoSocial = useCallback(async (resposta: Sessao) => {
    await salvarSessaoAposLogin(resposta);
    setSessao(resposta);
    await atualizarEstadoBiometria(resposta.idUsuario);
  }, [atualizarEstadoBiometria]);

  const loginComGoogle = useCallback(async (idToken: string): Promise<PendenciaSocial | null> => {
    setErro(null);
    try {
      const resultado = await authService.loginComGoogle(idToken);
      if (resultado.tipo === 'PENDENTE') return resultado.pendencia;
      await iniciarSessaoSocial(resultado.sessao);
      return null;
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível entrar com o Google. Tente novamente.');
      throw e;
    }
  }, [iniciarSessaoSocial]);

  const registrarComGoogle = useCallback(async (dados: RegistrarGooglePayload) => {
    setErro(null);
    try {
      await iniciarSessaoSocial(await authService.registrarComGoogle(dados));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível criar sua conta. Tente novamente.');
      throw e;
    }
  }, [iniciarSessaoSocial]);

  const vincularGoogle = useCallback(async (idToken: string, email: string, senha: string) => {
    setErro(null);
    try {
      await iniciarSessaoSocial(await authService.vincularGoogle(idToken, email, senha));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível vincular o Google. Tente novamente.');
      throw e;
    }
  }, [iniciarSessaoSocial]);

  const atualizarVinculoClinica = useCallback(async (temVinculoAtivo: boolean) => { if (!sessao) return; const atualizada = { ...sessao, temVinculoAtivo }; await salvarSessaoAposLogin(atualizada); setSessao(atualizada); }, [sessao]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (erroLogout) {
      console.warn('Não foi possível invalidar a sessão no servidor.', erroLogout);
    } finally {
      await encerrarSessaoLocal();
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
        biometria,
        login,
        entrarComBiometria,
        ativarLoginBiometrico,
        desativarLoginBiometrico,
        dispensarConviteBiometria,
        atualizarBiometria: async () => {
          await atualizarEstadoBiometria(sessao?.idUsuario);
        },
        registrar,
        loginComGoogle,
        registrarComGoogle,
        vincularGoogle,
        atualizarVinculoClinica,
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
