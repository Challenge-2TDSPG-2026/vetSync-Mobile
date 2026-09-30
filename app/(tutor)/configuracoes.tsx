import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import { AppearanceModal } from '../../components/AppearanceModal';
import { LogoutConfirmationModal } from '../../components/LogoutConfirmationModal';
import type { AppTheme } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function iniciaisDoNome(nome: string | undefined): string {
  return (
    nome
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessao, logout } = useAuth();
  const { modoSimples } = useAccessibility();
  const { theme, preference, resolvedTheme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [aparenciaVisivel, setAparenciaVisivel] = useState(false);
  const [sairVisivel, setSairVisivel] = useState(false);

  const descricaoAparencia =
    preference === 'system'
      ? `Seguindo o dispositivo (${resolvedTheme === 'dark' ? 'escuro' : 'claro'})`
      : preference === 'dark'
        ? 'Modo escuro'
        : 'Modo claro';

  async function confirmarLogout() {
    setSairVisivel(false);
    await logout();
    router.replace('/login');
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          style={s.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar para conta"
        >
          <Ionicons name="arrow-back" size={23} color={theme.components.header.icon} />
        </Pressable>
        <Text style={[s.title, modoSimples && sSimples.title]}>Configurações</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 18) + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.accountSummary}>
          <View style={[s.avatar, modoSimples && sSimples.avatar]}>
            <Text style={[s.avatarText, modoSimples && sSimples.avatarText]}>
              {iniciaisDoNome(sessao?.nome)}
            </Text>
          </View>
          <View style={s.accountCopy}>
            <Text style={[s.accountName, modoSimples && sSimples.accountName]} numberOfLines={1}>
              {sessao?.nome || 'Conta VetSync'}
            </Text>
            <Text style={[s.accountEmail, modoSimples && sSimples.accountEmail]} numberOfLines={1}>
              {sessao?.email || 'E-mail não disponível'}
            </Text>
          </View>
        </View>

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>
          Configurações da conta
        </Text>
        <View style={s.listCard}>
          <ConfigItem
            styles={s}
            simples={modoSimples}
            icon="person-circle-outline"
            title="Dados da conta"
            description="Contato e endereço"
            onPress={() => router.push('/gerenciar-conta')}
          />
          <View style={s.divider} />
          <ConfigItem
            styles={s}
            simples={modoSimples}
            icon="shield-checkmark-outline"
            title="Segurança"
            description="Biometria e senha"
            onPress={() => router.push('/(tutor)/(tabs)/seguranca')}
          />
        </View>

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>
          Configurações do aplicativo
        </Text>
        <View style={s.listCard}>
          <ConfigItem
            styles={s}
            simples={modoSimples}
            icon="color-palette-outline"
            title="Aparência"
            description={descricaoAparencia}
            onPress={() => setAparenciaVisivel(true)}
          />
          <View style={s.divider} />
          <ConfigItem
            styles={s}
            simples={modoSimples}
            icon="people-outline"
            title="Responsáveis"
            description="Compartilhe os cuidados dos seus pets"
            onPress={() => router.push('/(tutor)/responsaveis')}
          />
          <View style={s.divider} />
          <ConfigItem
            styles={s}
            simples={modoSimples}
            icon="paw-outline"
            title="Pets cadastrados"
            description="Veja as identificações e dados dos seus pets"
            onPress={() => router.push('/pets-cadastrados')}
          />
        </View>

        <Pressable
          style={[s.logout, modoSimples && sSimples.logout]}
          onPress={() => setSairVisivel(true)}
          accessibilityRole="button"
        >
          <Ionicons
            name="log-out-outline"
            size={modoSimples ? 27 : 21}
            color={theme.colors.danger}
          />
          <Text style={[s.logoutText, modoSimples && sSimples.logoutText]}>Sair da conta</Text>
        </Pressable>
      </ScrollView>

      {aparenciaVisivel ? <AppearanceModal onFechar={() => setAparenciaVisivel(false)} /> : null}
      <LogoutConfirmationModal
        visivel={sairVisivel}
        onFechar={() => setSairVisivel(false)}
        onConfirmarSair={confirmarLogout}
      />
    </View>
  );
}

function ConfigItem({
  styles,
  simples,
  icon,
  title,
  description,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  simples: boolean;
  icon: IconName;
  title: string;
  description: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.item, simples && sSimples.item, !onPress && styles.itemDisabled]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      accessibilityLabel={title}
      accessibilityHint={
        onPress ? `Abre ${title.toLocaleLowerCase('pt-BR')}` : 'Indisponível no momento'
      }
    >
      <View style={[styles.itemIcon, simples && sSimples.itemIcon]}>
        <Ionicons name={icon} size={simples ? 28 : 21} color={styles.itemTitle.color} />
      </View>
      <View style={styles.itemCopy}>
        <Text style={[styles.itemTitle, simples && sSimples.itemTitle]}>{title}</Text>
        <Text style={[styles.itemDescription, simples && sSimples.itemDescription]}>
          {description}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={simples ? 27 : 20} color={styles.chevron.color} />
      ) : (
        <Text style={[styles.comingSoon, simples && sSimples.comingSoon]}>Em breve</Text>
      )}
    </Pressable>
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
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    title: {
      flex: 1,
      color: theme.components.header.title,
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -0.55,
    },
    content: { paddingHorizontal: 16, paddingTop: 20 },
    accountSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      marginBottom: 28,
      paddingHorizontal: 4,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
    },
    avatarText: { color: theme.colors.primary, fontSize: 20, fontWeight: '800' },
    accountCopy: { flex: 1, minWidth: 0 },
    accountName: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
    accountEmail: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 3 },
    sectionTitle: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.85,
      marginBottom: 10,
      paddingLeft: 2,
    },
    listCard: {
      overflow: 'hidden',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      backgroundColor: theme.pages.tutorProfile.card,
      marginBottom: 22,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 15,
      paddingVertical: 15,
    },
    itemDisabled: { opacity: 0.55 },
    itemIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
    },
    itemCopy: { flex: 1, minWidth: 0 },
    itemTitle: { color: theme.colors.primary, fontSize: 15, fontWeight: '800' },
    itemDescription: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 3,
    },
    chevron: { color: theme.colors.textMuted },
    comingSoon: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.pages.tutorProfile.border,
      marginLeft: 69,
    },
    logout: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 56,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerBackground,
      marginTop: 4,
    },
    logoutText: { color: theme.colors.danger, fontSize: 15, fontWeight: '800' },
  });

const sSimples = StyleSheet.create({
  title: { fontSize: 31 },
  avatar: { width: 72, height: 72, borderRadius: 24 },
  avatarText: { fontSize: 25 },
  accountName: { fontSize: 23 },
  accountEmail: { fontSize: 17 },
  sectionTitle: { fontSize: 18 },
  item: { paddingVertical: 20, gap: 16 },
  itemIcon: { width: 58, height: 58, borderRadius: 18 },
  itemTitle: { fontSize: 22 },
  itemDescription: { fontSize: 17, lineHeight: 23 },
  comingSoon: { fontSize: 13 },
  logout: { minHeight: 70 },
  logoutText: { fontSize: 22 },
});
