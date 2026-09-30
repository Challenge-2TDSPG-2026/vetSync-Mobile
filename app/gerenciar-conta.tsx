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
import type { AtualizarTutorPayload, DadosTutor } from '../services/tutorService';

type FormularioConta = AtualizarTutorPayload;
type SecaoEdicao = 'contato' | 'endereco' | null;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

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

function formularioDoTutor(tutor: DadosTutor): FormularioConta {
  return {
    nome: tutor.nome,
    telefone: tutor.telefone,
    cep: formatarCep(tutor.cep),
    logradouro: tutor.logradouro,
    numero: tutor.numero,
    complemento: tutor.complemento,
    bairro: tutor.bairro,
    cidade: tutor.cidade,
    uf: tutor.uf,
  };
}

function formatarTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return valor || 'Não informado';
}

function formatarCpf(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length !== 11) return valor || 'Não informado';
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

function valorOuIndisponivel(valor: string | undefined): string {
  return valor?.trim() || 'Não informado';
}

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
  const [secaoEmEdicao, setSecaoEmEdicao] = useState<SecaoEdicao>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (tutor.data && !secaoEmEdicao) setFormulario(formularioDoTutor(tutor.data));
  }, [tutor.data, secaoEmEdicao]);

  function atualizarCampo<K extends keyof FormularioConta>(campo: K, valor: FormularioConta[K]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: '' }));
  }

  function iniciarEdicao(secao: Exclude<SecaoEdicao, null>) {
    if (tutor.data) setFormulario(formularioDoTutor(tutor.data));
    setErros({});
    setSecaoEmEdicao(secao);
  }

  function cancelarEdicao() {
    if (tutor.data) setFormulario(formularioDoTutor(tutor.data));
    setErros({});
    setSecaoEmEdicao(null);
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

  function validar(secao: Exclude<SecaoEdicao, null>): boolean {
    const proximosErros: Record<string, string> = {};
    if (secao === 'contato') {
      if (formulario.nome.trim().length < 2) proximosErros.nome = 'Informe seu nome completo.';
      const telefone = formulario.telefone.replace(/\D/g, '');
      if (telefone && !/^\d{10,11}$/.test(telefone)) {
        proximosErros.telefone = 'Telefone deve ter 10 ou 11 dígitos.';
      }
    } else {
      if (!/^\d{8}$/.test(formulario.cep.replace(/\D/g, ''))) {
        proximosErros.cep = 'Informe os 8 dígitos do CEP.';
      }
      if (!formulario.logradouro.trim()) proximosErros.logradouro = 'Informe o endereço.';
      if (!formulario.numero.trim()) proximosErros.numero = 'Informe o número do endereço.';
      if (!formulario.bairro.trim()) proximosErros.bairro = 'Informe o bairro.';
      if (!formulario.cidade.trim()) proximosErros.cidade = 'Informe a cidade.';
      if (!/^[A-Z]{2}$/.test(formulario.uf.trim().toUpperCase())) {
        proximosErros.uf = 'Informe a sigla do estado.';
      }
    }
    setErros(proximosErros);
    return Object.keys(proximosErros).length === 0;
  }

  async function salvar(secao: Exclude<SecaoEdicao, null>) {
    if (!validar(secao)) return;
    try {
      await atualizarTutor.mutateAsync({ ...formulario, uf: formulario.uf.toUpperCase() });
      setSecaoEmEdicao(null);
      setErros({});
      mostrarToast(
        'sucesso',
        secao === 'contato' ? 'Dados de contato atualizados' : 'Endereço atualizado',
      );
    } catch (erro) {
      mostrarToast(
        'erro',
        'Não foi possível salvar',
        mensagemDeErro(erro, 'Verifique os dados e tente novamente.'),
      );
    }
  }

  const cabecalho = (
    <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
      <Pressable
        style={s.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Voltar para conta"
      >
        <Ionicons name="arrow-back" size={23} color={theme.components.header.icon} />
      </Pressable>
      <View style={s.headerCopy}>
        <Text style={[s.title, modoSimples && sSimples.title]}>Gerenciar conta</Text>
        <Text style={[s.subtitle, modoSimples && sSimples.subtitle]}>
          Consulte e mantenha seus dados atualizados.
        </Text>
      </View>
    </View>
  );

  if (tutor.isLoading) {
    return (
      <View style={s.container}>
        {cabecalho}
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={s.loadingText}>Carregando seus dados...</Text>
        </View>
      </View>
    );
  }

  if (tutor.isError || !tutor.data) {
    return (
      <View style={s.container}>
        {cabecalho}
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={38} color={theme.colors.danger} />
          <Text style={s.errorTitle}>Não foi possível carregar sua conta</Text>
          <Text style={s.errorText}>
            {mensagemDeErro(tutor.error, 'Tente novamente em instantes.')}
          </Text>
          <Pressable
            style={s.retryButton}
            onPress={() => void tutor.refetch()}
            accessibilityRole="button"
          >
            <Text style={s.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const tipoConta =
    sessao?.perfil === 'TUTOR' ? 'Tutor responsável' : valorOuIndisponivel(sessao?.perfil);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {cabecalho}
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 18) + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <CabecalhoSecao
            styles={s}
            simples={modoSimples}
            titulo="Dados pessoais e contato"
            descricao="Informações usadas para identificar e entrar em contato com você."
            editando={secaoEmEdicao === 'contato'}
            edicaoBloqueada={secaoEmEdicao !== null}
            onEditar={() => iniciarEdicao('contato')}
          />

          {secaoEmEdicao === 'contato' ? (
            <>
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
              <View style={s.readonlyGroup}>
                <Detalhe
                  styles={s}
                  simples={modoSimples}
                  icon="mail-outline"
                  label="E-mail"
                  value={valorOuIndisponivel(tutor.data.email)}
                />
                <View style={s.detailDivider} />
                <Detalhe
                  styles={s}
                  simples={modoSimples}
                  icon="card-outline"
                  label="CPF"
                  value={formatarCpf(tutor.data.cpf)}
                />
                <View style={s.detailDivider} />
                <Detalhe
                  styles={s}
                  simples={modoSimples}
                  icon="shield-checkmark-outline"
                  label="Tipo de conta"
                  value={tipoConta}
                />
              </View>
              <AcoesEdicao
                styles={s}
                simples={modoSimples}
                salvando={atualizarTutor.isPending}
                onCancelar={cancelarEdicao}
                onSalvar={() => void salvar('contato')}
              />
            </>
          ) : (
            <View style={s.detailsList}>
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="person-outline"
                label="Nome completo"
                value={valorOuIndisponivel(tutor.data.nome)}
              />
              <View style={s.detailDivider} />
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="call-outline"
                label="Telefone"
                value={formatarTelefone(tutor.data.telefone)}
              />
              <View style={s.detailDivider} />
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="mail-outline"
                label="E-mail"
                value={valorOuIndisponivel(tutor.data.email)}
              />
              <View style={s.detailDivider} />
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="card-outline"
                label="CPF"
                value={formatarCpf(tutor.data.cpf)}
              />
              <View style={s.detailDivider} />
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="shield-checkmark-outline"
                label="Tipo de conta"
                value={tipoConta}
              />
            </View>
          )}
        </View>

        <View style={s.card}>
          <CabecalhoSecao
            styles={s}
            simples={modoSimples}
            titulo="Endereço"
            descricao={
              secaoEmEdicao === 'endereco'
                ? 'Informe o CEP para preencher automaticamente os dados disponíveis.'
                : 'Endereço residencial vinculado à sua conta.'
            }
            editando={secaoEmEdicao === 'endereco'}
            edicaoBloqueada={secaoEmEdicao !== null}
            onEditar={() => iniciarEdicao('endereco')}
          />

          {secaoEmEdicao === 'endereco' ? (
            <>
              <View style={s.cepRow}>
                <View style={s.cepCopy}>
                  <Campo
                    styles={s}
                    simples={modoSimples}
                    label="CEP"
                    value={formulario.cep}
                    onChangeText={(valor) => atualizarCampo('cep', formatarCep(valor))}
                    onBlur={() => void consultarCep()}
                    error={erros.cep}
                    keyboardType="numeric"
                    placeholder="00000-000"
                  />
                </View>
                <Pressable
                  style={[s.cepButton, buscandoCep && s.buttonDisabled]}
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
              <View style={s.shortFieldsRow}>
                <View style={s.numberField}>
                  <Campo
                    styles={s}
                    simples={modoSimples}
                    label="Número"
                    value={formulario.numero}
                    onChangeText={(valor) => atualizarCampo('numero', valor)}
                    error={erros.numero}
                    autoCapitalize="characters"
                    placeholder="123 ou S/N"
                  />
                </View>
                <View style={s.ufField}>
                  <Campo
                    styles={s}
                    simples={modoSimples}
                    label="UF"
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
              </View>
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
              <AcoesEdicao
                styles={s}
                simples={modoSimples}
                salvando={atualizarTutor.isPending}
                onCancelar={cancelarEdicao}
                onSalvar={() => void salvar('endereco')}
              />
            </>
          ) : (
            <View style={s.detailsList}>
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="map-outline"
                label="CEP"
                value={valorOuIndisponivel(formatarCep(tutor.data.cep))}
              />
              <View style={s.detailDivider} />
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="location-outline"
                label="Endereço"
                value={valorOuIndisponivel(
                  [tutor.data.logradouro, tutor.data.numero].filter(Boolean).join(', '),
                )}
              />
              <View style={s.detailDivider} />
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="business-outline"
                label="Complemento"
                value={valorOuIndisponivel(tutor.data.complemento)}
              />
              <View style={s.detailDivider} />
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="navigate-outline"
                label="Bairro"
                value={valorOuIndisponivel(tutor.data.bairro)}
              />
              <View style={s.detailDivider} />
              <Detalhe
                styles={s}
                simples={modoSimples}
                icon="pin-outline"
                label="Cidade e estado"
                value={valorOuIndisponivel(
                  [tutor.data.cidade, tutor.data.uf].filter(Boolean).join(' - '),
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CabecalhoSecao({
  styles,
  simples,
  titulo,
  descricao,
  editando,
  edicaoBloqueada,
  onEditar,
}: {
  styles: ReturnType<typeof createStyles>;
  simples: boolean;
  titulo: string;
  descricao: string;
  editando: boolean;
  edicaoBloqueada: boolean;
  onEditar: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={[styles.cardTitle, simples && sSimples.cardTitle]}>{titulo}</Text>
        <Text style={[styles.cardHint, simples && sSimples.cardHint]}>{descricao}</Text>
      </View>
      {editando ? (
        <View style={styles.editingBadge}>
          <Text style={styles.editingBadgeText}>Em edição</Text>
        </View>
      ) : (
        <Pressable
          style={[styles.editButton, edicaoBloqueada && styles.buttonDisabled]}
          onPress={onEditar}
          disabled={edicaoBloqueada}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${titulo.toLocaleLowerCase('pt-BR')}`}
        >
          <Ionicons name="create-outline" size={17} color={styles.editButtonText.color} />
          <Text style={[styles.editButtonText, simples && sSimples.editButtonText]}>Editar</Text>
        </Pressable>
      )}
    </View>
  );
}

function Detalhe({
  styles,
  simples,
  icon,
  label,
  value,
}: {
  styles: ReturnType<typeof createStyles>;
  simples: boolean;
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.detailRow, simples && sSimples.detailRow]}>
      <View style={[styles.detailIcon, simples && sSimples.detailIcon]}>
        <Ionicons name={icon} size={simples ? 23 : 18} color={styles.editButtonText.color} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={[styles.detailLabel, simples && sSimples.detailLabel]}>{label}</Text>
        <Text style={[styles.detailValue, simples && sSimples.detailValue]}>{value}</Text>
      </View>
    </View>
  );
}

function AcoesEdicao({
  styles,
  simples,
  salvando,
  onCancelar,
  onSalvar,
}: {
  styles: ReturnType<typeof createStyles>;
  simples: boolean;
  salvando: boolean;
  onCancelar: () => void;
  onSalvar: () => void;
}) {
  return (
    <View style={styles.actions}>
      <Pressable
        style={[styles.cancelButton, salvando && styles.buttonDisabled]}
        onPress={onCancelar}
        disabled={salvando}
        accessibilityRole="button"
      >
        <Text style={[styles.cancelButtonText, simples && sSimples.actionText]}>Cancelar</Text>
      </Pressable>
      <Pressable
        style={[styles.saveButton, salvando && styles.buttonDisabled]}
        onPress={onSalvar}
        disabled={salvando}
        accessibilityRole="button"
      >
        {salvando ? (
          <ActivityIndicator size="small" color={styles.saveButtonText.color} />
        ) : (
          <Ionicons name="checkmark-outline" size={20} color={styles.saveButtonText.color} />
        )}
        <Text style={[styles.saveButtonText, simples && sSimples.actionText]}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </Text>
      </Pressable>
    </View>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingHorizontal: 18,
      paddingBottom: 15,
      backgroundColor: theme.components.header.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.components.header.border,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.components.header.accountIconBackground,
    },
    headerCopy: { flex: 1, minWidth: 0 },
    title: {
      color: theme.components.header.title,
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -0.55,
    },
    subtitle: {
      color: theme.components.header.accountSubtext,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 2,
    },
    content: { paddingHorizontal: 16, paddingTop: 18 },
    center: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
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
    card: {
      borderRadius: 20,
      backgroundColor: theme.pages.tutorProfile.card,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      padding: 16,
      marginBottom: 16,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    sectionHeaderCopy: { flex: 1, minWidth: 0 },
    cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
    cardHint: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
    editButton: {
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      borderRadius: 12,
      paddingHorizontal: 11,
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
    },
    editButtonText: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
    editingBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
      backgroundColor: theme.colors.successBackground,
    },
    editingBadgeText: {
      color: theme.colors.success,
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    detailsList: {
      marginTop: 14,
      borderRadius: 16,
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
      overflow: 'hidden',
    },
    readonlyGroup: {
      marginTop: 18,
      borderRadius: 16,
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
      overflow: 'hidden',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      paddingHorizontal: 13,
      paddingVertical: 12,
    },
    detailIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.pages.tutorProfile.cardElevated,
    },
    detailCopy: { flex: 1, minWidth: 0 },
    detailLabel: {
      color: theme.colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      marginBottom: 2,
    },
    detailValue: { color: theme.colors.text, fontSize: 14, fontWeight: '700', lineHeight: 19 },
    detailDivider: { height: 1, marginLeft: 60, backgroundColor: theme.pages.tutorProfile.border },
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
    cepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
    cepCopy: { flex: 1 },
    cepButton: {
      marginTop: 38,
      minHeight: 50,
      minWidth: 76,
      paddingHorizontal: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
    },
    cepButtonText: { color: theme.colors.onPrimary, fontSize: 13, fontWeight: '800' },
    shortFieldsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    numberField: { flex: 1 },
    ufField: { width: 92 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    cancelButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.pages.tutorProfile.card,
    },
    cancelButtonText: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
    saveButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 14,
      flexDirection: 'row',
      gap: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    saveButtonText: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '800' },
    buttonDisabled: { opacity: 0.5 },
  });

const sSimples = StyleSheet.create({
  title: { fontSize: 31 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  cardTitle: { fontSize: 23 },
  cardHint: { fontSize: 16, lineHeight: 23 },
  editButtonText: { fontSize: 16 },
  detailRow: { paddingVertical: 16, gap: 14 },
  detailIcon: { width: 46, height: 46, borderRadius: 15 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 18, lineHeight: 24 },
  label: { fontSize: 17 },
  input: { minHeight: 61, fontSize: 20 },
  fieldError: { fontSize: 14 },
  actionText: { fontSize: 18 },
});
