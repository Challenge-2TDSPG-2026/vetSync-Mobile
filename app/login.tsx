import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
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
            <Text style={s.authName}>ClyvoVet</Text>
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
              secureTextEntry
              erro={errosConta.senha}
            />

            <Pressable
              style={[s.btnAuth, autenticando && { opacity: 0.6 }]}
              onPress={handleEntrar}
              disabled={autenticando}
            >
              <Text style={s.btnAuthText}>{autenticando ? 'Entrando...' : 'Entrar →'}</Text>
            </Pressable>

            <Text style={s.loginNota}>
              Não tem conta? Fale com a administração para criar seu acesso.
            </Text>

          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({ label, value, onChangeText, placeholder, keyboardType, maxLength, erro, secureTextEntry }: any) {
  return (
    <View style={s.campo}>
      <Text style={s.fl}>{label}</Text>
      <TextInput
        style={[s.fi, erro && s.fiErro]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCapitalize={secureTextEntry ? 'none' : undefined}
      />
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
  fi: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
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
  loginNota: {
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
    marginTop: 12,
  },
}); 