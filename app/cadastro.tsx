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

function formatarCpf(text: string): string {
  const n = text.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
}

function formatarTelefone(text: string): string {
  const n = text.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
}

function mensagemDeErro(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export default function CadastroScreen() {
  const router = useRouter();
  const { registrar } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [cadastrando, setCadastrando] = useState(false);

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim() || nome.trim().length < 2) {
      e.nome = 'Informe seu nome completo';
    }
    if (!email.trim() || !email.includes('@')) {
      e.email = 'E-mail inválido';
    }
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      e.cpf = 'CPF deve conter 11 dígitos';
    }
    const telLimpo = telefone.replace(/\D/g, '');
    if (telLimpo && telLimpo.length < 10) {
      e.telefone = 'Telefone deve ter 10 ou 11 dígitos';
    }
    if (!senha.trim() || senha.length < 6) {
      e.senha = 'A senha deve ter no mínimo 6 caracteres';
    }
    if (senha !== confirmarSenha) {
      e.confirmarSenha = 'As senhas não coincidem';
    }

    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleCadastrar() {
    if (!validar()) return;
    setCadastrando(true);
    try {
      await registrar({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        cpf: cpf.replace(/\D/g, ''),
        telefone: telefone.replace(/\D/g, '') || undefined,
      });

      // Usuário autenticado como TUTOR com 0 pets. Redireciona para cadastrar o primeiro pet.
      router.replace('/add-pet');
    } catch (e) {
      alertar('Não foi possível realizar o cadastro', mensagemDeErro(e, 'Verifique os dados e tente novamente.'));
    } finally {
      setCadastrando(false);
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
            <Text style={s.authSub}>Criar Conta de Tutor</Text>
          </View>

          <View style={s.authForm}>

            <View style={s.introBox}>
              <AppIcon name="person-add-outline" set="Ionicons" size={22} color={C.g600} />
              <Text style={s.introText}>
                Cadastre-se para acompanhar o histórico de saúde, vacinas e consultas do seu pet.
              </Text>
            </View>

            <Campo
              label="Nome Completo *"
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Maria da Silva"
              erro={erros.nome}
            />

            <Campo
              label="E-mail *"
              value={email}
              onChangeText={setEmail}
              placeholder="voce@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              erro={erros.email}
            />

            <Campo
              label="CPF *"
              value={cpf}
              onChangeText={(t: string) => setCpf(formatarCpf(t))}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              maxLength={14}
              erro={erros.cpf}
            />

            <Campo
              label="Telefone (opcional)"
              value={telefone}
              onChangeText={(t: string) => setTelefone(formatarTelefone(t))}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              maxLength={15}
              erro={erros.telefone}
            />

            <Campo
              label="Senha *"
              value={senha}
              onChangeText={setSenha}
              placeholder="Mínimo de 6 caracteres"
              isPassword
              showPassword={mostrarSenha}
              onTogglePassword={() => setMostrarSenha(v => !v)}
              erro={erros.senha}
            />

            <Campo
              label="Confirmar Senha *"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              placeholder="Repita a senha"
              isPassword
              showPassword={mostrarConfirmarSenha}
              onTogglePassword={() => setMostrarConfirmarSenha(v => !v)}
              erro={erros.confirmarSenha}
            />

            <Pressable
              style={[s.btnAuth, cadastrando && { opacity: 0.6 }]}
              onPress={handleCadastrar}
              disabled={cadastrando}
            >
              <Text style={s.btnAuthText}>
                {cadastrando ? 'Cadastrando...' : 'Cadastrar e Continuar →'}
              </Text>
            </Pressable>

            <Link href="/login" asChild>
              <Pressable
                style={s.btnVoltar}
                disabled={cadastrando}
              >
                <Text style={s.btnVoltarText}>
                  Já tem uma conta? <Text style={s.btnVoltarDestaque}>Entrar</Text>
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
          autoCapitalize={autoCapitalize ?? (isPassword || secureTextEntry ? 'none' : 'words')}
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
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 40 },

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
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  authLogo: {
    width: 48,
    height: 48,
    backgroundColor: C.g500,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  authLogoImg: { width: 30, height: 30 },
  authName: { fontSize: 24, fontWeight: '700', color: C.white, letterSpacing: -0.5, marginBottom: 2 },
  authSub: { fontSize: 13, color: C.g200 },

  authForm: { padding: 24 },

  introBox: {
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
  introText: { flex: 1, fontSize: 12, color: C.muted, lineHeight: 18 },

  campo: { marginBottom: 14 },
  fl: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.6,
    textTransform: 'uppercase', color: C.muted, marginBottom: 6,
  },
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
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnAuthText: { color: C.white, fontSize: 14, fontWeight: '700' },

  btnVoltar: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 4,
  },
  btnVoltarText: {
    fontSize: 13,
    color: C.muted,
  },
  btnVoltarDestaque: {
    color: C.g600,
    fontWeight: '700',
  },
});

