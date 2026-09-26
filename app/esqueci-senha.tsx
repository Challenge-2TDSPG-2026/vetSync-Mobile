import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { ApiError } from '../services/api/httpClient';
import { authService } from '../services/authService';
import { mensagemDeErro } from '../services/api/errorMessages';
import { mostrarToast } from '../components/ui/Toast';
import { AppIcon } from '../components/AppIcon';
import { AuthField } from '../components/ui/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme } from '../constants/theme';

export default function EsqueciSenhaScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function validar(): boolean {
    const emailNormalizado = email.trim();
    const emailValido = emailNormalizado.includes('@') && emailNormalizado.includes('.');
    setErro(emailValido ? undefined : 'E-mail inválido');
    return emailValido;
  }

  async function handleSolicitar() {
    if (!validar()) return;
    setEnviando(true);
    try {
      await authService.solicitarRecuperacaoSenha(email);
      setEnviado(true);
      mostrarToast('sucesso', 'E-mail enviado', 'Confira sua caixa de entrada e a pasta de spam.');
    } catch (e) {
      if (e instanceof ApiError && e.campos?.email) setErro(e.campos.email);
      mostrarToast(
        'erro',
        'Não foi possível enviar o e-mail',
        mensagemDeErro(e, 'Verifique o endereço informado e tente novamente.')
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      title="Recupere sua senha."
      subtitle="Enviaremos um link para você criar uma nova senha com segurança."
    >
          {enviado ? (
            <View style={s.confirmacao}>
              <AppIcon name="mail-open-outline" set="Ionicons" size={42} color={theme.colors.primary} />
              <Text style={s.confirmacaoTitulo}>Confira seu e-mail</Text>
              <Text style={s.confirmacaoTexto}>
                Se existir uma conta para {email.trim().toLowerCase()}, enviaremos as instruções de recuperação.
              </Text>
            </View>
          ) : (
            <>
              <AuthField
                label="E-mail cadastrado"
                icon="mail-outline"
                value={email}
                onChangeText={(valor: string) => { setEmail(valor); setErro(undefined); }}
                placeholder="voce@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                error={erro}
              />
              <Pressable
                style={({ pressed }) => [s.btnAuth, pressed && s.btnAuthPressed, enviando && s.btnDisabled]}
                onPress={handleSolicitar}
                disabled={enviando}
                accessibilityRole="button"
                accessibilityLabel={enviando ? 'Enviando' : 'Enviar link de recuperação'}
                accessibilityState={{ disabled: enviando, busy: enviando }}
              >
                <Text style={s.btnAuthText}>{enviando ? 'Enviando...' : 'Enviar link de recuperação'}</Text>
                {!enviando && <AppIcon name="arrow-forward" set="Ionicons" size={18} color={theme.colors.onPrimary} />}
              </Pressable>
            </>
          )}

          <Link href="/login" asChild>
            <Pressable style={s.linkVoltar} accessibilityRole="link" accessibilityLabel="Voltar para o login">
              <AppIcon name="arrow-back" set="Ionicons" size={16} color={theme.colors.primary} />
              <Text style={s.linkVoltarTexto}>Voltar para o login</Text>
            </Pressable>
          </Link>
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
    confirmacao: { alignItems: 'center', paddingVertical: 12 },
    confirmacaoTitulo: { color: theme.colors.text, fontSize: 20, fontWeight: '800', marginTop: 14 },
    confirmacaoTexto: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
    linkVoltar: { marginTop: 'auto', paddingTop: 28, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    linkVoltarTexto: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },
  });
}
