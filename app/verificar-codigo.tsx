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
import type { AppTheme } from '../constants/theme';

export default function VerificarCodigoScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = (emailParam ?? '').trim().toLowerCase();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string>();
  const [verificando, setVerificando] = useState(false);

  function validar(): boolean {
    const codigoLimpo = codigo.trim();
    const valido = /^\d{6}$/.test(codigoLimpo);
    setErro(valido ? undefined : 'Informe os 6 dígitos do código');
    return valido;
  }

  async function handleVerificar() {
    if (!validar()) return;
    setVerificando(true);
    try {
      const resposta = await authService.validarCodigo(email, codigo.trim());
      if (!resposta.valido) {
        setErro('Código inválido ou expirado');
        return;
      }
      router.replace({ pathname: '/redefinir-senha', params: { email, codigo: codigo.trim() } });
    } catch (e) {
      if (e instanceof ApiError && e.campos?.codigo) setErro(e.campos.codigo);
      mostrarToast(
        'erro',
        'Não foi possível verificar o código',
        mensagemDeErro(e, 'Verifique o código informado e tente novamente.')
      );
    } finally {
      setVerificando(false);
    }
  }

  return (
    <AuthLayout
      title="Confirme o código."
      subtitle={email ? `Enviamos 6 dígitos para ${email}.` : 'Digite o código de 6 dígitos que enviamos por e-mail.'}
    >
      <AuthField
        label="Código de verificação"
        icon="key-outline"
        value={codigo}
        onChangeText={(valor: string) => { setCodigo(valor.replace(/\D/g, '').slice(0, 6)); setErro(undefined); }}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        error={erro}
      />

      <Pressable
        style={({ pressed }) => [s.btnAuth, pressed && s.btnAuthPressed, verificando && s.btnDisabled]}
        onPress={handleVerificar}
        disabled={verificando}
        accessibilityRole="button"
        accessibilityLabel={verificando ? 'Verificando' : 'Confirmar código'}
        accessibilityState={{ disabled: verificando, busy: verificando }}
      >
        <Text style={s.btnAuthText}>{verificando ? 'Verificando...' : 'Confirmar código'}</Text>
        {!verificando && <AppIcon name="arrow-forward" set="Ionicons" size={18} color={theme.colors.onPrimary} />}
      </Pressable>

      <Pressable
        style={s.linkVoltar}
        onPress={() => router.replace({ pathname: '/esqueci-senha', params: { email } })}
        accessibilityRole="link"
        accessibilityLabel="Reenviar código"
      >
        <AppIcon name="refresh-outline" set="Ionicons" size={16} color={theme.colors.primary} />
        <Text style={s.linkVoltarTexto}>Não recebeu? Reenviar código</Text>
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
    linkVoltar: { marginTop: 'auto', paddingTop: 28, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    linkVoltarTexto: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },
  });
}