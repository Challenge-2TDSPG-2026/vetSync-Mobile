import { EmojiFilteredTextInput } from '../../components/ui/EmojiFilteredTextInput';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PetSwitcher } from '../../components/PetSwitcher';
import { mostrarToast } from '../../components/ui/Toast';
import { useAccessibility } from '../../context/AccessibilityContext';
import { usePet } from '../../context/PetContext';
import { useTheme } from '../../context/ThemeContext';
import {
  useAcessosPet,
  useAtividadesPet,
  useCriarConvitePet,
  useRevogarAcessoPet,
} from '../../hooks/usePetAcessos';
import { ApiError } from '../../services/api/httpClient';
import { mensagemDeErro } from '../../services/api/errorMessages';
import type { PermissaoPet, RelacaoPet } from '../../services/petAcessoService';
import type { TipoAtividadePet } from '../../services/petAtividadeService';
import { confirmar } from '../../utils/alert';
import type { AppTheme } from '../../constants/theme';
import { IllustratedPageHero } from '../../components/ui/IllustratedPageHero';

const RELACOES: { valor: RelacaoPet; label: string }[] = [
  { valor: 'CUIDADOR', label: 'Cuidador' },
  { valor: 'CONJUGE', label: 'Cônjuge' },
  { valor: 'OUTRO', label: 'Outro' },
];

const PERMISSOES: { valor: PermissaoPet; label: string; descricao: string }[] = [
  { valor: 'LEITURA', label: 'Acompanhar', descricao: 'Vê informações e lembretes do pet' },
  { valor: 'EDICAO', label: 'Acompanhar e editar', descricao: 'Também agenda e atualiza dados' },
  {
    valor: 'VISUALIZAR_PRONTUARIO',
    label: 'Acompanhar e ver prontuário',
    descricao: 'Vê também o prontuário clínico',
  },
];

const ICONE_ATIVIDADE: Record<TipoAtividadePet, React.ComponentProps<typeof Ionicons>['name']> = {
  CONVITE_ENVIADO: 'mail-outline',
  CONVITE_ACEITO: 'checkmark-circle-outline',
  ACESSO_CONCEDIDO: 'key-outline',
  ACESSO_REVOGADO: 'person-remove-outline',
  PET_ATUALIZADO: 'create-outline',
  EVENTO_AGENDADO: 'calendar-outline',
  EVENTO_CONCLUIDO: 'checkmark-done-outline',
  EVENTO_CANCELADO: 'close-circle-outline',
  PRONTUARIO_VISUALIZADO: 'document-text-outline',
  OUTRO: 'ellipse-outline',
};

function rotuloPermissao(p: PermissaoPet): string {
  return PERMISSOES.find((x) => x.valor === p)?.label ?? p;
}
function rotuloRelacao(r: RelacaoPet): string {
  return RELACOES.find((x) => x.valor === r)?.label ?? r;
}
function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
function formatarData(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
}

