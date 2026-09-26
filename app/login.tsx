import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api/httpClient';
import { mensagemDeErro } from '../services/api/errorMessages';
import { mostrarToast } from '../components/ui/Toast';
import { AppIcon } from '../components/AppIcon';
import { AuthField } from '../components/ui/AuthField';
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
          <AppIcon
            name="paw" set="MaterialCommunityIcons" size={230}
            color="rgba(255,255,255,0.05)" style={s.pawMarca}
          />
          <AppIcon name="paw" set="MaterialCommunityIcons" size={11} color="rgba(191,233,213,0.3)" style={s.pegada1} />
          <AppIcon name="paw" set="MaterialCommunityIcons" size={15} color="rgba(191,233,213,0.45)" style={s.pegada2} />
          <AppIcon name="paw" set="MaterialCommunityIcons" size={19} color="rgba(191,233,213,0.6)" style={s.pegada3} />

          <View style={s.marca}>
            <View style={s.seloWrap}>
              <View style={s.seloGlowOut} />
              <View style={s.seloGlowIn} />
              <LinearGradient
                colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.03)']}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={s.seloDisco}
              >
                <Image
                  source={require('../assets/logo.png')}
                  style={s.seloImg}
                  resizeMode="contain"
                  accessible={false}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </LinearGradient>
            </View>
            <Text style={s.marcaTexto}>VetSync</Text>
          </View>

          <Text style={s.heroTitulo}>Bem-vindo de volta.</Text>
          <Text style={s.heroSub}>
            Consultas, vacinas e lembretes do seu pet, sempre à mão.
          </Text>
        </LinearGradient>

        <View style={s.sheet}>

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

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  scroll: { flexGrow: 1 },

  hero: {
    paddingTop: 64,
    paddingHorizontal: 30,
    paddingBottom: 56,
    overflow: 'hidden',
  },
  pawMarca: {
    position: 'absolute',
    top: -26,
    right: -34,
    transform: [{ rotate: '-18deg' }],
  },
  pegada1: { position: 'absolute', top: 6, left: 2, transform: [{ rotate: '18deg' }] },
  pegada2: { position: 'absolute', top: 22, left: 20, transform: [{ rotate: '-10deg' }] },
  pegada3: { position: 'absolute', top: 40, left: 42, transform: [{ rotate: '20deg' }] },

  marca: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
  seloWrap: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center' },
  seloGlowOut: {
    position: 'absolute', width: 112, height: 112, borderRadius: 56,
    backgroundColor: 'rgba(242,200,121,0.10)',
  },
  seloGlowIn: {
    position: 'absolute', width: 92, height: 92, borderRadius: 46,
    backgroundColor: 'rgba(242,200,121,0.14)',
  },
  seloDisco: {
    width: 78, height: 78, borderRadius: 39,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  seloImg: { width: 54, height: 54 },
  marcaTexto: { fontSize: 19, fontWeight: '700', color: theme.colors.onNavigation, letterSpacing: -0.3 },

  heroTitulo: {
    fontSize: 32, fontWeight: '800', color: theme.colors.onNavigation,
    letterSpacing: -0.7, lineHeight: 38, marginBottom: 10, maxWidth: 300,
  },
  heroSub: { fontSize: 15, fontWeight: '500', color: theme.colors.onNavigation, opacity: 0.8, lineHeight: 22, maxWidth: 270 },

  sheet: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingTop: 36,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

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