import React, { useMemo, useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api/httpClient';
import { mensagemDeErro } from '../services/api/errorMessages';
import { mostrarToast } from '../components/ui/Toast';
import { AppIcon } from '../components/AppIcon';
import { AuthField } from '../components/ui/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme } from '../constants/theme';

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

export default function CadastroScreen() {
  const router = useRouter();
  const { registrar } = useAuth();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
    if (!senha.trim() || senha.length < 8) {
      e.senha = 'A senha deve ter no mínimo 8 caracteres';
    } else if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
      e.senha = 'Use pelo menos uma letra e um número';
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

      mostrarToast('sucesso', 'Cadastro realizado', `Bem-vindo(a), ${nome.trim().split(' ')[0]}! Agora cadastre seu primeiro pet.`);
      // Usuário autenticado como TUTOR com 0 pets. Redireciona para cadastrar o primeiro pet.
      router.replace('/add-pet');
    } catch (e) {
      if (e instanceof ApiError && e.campos) {
        setErros(prev => ({ ...prev, ...e.campos }));
      }
      mostrarToast('erro', 'Não foi possível realizar o cadastro', mensagemDeErro(e, 'Verifique os dados e tente novamente.'));
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <AuthLayout
      title="Crie sua conta."
      subtitle="Acompanhe vacinas, consultas e o bem-estar do seu pet em um só lugar."
    >
          <AuthField
            label="Nome completo"
            icon="person-outline"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Maria da Silva"
            autoCapitalize="words"
            error={erros.nome}
          />

          <AuthField
            label="E-mail"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={erros.email}
          />

          <AuthField
            label="CPF"
            icon="card-outline"
            value={cpf}
            onChangeText={(t: string) => setCpf(formatarCpf(t))}
            placeholder="000.000.000-00"
            keyboardType="numeric"
            maxLength={14}
            error={erros.cpf}
          />

          <AuthField
            label="Telefone"
            icon="call-outline"
            value={telefone}
            onChangeText={(t: string) => setTelefone(formatarTelefone(t))}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
            maxLength={15}
            error={erros.telefone}
          />

          <AuthField
            label="Senha"
            icon="lock-closed-outline"
            value={senha}
            onChangeText={setSenha}
            placeholder="Mínimo de 8 caracteres, com letra e número"
            isPassword
            showPassword={mostrarSenha}
            onTogglePassword={() => setMostrarSenha(v => !v)}
            error={erros.senha}
          />

          <AuthField
            label="Confirmar senha"
            icon="lock-closed-outline"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Repita a senha"
            isPassword
            showPassword={mostrarConfirmarSenha}
            onTogglePassword={() => setMostrarConfirmarSenha(v => !v)}
            error={erros.confirmarSenha}
          />

          <Pressable
            style={({ pressed }) => [s.btnAuth, pressed && s.btnAuthPressed, cadastrando && { opacity: 0.65 }]}
            onPress={handleCadastrar}
            disabled={cadastrando}
            accessibilityRole="button"
            accessibilityLabel={cadastrando ? 'Cadastrando' : 'Criar conta'}
            accessibilityState={{ disabled: cadastrando, busy: cadastrando }}
          >
            <Text style={s.btnAuthText}>{cadastrando ? 'Cadastrando...' : 'Criar conta'}</Text>
            {!cadastrando && <AppIcon name="arrow-forward" set="Ionicons" size={18} color={theme.colors.onPrimary} />}
          </Pressable>

          <Link href="/login" asChild>
            <Pressable
              style={s.linkSecundario}
              disabled={cadastrando}
              accessibilityRole="link"
              accessibilityLabel="Já tem uma conta? Entrar"
            >
              <Text style={s.linkSecundarioTexto}>
                Já tem uma conta? <Text style={s.linkSecundarioDestaque}>Entrar</Text>
              </Text>
            </Pressable>
          </Link>
    </AuthLayout>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
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
  });
}