export default function AcessoCompartilhadoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const s = useMemo(() => createStyles(theme, modoSimples), [theme, modoSimples]);
  const { petAtivo, petAtivoId } = usePet();

  const [email, setEmail] = useState('');
  const [relacao, setRelacao] = useState<RelacaoPet>('CUIDADOR');
  const [permissao, setPermissao] = useState<PermissaoPet>('LEITURA');

  const acessos = useAcessosPet(petAtivoId);
  const atividades = useAtividadesPet(petAtivoId);
  const criarConvite = useCriarConvitePet(petAtivoId);
  const revogar = useRevogarAcessoPet(petAtivoId);

  const ativos = (acessos.data ?? []).filter((a) => a.status === 'ATIVO');
  const revogados = (acessos.data ?? []).filter((a) => a.status === 'REVOGADO');
  const atividadeIndisponivel =
    atividades.error instanceof ApiError &&
    (atividades.error.status === 404 || atividades.error.status === 501);

  async function convidar() {
    const emailNormalizado = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      mostrarToast('erro', 'E-mail inválido', 'Informe um e-mail válido para enviar o convite.');
      return;
    }
    try {
      const convite = await criarConvite.mutateAsync({ email: emailNormalizado, relacao, permissao });
      setEmail('');
      mostrarToast(
        'sucesso',
        'Convite enviado',
        `${convite.email} receberá acesso a ${convite.nomePet} ao aceitar.`,
      );
    } catch (erro) {
      mostrarToast(
        'erro',
        'Não foi possível enviar o convite',
        mensagemDeErro(erro, 'Tente novamente em instantes.', {
          403: 'Somente o tutor proprietário pode convidar cuidadores.',
          409: 'Você não pode convidar a si mesmo, ou essa pessoa já tem acesso a este pet.',
        }),
      );
    }
  }

  function confirmarRevogacao(idAcesso: string, nome: string) {
    confirmar(
      `Remover o acesso de ${nome}?`,
      `${nome} deixará de ver ${petAtivo?.nome ?? 'este pet'}. As alterações já feitas continuam no histórico.`,
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        {
          texto: 'Remover',
          estilo: 'destructive',
          aoConfirmar: async () => {
            try {
              await revogar.mutateAsync(idAcesso);
              mostrarToast('sucesso', 'Acesso removido');
            } catch (erro) {
              mostrarToast(
                'erro',
                'Não foi possível remover',
                mensagemDeErro(erro, 'Tente novamente em instantes.'),
              );
            }
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={theme.pages.shared.heroBackground} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 18) + 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <IllustratedPageHero
          image={require('../../assets/images/sharedAccess.png')}
          title="Acesso compartilhado"
          subtitle="Escolha quem pode acompanhar cada pet e quais ações essa pessoa pode fazer."
          icon="people-outline"
          accessibilityLabel="Tutor e veterinária compartilhando o cuidado de um pet"
          simple={modoSimples}
          onBack={() => router.back()}
          compactControls
        />
        <PetSwitcher />

        {!petAtivo ? (
          <Text style={s.muted}>Cadastre um pet para compartilhar o acesso.</Text>
        ) : (
          <>
            {/* QUEM TEM ACESSO */}
            <Text style={s.sectionTitle}>Quem tem acesso a {petAtivo.nome}</Text>
            <View style={s.card}>
              <View style={s.row}>
                <View style={[s.avatar, s.avatarOwner]}>
                  <Ionicons name="star-outline" size={22} color={theme.colors.onPrimary} />
                </View>
                <View style={s.rowCopy}>
                  <Text style={s.rowTitle}>{petAtivo.tutor?.nome ?? 'Você'}</Text>
                  <Text style={s.rowMeta}>Tutor proprietário · acesso total</Text>
                </View>
              </View>

              {acessos.isLoading ? <ActivityIndicator color={theme.colors.primary} style={s.loader} /> : null}
              {acessos.isError ? (
                <View style={s.feedback}>
                  <Text style={s.errorText}>
                    {mensagemDeErro(acessos.error, 'Não foi possível carregar os acessos.')}
                  </Text>
                  <Pressable onPress={() => void acessos.refetch()} accessibilityRole="button">
                    <Text style={s.retryText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : null}

              {ativos.map((acesso) => (
                <View key={acesso.idAcesso}>
                  <View style={s.divider} />
                  <View style={s.row}>
                    <View style={s.avatar}>
                      <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={s.rowCopy}>
                      <Text style={s.rowTitle}>{acesso.nomeTutor}</Text>
                      <Text style={s.rowMeta}>{acesso.emailTutor}</Text>
                      <Text style={s.badge}>
                        {rotuloRelacao(acesso.relacao)} · {rotuloPermissao(acesso.permissao)}
                        {formatarData(acesso.dtConcedido) ? ` · desde ${formatarData(acesso.dtConcedido)}` : ''}
                      </Text>
                    </View>
                    <Pressable
                      style={s.removeButton}
                      onPress={() => confirmarRevogacao(acesso.idAcesso, acesso.nomeTutor)}
                      disabled={revogar.isPending}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover acesso de ${acesso.nomeTutor}`}
                    >
                      <Ionicons name="person-remove-outline" size={20} color={theme.colors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}

              {!acessos.isLoading && !acessos.isError && ativos.length === 0 ? (
                <Text style={s.emptyInline}>
                  Só você tem acesso a {petAtivo.nome} por enquanto. Convide alguém abaixo.
                </Text>
              ) : null}
            </View>
            {revogados.length > 0 ? (
              <Text style={s.muted}>
                {revogados.length} acesso(s) já removido(s) · {revogados.map((r) => r.nomeTutor).join(', ')}
              </Text>
            ) : null}

            {/* CONVIDAR */}
            <Text style={s.sectionTitle}>Convidar outro cuidador</Text>
            <View style={s.card}>
              <View style={s.pad}>
                <Text style={s.label}>E-mail</Text>
                <EmojiFilteredTextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nome@email.com"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!criarConvite.isPending}
                  style={s.input}
                  accessibilityLabel="E-mail do cuidador"
                />

                <Text style={s.label}>Relação com o pet</Text>
                <View style={s.chips}>
                  {RELACOES.map((r) => (
                    <Pressable
                      key={r.valor}
                      style={[s.chip, relacao === r.valor && s.chipSelected]}
                      onPress={() => setRelacao(r.valor)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: relacao === r.valor }}
                    >
                      <Text style={[s.chipText, relacao === r.valor && s.chipTextSelected]}>{r.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={s.label}>O que a pessoa pode fazer</Text>
                {PERMISSOES.map((p) => {
                  const selecionada = permissao === p.valor;
                  return (
                    <Pressable
                      key={p.valor}
                      style={[s.option, selecionada && s.optionSelected]}
                      onPress={() => setPermissao(p.valor)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selecionada }}
                    >
                      <View style={s.rowCopy}>
                        <Text style={s.rowTitle}>{p.label}</Text>
                        <Text style={s.rowMeta}>{p.descricao}</Text>
                      </View>
                      <Ionicons
                        name={selecionada ? 'radio-button-on' : 'radio-button-off'}
                        size={22}
                        color={selecionada ? theme.colors.primary : theme.colors.textMuted}
                      />
                    </Pressable>
                  );
                })}

                <Pressable
                  style={[s.primaryButton, criarConvite.isPending && s.disabled]}
                  onPress={() => void convidar()}
                  disabled={criarConvite.isPending}
                  accessibilityRole="button"
                >
                  {criarConvite.isPending ? (
                    <ActivityIndicator color={theme.colors.onPrimary} />
                  ) : (
                    <Ionicons name="mail-outline" size={21} color={theme.colors.onPrimary} />
                  )}
                  <Text style={s.primaryButtonText}>
                    {criarConvite.isPending ? 'Enviando convite...' : `Convidar para cuidar de ${petAtivo.nome}`}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* ATIVIDADE */}
            <Text style={s.sectionTitle}>Atividade recente</Text>
            <View style={s.card}>
              {atividades.isLoading ? <ActivityIndicator color={theme.colors.primary} style={s.loader} /> : null}

              {atividadeIndisponivel ? (
                <View style={s.feedback}>
                  <Ionicons name="time-outline" size={26} color={theme.colors.textMuted} />
                  <Text style={s.emptyInline}>
                    O histórico de atividade ainda não está disponível no servidor.
                  </Text>
                </View>
              ) : atividades.isError ? (
                <View style={s.feedback}>
                  <Text style={s.errorText}>
                    {mensagemDeErro(atividades.error, 'Não foi possível carregar o histórico.')}
                  </Text>
                  <Pressable onPress={() => void atividades.refetch()} accessibilityRole="button">
                    <Text style={s.retryText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : null}

              {!atividades.isLoading && !atividades.isError && (atividades.data?.length ?? 0) === 0 ? (
                <Text style={s.emptyInline}>
                  Nada por aqui ainda. Quando alguém alterar dados de {petAtivo.nome}, aparece aqui.
                </Text>
              ) : null}

              {atividades.data?.map((item, i) => (
                <View key={item.idAtividade}>
                  {i > 0 ? <View style={s.divider} /> : null}
                  <View style={s.row}>
                    <View style={s.avatar}>
                      <Ionicons name={ICONE_ATIVIDADE[item.tipo]} size={20} color={theme.colors.primary} />
                    </View>
                    <View style={s.rowCopy}>
                      <Text style={s.rowTitle}>{item.descricao}</Text>
                      <Text style={s.rowMeta}>
                        {item.autorNome} · {formatarDataHora(item.dtAtividade)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme, simples: boolean) => {
  const k = simples ? 1.2 : 1;
  const border = theme.pages.manageAccess.border;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 8 },
    backButton: {
      width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.pages.manageAccess.cardElevated, borderWidth: 1, borderColor: border,
    },
    headerCopy: { flex: 1 },
    title: { color: theme.colors.text, fontSize: 26 * k, fontWeight: '800', letterSpacing: -0.6 },
    subtitle: { color: theme.colors.textSecondary, fontSize: 14 * k, marginTop: 2 },
    content: { paddingHorizontal: 18, paddingTop: 8 },
    sectionTitle: { color: theme.colors.text, fontSize: 20 * k, fontWeight: '800', marginTop: 26, marginBottom: 12 },
    card: { borderRadius: 22, borderWidth: 1, borderColor: border, backgroundColor: theme.pages.manageAccess.card, overflow: 'hidden' },
    pad: { padding: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitle: { color: theme.colors.text, fontSize: 15 * k, fontWeight: '800' },
    rowMeta: { color: theme.colors.textSecondary, fontSize: 12 * k, lineHeight: 17 * k, marginTop: 2 },
    badge: { color: theme.colors.primary, fontSize: 11 * k, fontWeight: '700', marginTop: 4 },
    avatar: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.successBackground },
    avatarOwner: { backgroundColor: theme.colors.primary },
    divider: { height: 1, backgroundColor: border, marginLeft: 70 },
    removeButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.dangerBackground },
    loader: { marginVertical: 24 },
    feedback: { alignItems: 'center', padding: 20, gap: 6 },
    errorText: { color: theme.colors.danger, textAlign: 'center', fontSize: 14, lineHeight: 20 },
    retryText: { color: theme.colors.primary, fontSize: 14, fontWeight: '800', marginTop: 8 },
    emptyInline: { color: theme.colors.textSecondary, fontSize: 13 * k, lineHeight: 19 * k, textAlign: 'center', padding: 18 },
    muted: { color: theme.colors.textMuted, fontSize: 12 * k, marginTop: 10, lineHeight: 17 * k },
    label: { color: theme.colors.text, fontSize: 14 * k, fontWeight: '800', marginTop: 16, marginBottom: 8 },
    input: {
      minHeight: 54 * k, borderRadius: 15, borderWidth: 1, borderColor: border, backgroundColor: theme.colors.input,
      paddingHorizontal: 14, color: theme.colors.text, fontSize: 16 * k,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: border, backgroundColor: theme.pages.manageAccess.cardSecondary },
    chipSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.successBackground },
    chipText: { color: theme.colors.textSecondary, fontSize: 14 * k, fontWeight: '700' },
    chipTextSelected: { color: theme.colors.primary },
    option: {
      flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1,
      borderColor: border, backgroundColor: theme.pages.manageAccess.cardSecondary, marginBottom: 8,
    },
    optionSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.successBackground },
    primaryButton: {
      minHeight: 57, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
      borderRadius: 17, backgroundColor: theme.colors.primary, marginTop: 14, paddingHorizontal: 14,
    },
    primaryButtonText: { color: theme.colors.onPrimary, fontSize: 15 * k, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
    disabled: { opacity: 0.6 },
  });
};
