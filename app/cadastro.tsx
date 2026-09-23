import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api/httpClient';
import { mostrarToast } from '../components/ui/Toast';
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
      mostrarToast('erro', 'Não foi possível realizar o cadastro', mensagemDeErro(e, 'Verifique os dados e tente novamente.'));
    } finally {
      setCadastrando(false);
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
            name="paw" set="MaterialCommunityIcons" size={190}
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

          <Text style={s.heroTitulo}>Crie sua conta.</Text>
          <Text style={s.heroSub}>
            Acompanhe vacinas, consultas e o bem-estar do seu pet em um só lugar.
          </Text>
        </LinearGradient>

        <View style={s.sheet}>

          <Campo
            label="Nome completo"
            icon="person-outline"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Maria da Silva"
            autoCapitalize="words"
            erro={erros.nome}
          />

          <Campo
            label="E-mail"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            erro={erros.email}
          />

          <View style={s.linha}>
            <View style={{ flex: 1.1 }}>
              <Campo
                label="CPF"
                icon="card-outline"
                value={cpf}
                onChangeText={(t: string) => setCpf(formatarCpf(t))}
                placeholder="000.000.000-00"
                keyboardType="numeric"
                maxLength={14}
                erro={erros.cpf}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Campo
                label="Telefone"
                icon="call-outline"
                value={telefone}
                onChangeText={(t: string) => setTelefone(formatarTelefone(t))}
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
                maxLength={15}
                erro={erros.telefone}
              />
            </View>
          </View>

          <Campo
            label="Senha"
            icon="lock-closed-outline"
            value={senha}
            onChangeText={setSenha}
            placeholder="Mínimo de 6 caracteres"
            isPassword
            showPassword={mostrarSenha}
            onTogglePassword={() => setMostrarSenha(v => !v)}
            erro={erros.senha}
          />

          <Campo
            label="Confirmar senha"
            icon="lock-closed-outline"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Repita a senha"
            isPassword
            showPassword={mostrarConfirmarSenha}
            onTogglePassword={() => setMostrarConfirmarSenha(v => !v)}
            erro={erros.confirmarSenha}
          />

          <Pressable
            style={({ pressed }) => [s.btnAuth, pressed && s.btnAuthPressed, cadastrando && { opacity: 0.65 }]}
            onPress={handleCadastrar}
            disabled={cadastrando}
          >
            <Text style={s.btnAuthText}>{cadastrando ? 'Cadastrando...' : 'Criar conta'}</Text>
            {!cadastrando && <AppIcon name="arrow-forward" set="Ionicons" size={18} color="#fff" />}
          </Pressable>

          <Link href="/login" asChild>
            <Pressable style={s.linkSecundario} disabled={cadastrando}>
              <Text style={s.linkSecundarioTexto}>
                Já tem uma conta? <Text style={s.linkSecundarioDestaque}>Entrar</Text>
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
  erro, autoCapitalize, isPassword, showPassword, onTogglePassword, icon,
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
    paddingTop: 56,
    paddingHorizontal: 30,
    paddingBottom: 46,
    overflow: 'hidden',
  },
  pawMarca: {
    position: 'absolute',
    top: -20,
    right: -28,
    transform: [{ rotate: '-18deg' }],
  },
  pegada1: { position: 'absolute', top: 4, left: 2, transform: [{ rotate: '18deg' }] },
  pegada2: { position: 'absolute', top: 18, left: 20, transform: [{ rotate: '-10deg' }] },
  pegada3: { position: 'absolute', top: 34, left: 42, transform: [{ rotate: '20deg' }] },

  marca: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 24 },
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
    fontSize: 28, fontWeight: '800', color: '#fff',
    letterSpacing: -0.6, lineHeight: 33, marginBottom: 9, maxWidth: 300,
  },
  heroSub: { fontSize: 14, fontWeight: '500', color: C.mintPale, lineHeight: 21, maxWidth: 280 },

  sheet: {
    flexGrow: 1,
    backgroundColor: C.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingTop: 32,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  linha: { flexDirection: 'row', gap: 12 },

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