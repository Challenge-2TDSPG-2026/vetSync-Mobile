import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import { mensagemDeErro } from '../../services/api/errorMessages';
import { type PermissaoResponsavel } from '../../services/responsavelService';
import {
  useCriarConviteResponsavel,
  useResponsaveis,
  useRevogarResponsavel,
} from '../../hooks/useResponsaveis';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../../components/ui/Toast';
import type { AppTheme } from '../../constants/theme';

export default function ResponsaveisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { modoSimples } = useAccessibility();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [permissao, setPermissao] = useState<PermissaoResponsavel>('LEITURA');
  const responsaveis = useResponsaveis();
  const criarConvite = useCriarConviteResponsavel();
  const revogarResponsavel = useRevogarResponsavel();

  async function convidar() {
    const emailNormalizado = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      mostrarToast('erro', 'E-mail inválido', 'Informe um e-mail válido para enviar o convite.');
      return;
    }

    try {
      const convite = await criarConvite.mutateAsync({ email: emailNormalizado, permissao });
      setEmail('');
      mostrarToast(
        'sucesso',
        'Convite enviado',
        `O convite para ${convite.email} expira em ${formatarData(convite.expiraEm)}.`,
      );
    } catch (erro) {
      mostrarToast(
        'erro',
        'Não foi possível enviar o convite',
        mensagemDeErro(erro, 'Tente novamente em instantes.'),
      );
    }
  }

  function confirmarRevogacao(idResponsavel: string, nome: string) {
    confirmar(
      `Remover ${nome} dos responsáveis?`,
      'Essa pessoa perderá o acesso a todos os seus pets.',
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        {
          texto: 'Remover',
          estilo: 'destructive',
          aoConfirmar: async () => {
            try {
              await revogarResponsavel.mutateAsync(idResponsavel);
              mostrarToast('sucesso', 'Responsável removido');
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
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 18) + 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.hero}>
          <Image
            source={require('../../assets/images/responsibles.png')}
            style={s.heroImage}
            resizeMode="cover"
            accessibilityLabel="Pessoas responsáveis compartilhando os cuidados dos pets"
          />
          <Pressable
            style={[s.backButton, { top: Math.max(insets.top, 12) }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a conta"
          >
            <Ionicons name="arrow-back" size={23} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={s.body}>
          <Text style={[s.title, modoSimples && sSimples.title]}>Responsáveis</Text>
          <Text style={[s.intro, modoSimples && sSimples.intro]}>
            Convide uma pessoa de confiança para acompanhar todos os seus pets no VetSync.
          </Text>

          <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Enviar convite</Text>
          <View style={s.card}>
            <Text style={[s.cardIntro, modoSimples && sSimples.cardIntro]}>
              A pessoa receberá um e-mail para criar a conta e terá acesso aos seus pets atuais e
              futuros.
            </Text>

            <Text style={[s.label, modoSimples && sSimples.label]}>E-mail do responsável</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="nome@email.com"
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!criarConvite.isPending}
              style={[s.input, modoSimples && sSimples.input]}
              accessibilityLabel="E-mail do responsável"
            />

            <Text style={[s.label, s.permissionLabel, modoSimples && sSimples.label]}>
              Permissão
            </Text>
            <View style={s.permissionOptions}>
              <PermissionOption
                styles={s}
                simples={modoSimples}
                selected={permissao === 'LEITURA'}
                icon="eye-outline"
                title="Acompanhar"
                description="Pode visualizar informações e lembretes"
                onPress={() => setPermissao('LEITURA')}
              />
              <PermissionOption
                styles={s}
                simples={modoSimples}
                selected={permissao === 'EDICAO'}
                icon="create-outline"
                title="Acompanhar e editar"
                description="Pode visualizar, agendar e atualizar informações"
                onPress={() => setPermissao('EDICAO')}
              />
            </View>

            <View style={s.permissionHint}>
              <Ionicons name="shield-checkmark-outline" size={21} color={theme.colors.primary} />
              <Text style={[s.permissionHintText, modoSimples && sSimples.hint]}>
                Somente você poderá convidar ou remover responsáveis.
              </Text>
            </View>

            <Pressable
              style={[s.primaryButton, criarConvite.isPending && s.buttonDisabled]}
              onPress={() => void convidar()}
              disabled={criarConvite.isPending}
              accessibilityRole="button"
            >
              {criarConvite.isPending ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Ionicons name="mail-outline" size={21} color={theme.colors.onPrimary} />
              )}
              <Text style={[s.primaryButtonText, modoSimples && sSimples.buttonText]}>
                {criarConvite.isPending ? 'Enviando convite...' : 'Enviar convite'}
              </Text>
            </Pressable>
          </View>

          <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>
            Responsáveis cadastrados
          </Text>
          <View style={s.listCard}>
            {responsaveis.isLoading ? (
              <ActivityIndicator color={theme.colors.primary} style={s.loader} />
            ) : null}
            {responsaveis.isError ? (
              <View style={s.feedback}>
                <Text style={s.errorText}>
                  {mensagemDeErro(responsaveis.error, 'Não foi possível carregar os responsáveis.')}
                </Text>
                <Pressable onPress={() => void responsaveis.refetch()} accessibilityRole="button">
                  <Text style={s.retryText}>Tentar novamente</Text>
                </Pressable>
              </View>
            ) : null}
            {!responsaveis.isLoading &&
            !responsaveis.isError &&
            (responsaveis.data?.length ?? 0) === 0 ? (
              <View style={s.emptyState}>
                <View style={s.emptyIcon}>
                  <Ionicons name="people-outline" size={28} color={theme.colors.primary} />
                </View>
                <Text style={[s.emptyTitle, modoSimples && sSimples.emptyTitle]}>
                  Nenhum responsável cadastrado
                </Text>
                <Text style={[s.emptyText, modoSimples && sSimples.emptyText]}>
                  As pessoas aparecerão aqui depois que aceitarem o convite.
                </Text>
              </View>
            ) : null}
            {responsaveis.data?.map((responsavel, index) => (
              <View key={responsavel.idResponsavel}>
                {index > 0 ? <View style={s.divider} /> : null}
                <View style={s.responsibleRow}>
                  <View style={s.responsibleIcon}>
                    <Ionicons name="person-outline" size={23} color={theme.colors.primary} />
                  </View>
                  <View style={s.responsibleCopy}>
                    <Text style={[s.responsibleName, modoSimples && sSimples.responsibleName]}>
                      {responsavel.nome}
                    </Text>
                    <Text style={[s.responsibleEmail, modoSimples && sSimples.responsibleEmail]}>
                      {responsavel.email}
                    </Text>
                    <Text style={s.responsiblePermission}>
                      {responsavel.permissao === 'EDICAO'
                        ? 'Pode acompanhar e editar'
                        : 'Pode acompanhar'}
                    </Text>
                  </View>
                  <Pressable
                    style={s.removeButton}
                    onPress={() => confirmarRevogacao(responsavel.idResponsavel, responsavel.nome)}
                    disabled={revogarResponsavel.isPending}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${responsavel.nome} dos responsáveis`}
                  >
                    <Ionicons name="person-remove-outline" size={21} color={theme.colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PermissionOption({
  styles,
  simples,
  selected,
  icon,
  title,
  description,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  simples: boolean;
  selected: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={[styles.permissionOption, selected && styles.permissionOptionSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
        <Ionicons
          name={icon}
          size={simples ? 25 : 21}
          color={selected ? theme.colors.onPrimary : theme.colors.primary}
        />
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, simples && sSimples.optionTitle]}>{title}</Text>
        <Text style={[styles.optionDescription, simples && sSimples.optionDescription]}>
          {description}
        </Text>
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? theme.colors.primary : theme.colors.textMuted}
      />
    </Pressable>
  );
}

function formatarData(data: string): string {
  const valor = new Date(data);
  return Number.isNaN(valor.getTime()) ? 'em breve' : valor.toLocaleDateString('pt-BR');
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    hero: { position: 'relative' },
    heroImage: { width: '100%', height: 270 },
    backButton: {
      position: 'absolute',
      left: 18,
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.pages.manageAccess.cardElevated,
      borderWidth: 1,
      borderColor: theme.pages.manageAccess.border,
    },
    body: { paddingHorizontal: 22, paddingTop: 28 },
    title: {
      color: theme.colors.text,
      fontSize: 38,
      fontWeight: '800',
      letterSpacing: -1.1,
      lineHeight: 44,
    },
    intro: {
      color: theme.colors.textSecondary,
      fontSize: 20,
      lineHeight: 30,
      marginTop: 14,
      maxWidth: 560,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.4,
      marginTop: 34,
      marginBottom: 13,
    },
    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.pages.manageAccess.border,
      backgroundColor: theme.pages.manageAccess.card,
      padding: 17,
    },
    cardIntro: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21 },
    label: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 8,
      marginTop: 20,
    },
    input: {
      minHeight: 54,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.pages.manageAccess.border,
      backgroundColor: theme.colors.input,
      paddingHorizontal: 14,
      color: theme.colors.text,
      fontSize: 16,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
    },
    permissionLabel: { marginTop: 22 },
    permissionOptions: { gap: 9 },
    permissionOption: {
      minHeight: 74,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.pages.manageAccess.border,
      backgroundColor: theme.pages.manageAccess.cardSecondary,
    },
    permissionOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.successBackground,
    },
    optionIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.successBackground,
    },
    optionIconSelected: { backgroundColor: theme.colors.primary },
    optionCopy: { flex: 1, minWidth: 0 },
    optionTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
    optionDescription: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 2,
    },
    permissionHint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      borderRadius: 15,
      backgroundColor: theme.colors.successBackground,
      padding: 13,
      marginTop: 18,
    },
    permissionHintText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    primaryButton: {
      minHeight: 57,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      marginTop: 20,
    },
    primaryButtonText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '800' },
    buttonDisabled: { opacity: 0.6 },
    listCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.pages.manageAccess.border,
      backgroundColor: theme.pages.manageAccess.card,
      overflow: 'hidden',
    },
    loader: { marginVertical: 28 },
    feedback: { alignItems: 'center', padding: 22 },
    errorText: { color: theme.colors.danger, textAlign: 'center', fontSize: 14, lineHeight: 20 },
    retryText: { color: theme.colors.primary, fontSize: 14, fontWeight: '800', marginTop: 12 },
    emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 30 },
    emptyIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.successBackground,
    },
    emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginTop: 13 },
    emptyText: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
    },
    responsibleRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15 },
    responsibleIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.successBackground,
    },
    responsibleCopy: { flex: 1, minWidth: 0 },
    responsibleName: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
    responsibleEmail: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
    responsiblePermission: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 4,
    },
    removeButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.dangerBackground,
    },
    divider: { height: 1, backgroundColor: theme.pages.manageAccess.border, marginLeft: 72 },
  });

const sSimples = StyleSheet.create({
  title: { fontSize: 42, lineHeight: 48 },
  intro: { fontSize: 22, lineHeight: 32 },
  sectionTitle: { fontSize: 28 },
  cardIntro: { fontSize: 18, lineHeight: 26 },
  label: { fontSize: 18 },
  input: { minHeight: 64, fontSize: 20 },
  optionTitle: { fontSize: 20 },
  optionDescription: { fontSize: 16, lineHeight: 22 },
  hint: { fontSize: 16, lineHeight: 23 },
  buttonText: { fontSize: 21 },
  emptyTitle: { fontSize: 21 },
  emptyText: { fontSize: 17, lineHeight: 24 },
  responsibleName: { fontSize: 20 },
  responsibleEmail: { fontSize: 16 },
});
