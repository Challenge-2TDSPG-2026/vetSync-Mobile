import React, { useMemo, useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api/httpClient';
import { mensagemDeErro } from '../services/api/errorMessages';
import { mostrarToast } from '../components/ui/Toast';
import { AppIcon } from '../components/AppIcon';
import { AuthField } from '../components/ui/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { BotaoGoogle } from '../components/auth/BotaoGoogle';
import { VincularGoogleCard } from '../components/auth/VincularGoogleCard';
import { googlePendente } from '../services/googlePendente';
import { destinoDaPendencia, erroDeTokenGoogle } from '../utils/loginSocial';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme } from '../constants/theme';

export default function LoginScreen() {
  const { biometria, entrarComBiometria, login, loginComGoogle, vincularGoogle } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [errosConta, setErrosConta] = useState<Record<string, string>>({});
  const [autenticando, setAutenticando] = useState(false);
  const [vinculoGoogle, setVinculoGoogle] = useState<{ idToken: string; email: string } | null>(null);

  function validarConta(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) e.email = 'E-mail inválido';
    if (!senha.trim()) e.senha = 'Informe sua senha';
    setErrosConta(e);
    return Object.keys(e).length === 0;
  }

  async function handleEntrarComBiometria() {
    setAutenticando(true);
    try {
      await entrarComBiometria();
      mostrarToast('sucesso', 'Login realizado');
    } catch (e) {
      mostrarToast('erro', 'Não foi possível entrar com biometria', mensagemDeErro(e, 'Use seu e-mail e senha.'));
    } finally {
      setAutenticando(false);
    }
  }

  async function handleEntrar() {
    if (!validarConta()) return;
    setAutenticando(true);
    try {
      await login(email, senha);
      mostrarToast('sucesso', 'Login realizado');
      // Navegação (para (tutor) ou (vet), conforme sessao.perfil) é reativa,
      // controlada pelo RootNavigator em app/_layout.tsx.
    } catch (e) {
      if (e instanceof ApiError && e.campos) {
        setErrosConta(prev => ({ ...prev, ...e.campos }));
      }
      mostrarToast('erro', 'Não foi possível entrar', mensagemDeErro(e, 'Verifique seu e-mail e senha.'));
    } finally {
      setAutenticando(false);
    }
  }

  async function handleGoogle(idToken: string) {
    setAutenticando(true);
    try {
      const pendencia = await loginComGoogle(idToken);
      if (!pendencia) {
        mostrarToast('sucesso', 'Login realizado');
        return; // a navegação é reativa (RootNavigator)
      }
      const destino = destinoDaPendencia(pendencia);
      if (destino.acao === 'CADASTRAR') {
        googlePendente.definir(idToken, pendencia);
        router.push({ pathname: '/vinculo-clinica', params: { origem: 'google' } });
      } else if (destino.acao === 'VINCULAR') {
        setVinculoGoogle({ idToken, email: pendencia.email ?? '' });
      } else {
        mostrarToast('erro', 'Não foi possível entrar com o Google', destino.mensagem);
      }
    } catch (e) {
      mostrarToast('erro', 'Não foi possível entrar com o Google', mensagemDeErro(e, 'Tente novamente.'));
    } finally {
      setAutenticando(false);
    }
  }

  async function handleVincularGoogle(emailConta: string, senhaConta: string) {
    if (!vinculoGoogle) return;
    setAutenticando(true);
    try {
      await vincularGoogle(vinculoGoogle.idToken, emailConta, senhaConta);
      mostrarToast('sucesso', 'Google vinculado', 'Da próxima vez é só continuar com o Google.');
    } catch (e) {
      if (erroDeTokenGoogle(e)) {
        setVinculoGoogle(null);
        mostrarToast('erro', 'Sua confirmação do Google expirou', 'Entre com o Google novamente.');
      } else {
        mostrarToast('erro', 'Não foi possível vincular o Google', mensagemDeErro(e, 'Verifique seu e-mail e senha.'));
      }
    } finally {
      setAutenticando(false);
    }
  }

  if (vinculoGoogle) {
    return (
      <AuthLayout
        permitirCapturaDeTela
        title="Vincule sua conta."
        subtitle="Confirme que a conta VetSync é sua para usar o Google daqui para frente."
      >
        <VincularGoogleCard
          emailInicial={vinculoGoogle.email}
          enviando={autenticando}
          onConfirmar={(emailConta, senhaConta) => void handleVincularGoogle(emailConta, senhaConta)}
          onCancelar={() => setVinculoGoogle(null)}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout permitirCapturaDeTela
      title="Bem-vindo de volta."
      subtitle="Consultas, vacinas e lembretes do seu pet, sempre à mão."
    >
          <AuthField
            label="E-mail"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="username"
            autoComplete="username"
            error={errosConta.email}
          />

          <AuthField
            label="Senha"
            icon="lock-closed-outline"
            value={senha}
            onChangeText={setSenha}
            placeholder="••••••••"
            isPassword
            showPassword={mostrarSenha}
            onTogglePassword={() => setMostrarSenha(v => !v)}
            textContentType="password"
            autoComplete="password"
            error={errosConta.senha}
          />

          <Pressable
            style={({ pressed }) => [s.btnAuth, pressed && s.btnAuthPressed, autenticando && { opacity: 0.65 }]}
            onPress={handleEntrar}
            disabled={autenticando}
            accessibilityRole="button"
            accessibilityLabel={autenticando ? 'Entrando' : 'Entrar'}
            accessibilityState={{ disabled: autenticando, busy: autenticando }}
          >
            <Text style={s.btnAuthText}>{autenticando ? 'Entrando...' : 'Entrar'}</Text>
            {!autenticando && <AppIcon name="arrow-forward" set="Ionicons" size={18} color={theme.colors.onPrimary} />}
          </Pressable>

          {biometria.ativada ? (
            <Pressable
              style={({ pressed }) => [s.btnBiometria, pressed && s.btnAuthPressed, autenticando && { opacity: 0.65 }]}
              onPress={handleEntrarComBiometria}
              disabled={autenticando}
              accessibilityRole="button"
              accessibilityLabel={`Entrar com ${biometria.nome}`}
              accessibilityState={{ disabled: autenticando, busy: autenticando }}
            >
              <AppIcon name="finger-print-outline" set="Ionicons" size={19} color={theme.colors.primary} />
              <Text style={s.btnBiometriaText}>Entrar com {biometria.nome}</Text>
            </Pressable>
          ) : null}

          <BotaoGoogle
            desabilitado={autenticando}
            onIdToken={handleGoogle}
            onErro={(mensagem) => mostrarToast('erro', 'Não foi possível entrar com o Google', mensagem)}
          />

          <Link href="/esqueci-senha" asChild>
            <Pressable
              style={s.linkRecuperacao}
              disabled={autenticando}
              accessibilityRole="link"
              accessibilityLabel="Esqueci minha senha"
            >
              <Text style={s.linkRecuperacaoTexto}>Esqueci minha senha</Text>
            </Pressable>
          </Link>

          <Link href="/cadastro" asChild>
            <Pressable
              style={s.linkSecundario}
              disabled={autenticando}
              accessibilityRole="link"
              accessibilityLabel="Não tem conta? Cadastre-se"
            >
              <Text style={s.linkSecundarioTexto}>
                Não tem conta? <Text style={s.linkSecundarioDestaque}>Cadastre-se</Text>
              </Text>
            </Pressable>
          </Link>
    </AuthLayout>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  btnAuth: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 19,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: theme.colors.primary,
    shadowOpacity: theme.mode === 'dark' ? 0 : 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  btnAuthPressed: { opacity: 0.86 },
  btnAuthText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '700' },
  btnBiometria: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnBiometriaText: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },

  linkSecundario: { marginTop: 'auto', paddingTop: 22, alignItems: 'center', paddingBottom: 4 },
  linkSecundarioTexto: { fontSize: 13, color: theme.colors.textSecondary },
  linkSecundarioDestaque: { color: theme.colors.primary, fontWeight: '700' },
  linkRecuperacao: { marginTop: 18, alignItems: 'center' },
  linkRecuperacaoTexto: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },
  });
}