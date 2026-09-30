import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { buscarEnderecoPorCep, formatarCep } from '../services/cepService';
import { useAtualizarTutor, useTutor } from '../hooks/useTutor';
import { mensagemDeErro } from '../services/api/errorMessages';
import { mostrarToast } from '../components/ui/Toast';
import type { AppTheme } from '../constants/theme';
import type { AtualizarTutorPayload } from '../services/tutorService';

type FormularioConta = AtualizarTutorPayload;

const VAZIO: FormularioConta = {
  nome: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

export default function GerenciarContaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessao } = useAuth();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const s = useMemo(() => createStyles(theme), [theme]);
  const tutor = useTutor(sessao?.idUsuario);
  const atualizarTutor = useAtualizarTutor(sessao?.idUsuario);
  const [formulario, setFormulario] = useState<FormularioConta>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (!tutor.data) return;
    setFormulario({
      nome: tutor.data.nome,
      telefone: tutor.data.telefone,
      cep: formatarCep(tutor.data.cep),
      logradouro: tutor.data.logradouro,
      numero: tutor.data.numero,
      complemento: tutor.data.complemento,
      bairro: tutor.data.bairro,
      cidade: tutor.data.cidade,
      uf: tutor.data.uf,
    });
  }, [tutor.data]);

  function atualizarCampo<K extends keyof FormularioConta>(campo: K, valor: FormularioConta[K]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: '' }));
  }

  async function consultarCep() {
    if (formulario.cep.replace(/\D/g, '').length !== 8) {
      setErros((atual) => ({ ...atual, cep: 'Informe os 8 dígitos do CEP.' }));
      return;
    }
    setBuscandoCep(true);
    try {
      const endereco = await buscarEnderecoPorCep(formulario.cep);
      setFormulario((atual) => ({
        ...atual,
        cep: formatarCep(endereco.cep),
        logradouro: endereco.logradouro,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf,
        complemento: atual.complemento || endereco.complemento,
      }));
      setErros((atual) => ({ ...atual, cep: '', logradouro: '', bairro: '', cidade: '', uf: '' }));
    } catch (erro) {
      setErros((atual) => ({
        ...atual,
        cep: erro instanceof Error ? erro.message : 'Não foi possível consultar o CEP.',
      }));
    } finally {
      setBuscandoCep(false);
    }
  }

  function validar(): boolean {
    const proximosErros: Record<string, string> = {};
    if (formulario.nome.trim().length < 2) proximosErros.nome = 'Informe seu nome completo.';
    const telefone = formulario.telefone.replace(/\D/g, '');
    if (telefone && !/^\d{10,11}$/.test(telefone))
      proximosErros.telefone = 'Telefone deve ter 10 ou 11 dígitos.';
    if (!/^\d{8}$/.test(formulario.cep.replace(/\D/g, '')))
      proximosErros.cep = 'Informe os 8 dígitos do CEP.';
    if (!formulario.logradouro.trim()) proximosErros.logradouro = 'Informe o endereço.';
    if (!formulario.numero.trim()) proximosErros.numero = 'Informe o número do endereço.';
    if (!formulario.bairro.trim()) proximosErros.bairro = 'Informe o bairro.';
    if (!formulario.cidade.trim()) proximosErros.cidade = 'Informe a cidade.';
    if (!/^[A-Z]{2}$/.test(formulario.uf.trim().toUpperCase()))
      proximosErros.uf = 'Informe a sigla do estado.';
    setErros(proximosErros);
    return Object.keys(proximosErros).length === 0;
  }

  async function salvar() {
    if (!validar()) return;
    try {
      await atualizarTutor.mutateAsync({ ...formulario, uf: formulario.uf.toUpperCase() });
      mostrarToast(
        'sucesso',
        'Dados atualizados',
        'Seu endereço e seus dados de contato foram salvos.',
      );
      router.back();
    } catch (erro) {
      mostrarToast(
        'erro',
        'Não foi possível salvar',
        mensagemDeErro(erro, 'Verifique os dados e tente novamente.'),
      );
    }
  }

  if (tutor.isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={s.loadingText}>Carregando seus dados...</Text>
      </View>
    );
  }

  if (tutor.isError) {
    return (
      <View style={s.center}>
        <Ionicons name="cloud-offline-outline" size={38} color={theme.colors.danger} />
        <Text style={s.errorTitle}>Não foi possível carregar sua conta</Text>
        <Text style={s.errorText}>
          {mensagemDeErro(tutor.error, 'Tente novamente em instantes.')}
        </Text>
        <Pressable
          style={s.retryButton}
          onPress={() => {
            void tutor.refetch();
          }}
          accessibilityRole="button"
        >
          <Text style={s.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 18) + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Pressable
            style={s.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para conta"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
          </Pressable>
          <View style={s.headerCopy}>
            <Text style={[s.title, modoSimples && sSimples.title]}>Gerenciar conta</Text>
            <Text style={[s.subtitle, modoSimples && sSimples.subtitle]}>
              Mantenha seus dados de contato e endereço sempre atualizados.
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={[s.cardTitle, modoSimples && sSimples.cardTitle]}>Dados de contato</Text>
          <Campo
            styles={s}
            simples={modoSimples}
            label="Nome completo"
            value={formulario.nome}
            onChangeText={(valor) => atualizarCampo('nome', valor)}
            error={erros.nome}
            autoCapitalize="words"
          />
          <Campo
            styles={s}
            simples={modoSimples}
            label="Telefone"
            value={formulario.telefone}
            onChangeText={(valor) =>
              atualizarCampo('telefone', valor.replace(/\D/g, '').slice(0, 11))
            }
            error={erros.telefone}
            keyboardType="phone-pad"
            placeholder="Somente números"
          />
          <View style={s.readonly}>
            <Ionicons name="mail-outline" size={19} color={theme.colors.textSecondary} />
            <View style={s.readonlyCopy}>
              <Text style={s.readonlyLabel}>E-mail</Text>
              <Text style={s.readonlyValue}>{tutor.data?.email}</Text>
            </View>
          </View>
        </View>

        <View style={s.card}>
          <Text style={[s.cardTitle, modoSimples && sSimples.cardTitle]}>Endereço</Text>
          <Text style={[s.cardHint, modoSimples && sSimples.cardHint]}>
            Digite o CEP e toque em buscar. Nós preenchemos endereço, bairro, cidade e estado para
            você.
          </Text>
          <View style={s.cepRow}>
            <View style={s.cepCopy}>
              <Campo
                styles={s}
                simples={modoSimples}
                label="CEP"
                value={formulario.cep}
                onChangeText={(valor) => atualizarCampo('cep', formatarCep(valor))}
                onBlur={() => {
                  void consultarCep();
                }}
                error={erros.cep}
                keyboardType="numeric"
                placeholder="00000-000"
              />
            </View>
            <Pressable
              style={[s.cepButton, buscandoCep && s.buttonDisabled]}
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
          <Campo
            styles={s}
            simples={modoSimples}
            label="Endereço"
            value={formulario.logradouro}
            onChangeText={(valor) => atualizarCampo('logradouro', valor)}
            error={erros.logradouro}
            autoCapitalize="words"
            placeholder="Rua, avenida ou praça"
          />
          <Campo
            styles={s}
            simples={modoSimples}
            label="Número"
            value={formulario.numero}
            onChangeText={(valor) => atualizarCampo('numero', valor)}
            error={erros.numero}
            autoCapitalize="characters"
            placeholder="Ex: 123 ou S/N"
          />
          <Campo
            styles={s}
            simples={modoSimples}
            label="Complemento (opcional)"
            value={formulario.complemento}
            onChangeText={(valor) => atualizarCampo('complemento', valor)}
            autoCapitalize="sentences"
            placeholder="Ex: Apto 24, bloco B"
          />
          <Campo
            styles={s}
            simples={modoSimples}
            label="Bairro"
            value={formulario.bairro}
            onChangeText={(valor) => atualizarCampo('bairro', valor)}
            error={erros.bairro}
            autoCapitalize="words"
          />
          <Campo
            styles={s}
            simples={modoSimples}
            label="Cidade"
            value={formulario.cidade}
            onChangeText={(valor) => atualizarCampo('cidade', valor)}
            error={erros.cidade}
            autoCapitalize="words"
          />
          <Campo
            styles={s}
            simples={modoSimples}
            label="Estado (UF)"
            value={formulario.uf}
            onChangeText={(valor) =>
              atualizarCampo(
                'uf',
                valor
                  .replace(/[^a-z]/gi, '')
                  .slice(0, 2)
                  .toUpperCase(),
              )
            }
            error={erros.uf}
            autoCapitalize="characters"
            maxLength={2}
            placeholder="SP"
          />
        </View>

        <Pressable
          style={[s.saveButton, atualizarTutor.isPending && s.buttonDisabled]}
          onPress={() => {
            void salvar();
          }}
          disabled={atualizarTutor.isPending}
          accessibilityRole="button"
        >
          {atualizarTutor.isPending ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.onPrimary} />
          )}
          <Text style={[s.saveButtonText, modoSimples && sSimples.saveButtonText]}>
            {atualizarTutor.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({
  styles,
  simples,
  label,
  value,
  onChangeText,
  onBlur,
  error,
  ...props
}: {
  styles: ReturnType<typeof createStyles>;
  simples: boolean;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
} & Pick<
  React.ComponentProps<typeof TextInput>,
  'autoCapitalize' | 'keyboardType' | 'maxLength' | 'placeholder'
>) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, simples && sSimples.label]}>{label}</Text>
      <TextInput
        style={[styles.input, simples && sSimples.input, Boolean(error) && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={props.placeholder}
        placeholderTextColor={styles.placeholder.color}
        autoCapitalize={props.autoCapitalize}
        keyboardType={props.keyboardType}
        maxLength={props.maxLength}
        accessibilityLabel={label}
      />
      {error ? (
        <Text style={[styles.fieldError, simples && sSimples.fieldError]}>{error}</Text>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 18, paddingTop: 18 },
    center: {
      flex: 1,
      padding: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: { color: theme.colors.textSecondary, marginTop: 12, fontSize: 14 },
    errorTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '800', marginTop: 12 },
    errorText: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 7,
      lineHeight: 20,
    },
    retryButton: {
      marginTop: 18,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
    },
    retryButtonText: { color: theme.colors.onPrimary, fontWeight: '800' },
    header: { flexDirection: 'row', gap: 13, alignItems: 'flex-start', marginBottom: 23 },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.successBackground,
    },
    headerCopy: { flex: 1, minWidth: 0 },
    title: { color: theme.colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
    subtitle: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 },
    card: {
      borderRadius: 20,
      backgroundColor: theme.pages.tutorProfile.card,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      padding: 16,
      marginBottom: 16,
    },
    cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
    cardHint: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
      marginBottom: 18,
    },
    field: { marginTop: 16 },
    label: { color: theme.colors.text, fontSize: 13, fontWeight: '800', marginBottom: 7 },
    input: {
      minHeight: 50,
      color: theme.colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      borderRadius: 14,
      paddingHorizontal: 13,
      backgroundColor: theme.colors.input,
    },
    inputError: { borderColor: theme.colors.danger },
    placeholder: { color: theme.colors.placeholder },
    fieldError: { color: theme.colors.danger, fontSize: 11, marginTop: 5 },
    readonly: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 16,
      minHeight: 54,
      borderRadius: 14,
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
      paddingHorizontal: 13,
    },
    readonlyCopy: { flex: 1 },
    readonlyLabel: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700' },
    readonlyValue: { color: theme.colors.text, fontSize: 14, fontWeight: '700', marginTop: 2 },
    cepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
    cepCopy: { flex: 1 },
    cepButton: {
      marginTop: 38,
      minHeight: 50,
      minWidth: 72,
      paddingHorizontal: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
    },
    cepButtonText: { color: theme.colors.onPrimary, fontSize: 13, fontWeight: '800' },
    saveButton: {
      minHeight: 57,
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      gap: 9,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 5,
    },
    saveButtonText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '800' },
    buttonDisabled: { opacity: 0.62 },
  });

const sSimples = StyleSheet.create({
  title: { fontSize: 35 },
  subtitle: { fontSize: 18, lineHeight: 25 },
  cardTitle: { fontSize: 23 },
  cardHint: { fontSize: 16, lineHeight: 23 },
  label: { fontSize: 17 },
  input: { minHeight: 61, fontSize: 20 },
  fieldError: { fontSize: 14 },
  saveButtonText: { fontSize: 21 },
});
