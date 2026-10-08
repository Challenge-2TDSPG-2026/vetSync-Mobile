import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import { APP_INFO } from '../constants/appInfo';
import type { AppTheme } from '../constants/theme';

export default function SobreAppScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={23} color={theme.components.header.icon} />
        </Pressable>
        <Text style={[styles.headerTitle, modoSimples && styles.largeHeaderTitle]}>
          Sobre o projeto
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 18) + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandCard}>
          <View style={styles.logo}>
            <Ionicons name="paw" size={38} color={theme.colors.onPrimary} />
          </View>
          <Text style={[styles.appName, modoSimples && styles.largeText]}>{APP_INFO.name}</Text>
          <Text style={[styles.tagline, modoSimples && styles.largeSecondaryText]}>
            Cuidados mais simples para o seu pet.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, modoSimples && styles.largeSectionTitle]}>
          Versão instalada
        </Text>
        <View style={styles.infoCard}>
          <InfoRow styles={styles} label="Versão" value={APP_INFO.version} simples={modoSimples} />
          <View style={styles.divider} />
          <InfoRow styles={styles} label="Build" value={APP_INFO.build} simples={modoSimples} />
          <View style={styles.divider} />
          <InfoRow
            styles={styles}
            label="Commit de referência"
            value={APP_INFO.commitShort}
            simples={modoSimples}
            monospace
          />
        </View>

        {APP_INFO.hasCommitHash ? (
          <Text
            style={[styles.fullHash, modoSimples && styles.largeSecondaryText]}
            selectable
            accessibilityLabel={`Hash completo do commit: ${APP_INFO.commitHash}`}
          >
            {APP_INFO.commitHash}
          </Text>
        ) : (
          <View style={styles.warning} accessibilityRole="alert">
            <Ionicons name="warning-outline" size={20} color={theme.colors.warning} />
            <Text style={[styles.warningText, modoSimples && styles.largeSecondaryText]}>
              Não foi possível identificar o commit deste build. Gere o app a partir de um
              repositório git ou configure EXPO_PUBLIC_COMMIT_HASH antes de publicar a versão final.
            </Text>
          </View>
        )}

        <Text style={[styles.description, modoSimples && styles.largeSecondaryText]}>
          O commit de referência identifica exatamente o código-fonte utilizado para gerar esta
          versão do aplicativo.
        </Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  styles,
  label,
  value,
  simples,
  monospace = false,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
  simples: boolean;
  monospace?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.label, simples && styles.largeSecondaryText]}>{label}</Text>
      <Text
        style={[styles.value, simples && styles.largeText, monospace && styles.monospace]}
        selectable
      >
        {value}
      </Text>
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
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: {
      flex: 1,
      color: theme.components.header.title,
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -0.55,
    },
    content: { paddingHorizontal: 18, paddingTop: 22 },
    brandCard: {
      alignItems: 'center',
      backgroundColor: theme.pages.shared.heroBackground,
      borderRadius: 26,
      padding: 30,
      marginBottom: 30,
      shadowColor: theme.colors.text,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 7 },
      elevation: 3,
    },
    logo: {
      width: 76,
      height: 76,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      marginBottom: 14,
    },
    appName: { color: theme.pages.shared.heroText, fontSize: 28, fontWeight: '800' },
    tagline: {
      color: theme.pages.shared.textSecondary,
      fontSize: 14,
      marginTop: 6,
      textAlign: 'center',
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
    infoCard: {
      backgroundColor: theme.pages.shared.card,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      borderRadius: 21,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    infoRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    label: { color: theme.colors.textSecondary, fontSize: 14, flex: 1 },
    value: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'right',
      flexShrink: 1,
    },
    monospace: { fontFamily: 'monospace' },
    divider: { height: 1, backgroundColor: theme.pages.shared.border },
    fullHash: {
      color: theme.colors.textSecondary,
      fontFamily: 'monospace',
      fontSize: 11,
      marginTop: 10,
      textAlign: 'center',
    },
    warning: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      backgroundColor: theme.colors.warningBackground,
      borderRadius: 14,
      padding: 14,
      marginTop: 16,
    },
    warningText: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19 },
    description: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 22,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    largeHeaderTitle: { fontSize: 31 },
    largeText: { fontSize: 24 },
    largeSectionTitle: { fontSize: 18 },
    largeSecondaryText: { fontSize: 18, lineHeight: 25 },
  });