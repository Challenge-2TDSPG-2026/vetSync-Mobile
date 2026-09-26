import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { ApiError } from '../services/api/httpClient';
import { authService } from '../services/authService';
import { mensagemDeErro } from '../services/api/errorMessages';
import { mostrarToast } from '../components/ui/Toast';
import { AppIcon } from '../components/AppIcon';
import { AuthField } from '../components/ui/AuthField';
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[theme.colors.navigation, theme.colors.navigationAccent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <AppIcon name="paw" set="MaterialCommunityIcons" size={190} color="rgba(255,255,255,0.05)" style={s.pawMarca} />
          <View style={s.marca}>
            <View style={s.selo}>
              <Image
                source={require('../assets/logo.png')}
                style={s.seloImg}
                resizeMode="contain"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
            <Text style={s.marcaTexto}>VetSync</Text>
          </View>
          <Text style={s.heroTitulo}>Recupere sua senha.</Text>
          <Text style={s.heroSub}>Enviaremos um link para você criar uma nova senha com segurança.</Text>
        </LinearGradient>

        <View style={s.sheet}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    scroll: { flexGrow: 1 },
    hero: { paddingTop: 64, paddingHorizontal: 30, paddingBottom: 56, overflow: 'hidden' },
    pawMarca: { position: 'absolute', top: -26, right: -34, transform: [{ rotate: '-18deg' }] },
    marca: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
    selo: {
      width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    },
    seloImg: { width: 54, height: 54 },
    marcaTexto: { fontSize: 19, fontWeight: '700', color: theme.colors.onNavigation, letterSpacing: -0.3 },
    heroTitulo: { fontSize: 32, fontWeight: '800', color: theme.colors.onNavigation, letterSpacing: -0.7, lineHeight: 38, marginBottom: 10, maxWidth: 300 },
    heroSub: { fontSize: 15, fontWeight: '500', color: theme.colors.onNavigation, opacity: 0.8, lineHeight: 22, maxWidth: 290 },
    sheet: {
      flexGrow: 1, backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32,
      marginTop: -28, paddingTop: 36, paddingHorizontal: 28, paddingBottom: 32,
    },
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
