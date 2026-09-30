import React, { useEffect, useMemo, useState } from 'react';
import { Text, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api/httpClient';
import { mensagemDeErro } from '../services/api/errorMessages';
import { mostrarToast } from '../components/ui/Toast';
import { AppIcon } from '../components/AppIcon';
import { AuthField } from '../components/ui/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme } from '../constants/theme';
import { buscarEnderecoPorCep, formatarCep } from '../services/cepService';

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
  const { sessaoVinculo, clinica } = useLocalSearchParams<{ sessaoVinculo?: string; clinica?: string }>();
  const { registrar } = useAuth();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  const [nome, setNome] = useState('');

  useEffect(() => {
    if (typeof sessaoVinculo !== 'string' || !sessaoVinculo) router.replace('/vinculo-clinica');
  }, [router, sessaoVinculo]);
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [cadastrando, setCadastrando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  async function consultarCep() {
    if (cep.replace(/\D/g, '').length !== 8) {
      setErros((prev) => ({ ...prev, cep: 'Informe os 8 dígitos do CEP' }));
      return;
    }

    setBuscandoCep(true);
    try {
      const endereco = await buscarEnderecoPorCep(cep);
      setCep(formatarCep(endereco.cep));
      setLogradouro(endereco.logradouro);
      setBairro(endereco.bairro);
      setCidade(endereco.cidade);
      setUf(endereco.uf);
      setComplemento((atual) => atual || endereco.complemento);
      setErros((prev) => {
        const {
          cep: _cep,
          logradouro: _logradouro,
          bairro: _bairro,
          cidade: _cidade,
          uf: _uf,
          ...restante
        } = prev;
        return restante;
      });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Não foi possível consultar o CEP.';
      setErros((prev) => ({ ...prev, cep: mensagem }));
    } finally {
      setBuscandoCep(false);
    }
  }

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
    if (cep.replace(/\D/g, '').length !== 8) e.cep = 'Informe os 8 dígitos do CEP';
    if (!logradouro.trim()) e.logradouro = 'Consulte o CEP para preencher o endereço';
    if (!numero.trim()) e.numero = 'Informe o número do endereço';
    if (!bairro.trim()) e.bairro = 'Informe o bairro';
    if (!cidade.trim()) e.cidade = 'Informe a cidade';
    if (!/^[A-Z]{2}$/.test(uf.trim().toUpperCase())) e.uf = 'Informe a sigla do estado';

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
        cep: cep.replace(/\D/g, ''),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        sessaoVinculo: typeof sessaoVinculo === 'string' ? sessaoVinculo : '',
      });

      mostrarToast(
        'sucesso',
        'Cadastro realizado',
        `Bem-vindo(a), ${nome.trim().split(' ')[0]}! Agora cadastre seu primeiro pet.`,
      );
      // Usuário autenticado como TUTOR com 0 pets. Redireciona para cadastrar o primeiro pet.
      router.replace('/(tutor)/add-pet');
    } catch (e) {
      if (e instanceof ApiError && e.campos) {
        setErros((prev) => ({ ...prev, ...e.campos }));
      }
      mostrarToast(
        'erro',
        'Não foi possível realizar o cadastro',
        mensagemDeErro(e, 'Verifique os dados e tente novamente.'),
      );
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <AuthLayout
      title="Crie sua conta."
      subtitle="Acompanhe vacinas, consultas e o bem-estar do seu pet em um só lugar."
    >
      {clinica ? <Text style={{ color: theme.colors.primary, fontWeight: "700", marginBottom: 18 }}>Clínica confirmada: {clinica}</Text> : null}
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

      <View style={s.addressHeader}>
        <Text style={s.addressTitle}>Endereço</Text>
        <Text style={s.addressSubtitle}>Busque o CEP para preencher os dados automaticamente.</Text>
      </View>

      <View style={s.cepRow}>
        <View style={s.cepField}>
          <AuthField
            label="CEP"
            icon="location-outline"
            value={cep}
            onChangeText={(texto: string) => setCep(formatarCep(texto))}
            onBlur={() => {
              void consultarCep();
            }}
            placeholder="00000-000"
            keyboardType="numeric"
            maxLength={9}
            error={erros.cep}
          />
        </View>
        <Pressable
          style={[s.cepButton, buscandoCep && s.cepButtonDisabled]}
          onPress={() => {
            void consultarCep();
          }}
          disabled={buscandoCep}
          accessibilityRole="button"
          accessibilityLabel="Buscar CEP"
        >
          {buscandoCep ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <Text style={s.cepButtonText}>Buscar</Text>
          )}
        </Pressable>
      </View>

      <AuthField
        label="Endereço"
        icon="home-outline"
        value={logradouro}
        onChangeText={setLogradouro}
        placeholder="Rua, avenida ou praça"
        autoCapitalize="words"
        error={erros.logradouro}
      />

      <View style={s.dadosEnderecoRow}>
        <View style={s.numeroField}>
          <AuthField
            label="Número"
            icon="business-outline"
            value={numero}
            onChangeText={setNumero}
            placeholder="Ex: 123 ou S/N"
            autoCapitalize="characters"
            error={erros.numero}
          />
        </View>
        <View style={s.ufField}>
          <AuthField
            label="Estado (UF)"
            icon="flag-outline"
            value={uf}
            onChangeText={(texto: string) =>
              setUf(
                texto
                  .replace(/[^a-z]/gi, '')
                  .slice(0, 2)
                  .toUpperCase(),
              )
            }
            placeholder="SP"
            autoCapitalize="characters"
            maxLength={2}
            error={erros.uf}
          />
        </View>
      </View>

      <AuthField
        label="Complemento (opcional)"
        icon="add-circle-outline"
        value={complemento}
        onChangeText={setComplemento}
        placeholder="Ex: Apto 24, bloco B"
        autoCapitalize="sentences"
      />

      <AuthField
        label="Bairro"
        icon="map-outline"
        value={bairro}
        onChangeText={setBairro}
        placeholder="Seu bairro"
        autoCapitalize="words"
        error={erros.bairro}
      />

      <AuthField
        label="Cidade"
        icon="business-outline"
        value={cidade}
        onChangeText={setCidade}
        placeholder="Sua cidade"
        autoCapitalize="words"
        error={erros.cidade}
      />

      <AuthField
        label="Senha"
        icon="lock-closed-outline"
        value={senha}
        onChangeText={setSenha}
        placeholder="Mínimo de 8 caracteres, com letra e número"
        isPassword
        showPassword={mostrarSenha}
        onTogglePassword={() => setMostrarSenha((v) => !v)}
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
        onTogglePassword={() => setMostrarConfirmarSenha((v) => !v)}
        error={erros.confirmarSenha}
      />

      <Pressable
        style={({ pressed }) => [
          s.btnAuth,
          pressed && s.btnAuthPressed,
          cadastrando && { opacity: 0.65 },
        ]}
        onPress={handleCadastrar}
        disabled={cadastrando}
        accessibilityRole="button"
        accessibilityLabel={cadastrando ? 'Cadastrando' : 'Criar conta'}
        accessibilityState={{ disabled: cadastrando, busy: cadastrando }}
      >
        <Text style={s.btnAuthText}>{cadastrando ? 'Cadastrando...' : 'Criar conta'}</Text>
        {!cadastrando && (
          <AppIcon name="arrow-forward" set="Ionicons" size={18} color={theme.colors.onPrimary} />
        )}
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

    addressHeader: { marginTop: 2, marginBottom: 14 },
    addressTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
    addressSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 4,
    },
    cepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    cepField: { flex: 1 },
    dadosEnderecoRow: { flexDirection: 'row', gap: 12 },
    numeroField: { flex: 1.5, minWidth: 0 },
    ufField: { flex: 1, minWidth: 0 },
    cepButton: {
      minHeight: 57,
      marginTop: 31,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cepButtonDisabled: { opacity: 0.65 },
    cepButtonText: { color: theme.colors.onPrimary, fontSize: 13, fontWeight: '800' },

    linkSecundario: { marginTop: 'auto', paddingTop: 22, alignItems: 'center', paddingBottom: 4 },
    linkSecundarioTexto: { fontSize: 13, color: theme.colors.textSecondary },
    linkSecundarioDestaque: { color: theme.colors.primary, fontWeight: '700' },
  });
}
