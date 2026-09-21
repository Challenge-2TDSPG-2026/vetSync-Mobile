import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api/httpClient';
import { alertar } from '../utils/alert';
import { AppIcon } from '../components/AppIcon';

const C = {
  night: '#0a2218',
  forest: '#123d29',
  mint: '#22a06b',
  mintDeep: '#1a7a52',
  mintPale: '#bfe9d5',
  glow: '#f2c879',
  cream: '#faf8f3',
  fill: '#f1ece1',
  ink: '#1a1512',
  muted: '#7a6a5e',
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
      style={{ flex: 1, backgroundColor: C.night }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <LinearGradient
          colors={[C.night, C.forest]}
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
              <View style={s.selo}>
                <Image source={require('../assets/logo.png')} style={s.seloImg} resizeMode="contain" />
              </View>
            </View>
            <Text style={s.marcaTexto}>VetSync</Text>
          </View>

          <Text style={s.heroTitulo}>Bem-vindo de volta.</Text>
          <Text style={s.heroSub}>
            Consultas, vacinas e lembretes do seu pet, sempre à mão.
          </Text>
        </LinearGradient>

        <View style={s.sheet}>

          <Campo
            label="E-mail"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="username"
            autoComplete="username"
            erro={errosConta.email}
          />

          <Campo
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
            erro={errosConta.senha}
          />

          <Pressable
            style={({ pressed }) => [s.btnAuth, pressed && s.btnAuthPressed, autenticando && { opacity: 0.65 }]}
            onPress={handleEntrar}
            disabled={autenticando}
          >
            <Text style={s.btnAuthText}>{autenticando ? 'Entrando...' : 'Entrar'}</Text>
            {!autenticando && <AppIcon name="arrow-forward" set="Ionicons" size={18} color="#fff" />}
          </Pressable>

          <Link href="/cadastro" asChild>
            <Pressable style={s.linkSecundario} disabled={autenticando}>
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

function Campo({
  label, value, onChangeText, placeholder, keyboardType, maxLength,
  erro, autoCapitalize, textContentType, autoComplete,
  isPassword, showPassword, onTogglePassword, icon,
}: any) {
  const [focado, setFocado] = useState(false);
  return (
    <View style={s.campo}>
      <Text style={s.fl}>{label}</Text>
      <View style={[s.inputWrap, focado && s.inputWrapFocado, erro && s.fiErro]}>
        <AppIcon name={icon} set="Ionicons" size={18} color={focado ? C.mintDeep : C.muted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.fi}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={isPassword ? !showPassword : undefined}
          autoCapitalize={autoCapitalize ?? (isPassword ? 'none' : undefined)}
          textContentType={textContentType}
          autoComplete={autoComplete}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
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
              size={19}
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

  marca: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 30 },
  seloWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  seloGlowOut: {
    position: 'absolute', width: 86, height: 86, borderRadius: 43,
    backgroundColor: 'rgba(242,200,121,0.12)',
  },
  seloGlowIn: {
    position: 'absolute', width: 66, height: 66, borderRadius: 33,
    backgroundColor: 'rgba(242,200,121,0.16)',
  },
  selo: {
    width: 48, height: 48, borderRadius: 15,
    backgroundColor: C.mint,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  seloImg: { width: 28, height: 28 },
  marcaTexto: { fontSize: 19, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },

  heroTitulo: {
    fontSize: 32, fontWeight: '800', color: '#fff',
    letterSpacing: -0.7, lineHeight: 38, marginBottom: 10, maxWidth: 300,
  },
  heroSub: { fontSize: 15, fontWeight: '500', color: C.mintPale, lineHeight: 22, maxWidth: 270 },

  sheet: {
    flexGrow: 1,
    backgroundColor: C.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingTop: 36,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  campo: { marginBottom: 16 },
  fl: { fontSize: 13, fontWeight: '600', color: C.ink, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.fill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  inputWrapFocado: { borderColor: C.mint, backgroundColor: '#fff' },
  fi: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.ink },
  btnOlho: { paddingLeft: 6, paddingVertical: 6, justifyContent: 'center', alignItems: 'center' },
  fiErro: { borderColor: C.danger },
  textoErro: { color: C.danger, fontSize: 12, marginTop: 6 },

  btnAuth: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: C.mint,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: C.mint,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  btnAuthPressed: { backgroundColor: C.mintDeep },
  btnAuthText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  linkSecundario: { marginTop: 22, alignItems: 'center', paddingVertical: 4 },
  linkSecundarioTexto: { fontSize: 13, color: C.muted },
  linkSecundarioDestaque: { color: C.mintDeep, fontWeight: '700' },
});
