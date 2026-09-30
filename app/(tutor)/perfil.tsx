import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePet } from '../../context/PetContext';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { DicaTela } from '../../components/ui/DicaTela';
import { withAlpha, type AppTheme } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function obterIniciais(nome: string | undefined): string {
  const partes = nome?.trim().split(/\s+/).filter(Boolean) ?? [];
  return (
    partes
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export default function PerfilScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { sessao } = useAuth();
  const { modoSimples } = useAccessibility();
  const { pets } = usePet();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('tutor-perfil');

  const nome = sessao?.nome?.trim() || 'Conta VetSync';
  const email = sessao?.email?.trim() || 'E-mail não disponível';
  const perfil =
    sessao?.perfil === 'TUTOR' ? 'Tutor responsável' : sessao?.perfil || 'Perfil não informado';
  const iniciais = obterIniciais(sessao?.nome);
  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[theme.pages.tutorProfile.heroBackground, theme.pages.tutorProfile.heroAccent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={s.heroGlowOne} />
          <View style={s.heroGlowTwo} />

          <View style={s.heroTop}>
            <View style={[s.avatar, modoSimples && sSimples.avatar]}>
              <Text style={[s.avatarText, modoSimples && sSimples.avatarText]}>{iniciais}</Text>
            </View>
            <View style={s.heroInfo}>
              <Text style={[s.overline, modoSimples && sSimples.overline]}>MINHA CONTA</Text>
              <Text style={[s.heroNome, modoSimples && sSimples.heroNome]} numberOfLines={2}>
                {nome}
              </Text>
              <Text style={[s.heroEmail, modoSimples && sSimples.heroEmail]} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>

          <View style={s.heroFooter}>
            <View style={s.rolePill}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={theme.pages.tutorProfile.heroText}
              />
              <Text style={s.rolePillText}>{perfil}</Text>
            </View>
            <Text style={s.petCount}>
              {pets.length} {pets.length === 1 ? 'pet vinculado' : 'pets vinculados'}
            </Text>
          </View>
        </LinearGradient>

        {dicaVisivel && (
          <DicaTela
            titulo="Sua conta"
            texto="Aqui você acessa seus avisos, compartilha os cuidados do pet com a família e ajusta sua experiência no aplicativo."
            accentColor={theme.colors.primary}
            onFechar={fecharDica}
            simples={modoSimples}
          />
        )}

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Acesso rápido</Text>
        <View style={s.acessosRapidos}>
          <QuickAccessCard
            styles={s}
            theme={theme}
            icon="shield-checkmark-outline"
            title="Segurança"
            description="Biometria e senha"
            color={theme.colors.info}
            onPress={() => router.push('/(tutor)/seguranca')}
            simples={modoSimples}
          />
          <QuickAccessCard
            styles={s}
            theme={theme}
            icon="mail-outline"
            title="Mensagens"
            description="Avisos e lembretes"
            color={theme.colors.primary}
            onPress={() => router.push('/(tutor)/notificacoes')}
            simples={modoSimples}
          />
          <QuickAccessCard
            styles={s}
            theme={theme}
            icon="help-buoy-outline"
            title="Ajuda"
            description="Em breve"
            color={theme.colors.warning}
            simples={modoSimples}
          />
          <QuickAccessCard
            styles={s}
            theme={theme}
            icon="settings-outline"
            title="Configurações"
            description="Conta e preferências"
            color={theme.colors.textSecondary}
            onPress={() => router.push('/configuracoes')}
            simples={modoSimples}
          />
        </View>

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>
          Conta e preferências
        </Text>
        <View style={s.card}>
          <AccountShortcut
            styles={s}
            theme={theme}
            icon="accessibility-outline"
            title="Modo simples"
            description={
              modoSimples
                ? 'Ativado. Revise esta configuração.'
                : 'Textos e botões maiores para uma navegação mais confortável.'
            }
            onPress={() => router.push('/modo-simples')}
            simples={modoSimples}
          />
        </View>
      </ScrollView>
    </>
  );
}

function QuickAccessCard({
  styles,
  theme,
  icon,
  title,
  description,
  color,
  onPress,
  simples,
}: {
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
  icon: IconName;
  title: string;
  description: string;
  color: string;
  onPress?: () => void;
  simples: boolean;
}) {
  return (
    <Pressable
      disabled={!onPress}
      style={({ pressed }) => [
        styles.quickAccessCard,
        simples && sSimples.quickAccessCard,
        !onPress && styles.actionDisabled,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={
        onPress ? `Abre ${title.toLocaleLowerCase('pt-BR')}` : 'Indisponível no momento'
      }
      accessibilityState={{ disabled: !onPress }}
    >
      <View
        style={[
          styles.quickAccessIcon,
          simples && sSimples.quickAccessIcon,
          { backgroundColor: withAlpha(color, theme.mode === 'dark' ? 0.25 : 0.12) },
        ]}
      >
        <Ionicons name={icon} size={simples ? 29 : 22} color={color} />
      </View>
      <View style={styles.quickAccessCopy}>
        <Text
          numberOfLines={1}
          style={[styles.quickAccessTitle, simples && sSimples.quickAccessTitle]}
        >
          {title}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.quickAccessDescription, simples && sSimples.quickAccessDescription]}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function AccountShortcut({
  styles,
  theme,
  icon,
  title,
  description,
  onPress,
  simples,
}: {
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
  icon: IconName;
  title: string;
  description: string;
  onPress?: () => void;
  simples: boolean;
}) {
  return (
    <Pressable
      disabled={!onPress}
      style={[
        styles.accountShortcut,
        simples && sSimples.accountShortcut,
        !onPress && styles.actionDisabled,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={
        onPress ? `Abre ${title.toLocaleLowerCase('pt-BR')}` : 'Indisponível no momento'
      }
      accessibilityState={{ disabled: !onPress }}
    >
      <View style={[styles.shortcutIcon, simples && sSimples.shortcutIcon]}>
        <Ionicons name={icon} size={simples ? 28 : 20} color={theme.colors.primary} />
      </View>
      <View style={styles.shortcutCopy}>
        <Text style={[styles.shortcutTitle, simples && sSimples.shortcutTitle]}>{title}</Text>
        <Text style={[styles.shortcutDescription, simples && sSimples.shortcutDescription]}>
          {description}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={simples ? 27 : 20} color={theme.colors.textMuted} />
      ) : (
        <Text style={[styles.comingSoon, simples && sSimples.comingSoon]}>Em breve</Text>
      )}
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 16, paddingBottom: 38 },
    hero: { borderRadius: 24, padding: 20, marginBottom: 24, overflow: 'hidden' },
    heroGlowOne: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: 'rgba(168,230,199,0.10)',
      right: -52,
      top: -70,
    },
    heroGlowTwo: {
      position: 'absolute',
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: withAlpha(theme.colors.brandAccent, 0.1),
      right: 30,
      bottom: -48,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
      width: 62,
      height: 62,
      borderRadius: 22,
      backgroundColor: theme.pages.tutorProfile.cardElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: theme.colors.primary,
      fontSize: 21,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    heroInfo: { flex: 1, minWidth: 0 },
    overline: {
      color: theme.pages.tutorProfile.heroText,
      opacity: 0.62,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
    },
    heroNome: {
      color: theme.pages.tutorProfile.heroText,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.55,
      marginTop: 4,
    },
    heroEmail: {
      color: theme.pages.tutorProfile.heroText,
      opacity: 0.77,
      fontSize: 13,
      marginTop: 3,
    },
    heroFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 10,
    },
    rolePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.pages.tutorProfile.heroAccent,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    rolePillText: { color: theme.pages.tutorProfile.heroText, fontSize: 11, fontWeight: '800' },
    petCount: {
      color: theme.pages.tutorProfile.heroText,
      opacity: 0.7,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'right',
    },

    sectionTitle: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.85,
      textTransform: 'uppercase',
      marginBottom: 10,
      paddingLeft: 2,
    },
    card: {
      backgroundColor: theme.pages.tutorProfile.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      overflow: 'hidden',
      marginBottom: 22,
    },
    divider: { height: 1, backgroundColor: theme.pages.tutorProfile.border },

    acessosRapidos: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
    quickAccessCard: {
      flexBasis: '47.5%',
      minHeight: 104,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.pages.tutorProfile.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      padding: 12,
    },
    quickAccessIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickAccessCopy: { flex: 1, minWidth: 0 },
    quickAccessTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
    quickAccessDescription: {
      color: theme.colors.textSecondary,
      fontSize: 10,
      lineHeight: 13,
      marginTop: 3,
    },
    actionDisabled: { opacity: 0.55 },
    cardPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },

    accountShortcut: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
    shortcutIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
    },
    shortcutCopy: { flex: 1, minWidth: 0 },
    shortcutTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
    shortcutDescription: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      marginTop: 3,
      lineHeight: 17,
    },
    comingSoon: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
  });

const sSimples = StyleSheet.create({
  avatar: { width: 76, height: 76, borderRadius: 26 },
  avatarText: { fontSize: 27 },
  overline: { fontSize: 13 },
  heroNome: { fontSize: 27, lineHeight: 32 },
  heroEmail: { fontSize: 17 },
  sectionTitle: { fontSize: 18 },
  quickAccessCard: { flexBasis: '100%', minHeight: 104, padding: 20, gap: 16 },
  quickAccessIcon: { width: 58, height: 58, borderRadius: 18 },
  quickAccessTitle: { fontSize: 22 },
  quickAccessDescription: { fontSize: 17, lineHeight: 23, marginTop: 5 },
  accountShortcut: { paddingVertical: 20, gap: 16 },
  shortcutIcon: { width: 58, height: 58, borderRadius: 18 },
  shortcutTitle: { fontSize: 22 },
  shortcutDescription: { fontSize: 17, lineHeight: 23 },
  comingSoon: { fontSize: 13 },
});
