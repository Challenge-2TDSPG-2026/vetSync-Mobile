import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api/httpClient';
import { mensagemDeErro } from '../services/api/errorMessages';
import { googlePendente } from '../services/googlePendente';
import { buscarEnderecoPorCep, formatarCep } from '../services/cepService';
import { mostrarToast } from '../components/ui/Toast';
import { AppIcon } from '../components/AppIcon';
import { AuthField } from '../components/ui/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme } from '../constants/theme';
import { erroDeTokenGoogle } from '../utils/loginSocial';
import { formatarCpf, formatarTelefone, validarCadastroGoogle } from '../utils/cadastroGoogle';

/**
 * Conclui o cadastro de quem entrou pelo Google e ainda não tinha conta.
 * O e-mail e a identidade vêm do token validado pela API, então aqui só pedimos o que o Google não sabe.
 */
export default function CadastroGoogleScreen() {
  const router = useRouter();
  const { sessaoVinculo, clinica } = useLocalSearchParams<{ sessaoVinculo?: string; clinica?: string }>();
  const { registrarComGoogle } = useAuth();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  // Lido uma vez: o token só existe em memória, nunca em parâmetros de rota.
  const pendente = useRef(googlePendente.obter()).current;
  const nomeDoGoogle = pendente?.pendencia.nome ?? null;

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [cadastrando, setCadastrando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (!pendente) {
      mostrarToast('erro', 'Sua confirmação do Google expirou', 'Entre com o Google novamente.');
      router.replace('/login');
    } else if (typeof sessaoVinculo !== 'string' || !sessaoVinculo) {
      router.replace({ pathname: '/vinculo-clinica', params: { origem: 'google' } });
    }
  }, [pendente, router, sessaoVinculo]);

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
        const { cep: _c, logradouro: _l, bairro: _b, cidade: _ci, uf: _u, ...restante } = prev;
        return restante;
      });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Não foi possível consultar o CEP.';
      setErros((prev) => ({ ...prev, cep: mensagem }));
    } finally {
      setBuscandoCep(false);
    }
  }

  async function handleCadastrar() {
    if (!pendente || typeof sessaoVinculo !== 'string' || !sessaoVinculo) return;
    const encontrados = validarCadastroGoogle({
      nome, exigirNome: !nomeDoGoogle, cpf, telefone, cep, logradouro, numero, bairro, cidade, uf,
    });
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setCadastrando(true);
    try {
      await registrarComGoogle({
        idToken: pendente.idToken,
        nome: nomeDoGoogle ? undefined : nome.trim(),
        cpf: cpf.replace(/\D/g, ''),
        telefone: telefone.replace(/\D/g, '') || undefined,
        cep: cep.replace(/\D/g, ''),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        sessaoVinculo,
      });
      googlePendente.limpar();
      mostrarToast('sucesso', 'Cadastro realizado', 'Agora cadastre seu primeiro pet.');
      router.replace('/(tutor)/add-pet');
    } catch (e) {
      if (erroDeTokenGoogle(e)) {
        googlePendente.limpar();
        mostrarToast('erro', 'Sua confirmação do Google expirou', 'Entre com o Google novamente.');
        router.replace('/login');
        return;
      }
      if (e instanceof ApiError && e.campos) setErros((prev) => ({ ...prev, ...e.campos }));
      mostrarToast(
        'erro',
        'Não foi possível realizar o cadastro',
        mensagemDeErro(e, 'Verifique os dados e tente novamente.'),
      );
    } finally {
      setCadastrando(false);
    }
  }

  if (!pendente) return null;

  return (
    <AuthLayout
      permitirCapturaDeTela
      title="Quase lá."
      subtitle="Complete seu cadastro para começar a cuidar do seu pet."
    >
      <View style={s.conta}>
        <AppIcon name="logo-google" set="Ionicons" size={20} color={theme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={s.contaTitulo}>{nomeDoGoogle ?? 'Conta do Google'}</Text>
          <Text style={s.contaEmail}>{pendente.pendencia.email}</Text>
        </View>
      </View>
      {clinica ? <Text style={s.clinica}>Clínica confirmada: {clinica}</Text> : null}

      {!nomeDoGoogle ? (
        <AuthField
          label="Nome completo"
          icon="person-outline"
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Maria da Silva"
          autoCapitalize="words"
          error={erros.nome}
        />
      ) : null}

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
            onBlur={() => void consultarCep()}
            placeholder="00000-000"
            keyboardType="numeric"
            maxLength={9}
            error={erros.cep}
          />
        </View>
        <Pressable
          style={[s.cepButton, buscandoCep && s.cepButtonDisabled]}
          onPress={() => void consultarCep()}
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
              setUf(texto.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase())
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

      <Pressable
        style={({ pressed }) => [s.btnAuth, pressed && { opacity: 0.86 }, cadastrando && { opacity: 0.65 }]}
        onPress={() => void handleCadastrar()}
        disabled={cadastrando}
        accessibilityRole="button"
        accessibilityLabel={cadastrando ? 'Cadastrando' : 'Criar conta com o Google'}
        accessibilityState={{ disabled: cadastrando, busy: cadastrando }}
      >
        <Text style={s.btnAuthText}>{cadastrando ? 'Cadastrando...' : 'Criar conta'}</Text>
        {!cadastrando && <AppIcon name="arrow-forward" set="Ionicons" size={18} color={theme.colors.onPrimary} />}
      </Pressable>

      <Pressable
        style={s.cancelar}
        onPress={() => {
          googlePendente.limpar();
          router.replace('/login');
        }}
        disabled={cadastrando}
        accessibilityRole="button"
        accessibilityLabel="Cancelar e voltar ao login"
      >
        <Text style={s.cancelarTexto}>Cancelar</Text>
      </Pressable>
    </AuthLayout>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    conta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      marginBottom: 14,
      borderRadius: 16,
      backgroundColor: theme.colors.input,
    },
    contaTitulo: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
    contaEmail: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 },
    clinica: { color: theme.colors.primary, fontWeight: '700', marginBottom: 18 },
    btnAuth: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingVertical: 19,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    btnAuthText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '700' },
    addressHeader: { marginTop: 2, marginBottom: 14 },
    addressTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
    addressSubtitle: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
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
    cancelar: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
    cancelarTexto: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },
  });
}
