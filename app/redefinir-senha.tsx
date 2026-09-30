import React, { useMemo, useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ApiError } from '../services/api/httpClient';
import { authService } from '../services/authService';
import { mensagemDeErro } from '../services/api/errorMessages';
import { mostrarToast } from '../components/ui/Toast';
import { AppIcon } from '../components/AppIcon';
import { AuthField } from '../components/ui/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { AppTheme } from '../constants/theme';

export default function RedefinirSenhaScreen() {
  const router = useRouter();
  const { email: emailParam, codigo: codigoParam } = useLocalSearchParams<{ email?: string; codigo?: string }>();
  const email = (emailParam ?? '').trim().toLowerCase();
  const codigo = (codigoParam ?? '').trim();
  const { theme } = useTheme();
  const { sessao, logout } = useAuth();
  const s = useMemo(() => createStyles(theme), [theme]);

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!novaSenha.trim() || novaSenha.length < 8) {
      e.novaSenha = 'A senha deve ter no mínimo 8 caracteres';
    } else if (!/[A-Za-z]/.test(novaSenha) || !/\d/.test(novaSenha)) {
      e.novaSenha = 'Use pelo menos uma letra e um número';
    }
    if (novaSenha !== confirmarSenha) {
      e.confirmarSenha = 'As senhas não coincidem';
    }
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleRedefinir() {
    if (!validar()) return;
    setSalvando(true);
    try {
      await authService.redefinirSenha(email, codigo, novaSenha, confirmarSenha);
      if (sessao?.email.trim().toLowerCase() === email) {
        await logout();
      }
      mostrarToast('sucesso', 'Senha redefinida', 'Entre novamente com sua nova senha.');
      router.replace('/login');
    } catch (e) {
      if (e instanceof ApiError && e.campos) {
        setErros(prev => ({ ...prev, ...e.campos }));
      }
      mostrarToast('erro', 'Não foi possível redefinir a senha', mensagemDeErro(e, 'Verifique os dados e tente novamente.'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AuthLayout
      title="Defina uma nova senha."
      subtitle="Escolha uma senha forte, com pelo menos 8 caracteres, incluindo letra e número."
    >
      <AuthField
        label="Nova senha"
        icon="lock-closed-outline"
        value={novaSenha}
        onChangeText={(valor: string) => { setNovaSenha(valor); setErros(prev => ({ ...prev, novaSenha: '' })); }}
        placeholder="Mínimo de 8 caracteres, com letra e número"
        isPassword
        showPassword={mostrarSenha}
        onTogglePassword={() => setMostrarSenha(v => !v)}
        error={erros.novaSenha}
      />

      <AuthField
        label="Confirmar nova senha"
        icon="lock-closed-outline"
        value={confirmarSenha}
        onChangeText={(valor: string) => { setConfirmarSenha(valor); setErros(prev => ({ ...prev, confirmarSenha: '' })); }}
        placeholder="Repita a senha"
        isPassword
        showPassword={mostrarConfirmarSenha}
        onTogglePassword={() => setMostrarConfirmarSenha(v => !v)}
        error={erros.confirmarSenha}
      />

      <Pressable
        style={({ pressed }) => [s.btnAuth, pressed && s.btnAuthPressed, salvando && s.btnDisabled]}
        onPress={handleRedefinir}
        disabled={salvando}
        accessibilityRole="button"
        accessibilityLabel={salvando ? 'Salvando' : 'Salvar nova senha'}
        accessibilityState={{ disabled: salvando, busy: salvando }}
      >
        <Text style={s.btnAuthText}>{salvando ? 'Salvando...' : 'Salvar nova senha'}</Text>
        {!salvando && <AppIcon name="checkmark" set="Ionicons" size={18} color={theme.colors.onPrimary} />}
      </Pressable>
    </AuthLayout>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    btnAuth: {
      flexDirection: 'row', gap: 8, backgroundColor: theme.colors.primary, paddingVertical: 19,
      borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 10,
    },
    btnAuthPressed: { opacity: 0.86 },
    btnDisabled: { opacity: 0.65 },
    btnAuthText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '700' },
  });
}