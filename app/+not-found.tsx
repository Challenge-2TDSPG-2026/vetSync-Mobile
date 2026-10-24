import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { sessao } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const inicio = sessao?.perfil === 'VETERINARIO' ? '/(vet)' : sessao?.perfil === 'TUTOR' ? '/(tutor)/(tabs)' : '/login';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
      ]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.topline}>
        <View style={styles.brandMark}><Ionicons name="paw" size={17} color={theme.colors.onPrimary} /></View>
        <Text style={styles.brand}>VetSync</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.illustration, { width: Math.min(width - 48, 340), height: Math.min(width - 48, 280) }]}> 
          <View style={styles.orbit} />
          <View style={styles.sun}><Ionicons name="sparkles" size={20} color={theme.colors.primary} /></View>
          <View style={styles.cloud}><Ionicons name="cloud" size={104} color={theme.pages.shared.card} /></View>
          <View style={styles.numberBadge}><Text style={styles.number}>404</Text></View>
          <View style={styles.pawBadge}><Ionicons name="paw" size={25} color={theme.colors.primary} /></View>
          <View style={styles.dashOne} /><View style={styles.dashTwo} />
        </View>

        <View style={styles.copy}>
          <View style={styles.eyebrow}><View style={styles.eyebrowDot} /><Text style={styles.eyebrowText}>PÁGINA NÃO ENCONTRADA</Text></View>
          <Text accessibilityRole="header" style={styles.title}>Ops! Esse caminho{ '\n' }se perdeu por aí.</Text>
          <Text style={styles.description}>A página que você procura não existe ou mudou de endereço. Vamos encontrar o caminho de volta?</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para o início"
            onPress={() => router.replace(inicio)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="home" size={19} color={theme.colors.onPrimary} />
            <Text style={styles.primaryLabel}>Voltar para o início</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.colors.onPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tentar voltar à página anterior"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={17} color={theme.colors.textSecondary} />
            <Text style={styles.secondaryLabel}>Voltar à página anterior</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}><View style={styles.footerLine} /><Text style={styles.footerText}>Cuidado que acompanha você e seu pet.</Text><Ionicons name="heart" size={13} color={theme.colors.danger} /></View>
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    page: { flexGrow: 1, paddingHorizontal: 24, backgroundColor: theme.colors.background },
    topline: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 9 },
    brandMark: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
    brand: { color: theme.colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
    content: { flexGrow: 1, width: '100%', maxWidth: 460, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', paddingVertical: 22 },
    illustration: { maxWidth: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 12 },
    orbit: { width: 220, height: 220, borderRadius: 110, backgroundColor: theme.pages.shared.cardSecondary, borderWidth: 1, borderColor: theme.pages.shared.border, position: 'absolute' },
    sun: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 31, right: '23%', backgroundColor: theme.colors.brandAccent },
    cloud: { position: 'absolute', top: 59, left: '20%' },
    numberBadge: { minWidth: 201, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-7deg' }], backgroundColor: theme.colors.primary, borderWidth: 7, borderColor: theme.colors.background, elevation: 7, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 15, shadowOffset: { width: 0, height: 7 } },
    number: { fontSize: 58, lineHeight: 70, letterSpacing: 5, fontWeight: '900', color: theme.colors.onPrimary },
    pawBadge: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 34, right: '21%', backgroundColor: theme.colors.brandAccent, borderWidth: 5, borderColor: theme.colors.background },
    dashOne: { width: 10, height: 10, borderRadius: 5, position: 'absolute', left: '24%', top: 72, backgroundColor: theme.colors.brandAccent },
    dashTwo: { width: 8, height: 8, borderRadius: 4, position: 'absolute', right: '20%', bottom: 69, backgroundColor: theme.colors.primary },
    copy: { alignItems: 'center', paddingHorizontal: 8 },
    eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: theme.pages.shared.cardSecondary, marginBottom: 15 },
    eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.warning },
    eyebrowText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.15 },
    title: { color: theme.colors.text, fontSize: 29, lineHeight: 35, textAlign: 'center', fontWeight: '800', letterSpacing: -0.8 },
    description: { maxWidth: 340, marginTop: 11, color: theme.colors.textSecondary, fontSize: 15, lineHeight: 23, textAlign: 'center' },
    actions: { width: '100%', gap: 7, marginTop: 24 },
    primaryButton: { minHeight: 54, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.primary },
    primaryLabel: { flex: 1, marginLeft: 11, color: theme.colors.onPrimary, fontSize: 15, fontWeight: '700' },
    secondaryButton: { minHeight: 48, borderRadius: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
    secondaryLabel: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
    pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 14 },
    footerLine: { width: 20, height: 1, backgroundColor: theme.pages.shared.border },
    footerText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '500' },
  });
}
