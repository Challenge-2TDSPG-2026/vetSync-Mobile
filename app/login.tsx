import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api/httpClient';
import { alertar } from '../utils/alert';
import { AppIcon } from '../components/AppIcon';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g200: '#a8e6c7',
  white: '#fff', text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da',
  danger: '#dc3545',
};

function mensagemDeErro(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

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
      // Navegação (para (tutor) ou (vet), conforme sessao.perfil) é reativa,
      // controlada pelo RootNavigator em app/_layout.tsx.
    } catch (e) {
      alertar('Não foi possível entrar', mensagemDeErro(e, 'Verifique seu e-mail e senha.'));
    } finally {
      setAutenticando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.g900 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >

        <View style={s.authCard}>

          <View style={s.authHdr}>
            <View style={s.authLogo}>
              <Image source={require('../assets/logo.png')} style={s.authLogoImg} resizeMode="contain" />
            </View>
            <Text style={s.authName}>VetSync</Text>
            <Text style={s.authSub}>Plataforma de Saúde Animal</Text>
          </View>

          <View style={s.authForm}>

            <View style={s.loginIntro}>
              <AppIcon name="lock-closed-outline" set="Ionicons" size={22} color={C.g600} />
              <Text style={s.loginIntroText}>
                Entre com sua conta de tutor ou veterinário. O perfil da sua
                conta é quem determina para onde você vai.
              </Text>
            </View>

            <Campo
              label="E-mail *"
              value={email}
              onChangeText={setEmail}
              placeholder="voce@email.com"
              keyboardType="email-address"
              erro={errosConta.email}
            />

            <Campo
              label="Senha *"
              value={senha}
              onChangeText={setSenha}
              placeholder="••••••••"
              isPassword
              showPassword={mostrarSenha}
              onTogglePassword={() => setMostrarSenha(v => !v)}
              erro={errosConta.senha}
            />

            <Pressable
              style={[s.btnAuth, autenticando && { opacity: 0.6 }]}
              onPress={handleEntrar}
              disabled={autenticando}
            >
              <Text style={s.btnAuthText}>{autenticando ? 'Entrando...' : 'Entrar →'}</Text>
            </Pressable>

            <Link href="/cadastro" asChild>
              <Pressable
                style={s.btnCadastrar}
                disabled={autenticando}
              >
                <Text style={s.btnCadastrarText}>
                  Não tem conta? <Text style={s.btnCadastrarDestaque}>Cadastre-se como tutor</Text>
                </Text>
              </Pressable>
            </Link>

          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({
  label, value, onChangeText, placeholder, keyboardType, maxLength,
  erro, secureTextEntry, autoCapitalize, isPassword, showPassword, onTogglePassword,
}: any) {
  return (
    <View style={s.campo}>
      <Text style={s.fl}>{label}</Text>
      <View style={[s.inputWrap, erro && s.fiErro]}>
        <TextInput
          style={s.fi}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          autoCapitalize={autoCapitalize ?? (isPassword || secureTextEntry ? 'none' : undefined)}
        />
        {isPassword && (
          <Pressable
            onPress={onTogglePassword}
            style={s.btnOlho}
            hitSlop={8}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            accessibilityRole="button"
          >
            <AppIcon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              set="Ionicons"
              size={20}
              color={C.muted}
            />
          </Pressable>
        )}
      </View>
      {erro ? <Text style={s.textoErro}>{erro}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 },

  authCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  authHdr: {
    backgroundColor: C.g800,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  authLogo: {
    width: 52,
    height: 52,
    backgroundColor: C.g500,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  authLogoImg: { width: 32, height: 32 },
  authName: { fontSize: 26, fontWeight: '700', color: C.white, letterSpacing: -0.5, marginBottom: 4 },
  authSub: { fontSize: 12, color: C.g200 },

  authForm: { padding: 24 },

  fg: { marginBottom: 16 },
  fl: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.6,
    textTransform: 'uppercase', color: C.muted, marginBottom: 6,
  },
  campo: { flex: 1, marginBottom: 16 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 13,
  },
  fi: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
  },
  btnOlho: {
    paddingLeft: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fiErro: { borderColor: C.danger },
  textoErro: { color: C.danger, fontSize: 12, marginTop: 4 },

  btnAuth: {
    backgroundColor: C.g600,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnAuthText: { color: C.white, fontSize: 14, fontWeight: '700' },

  loginIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f9f7f4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  loginIntroText: { flex: 1, fontSize: 12, color: C.muted },
  btnCadastrar: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 4,
  },
  btnCadastrarText: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  btnCadastrarDestaque: {
    color: C.g600,
    fontWeight: '700',
  },
}); 