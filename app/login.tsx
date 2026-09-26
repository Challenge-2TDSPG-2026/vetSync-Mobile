import React, { useMemo, useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api/httpClient';
import { mensagemDeErro } from '../services/api/errorMessages';
import { mostrarToast } from '../components/ui/Toast';
import { AppIcon } from '../components/AppIcon';
import { AuthField } from '../components/ui/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme } from '../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [errosConta, setErrosConta] = useState<Record<string, string>>({});
  const [autenticando, setAutenticando] = useState(false);

  function validarConta(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) e.email = 'E-mail inválido';
    if (!senha.trim()) e.senha = 'Informe sua senha';
    setErrosConta(e);
    return Object.keys(e).length === 0;
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

  return (
    <AuthLayout
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

  linkSecundario: { marginTop: 'auto', paddingTop: 22, alignItems: 'center', paddingBottom: 4 },
  linkSecundarioTexto: { fontSize: 13, color: theme.colors.textSecondary },
  linkSecundarioDestaque: { color: theme.colors.primary, fontWeight: '700' },
  linkRecuperacao: { marginTop: 18, alignItems: 'center' },
  linkRecuperacaoTexto: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },
  });
}