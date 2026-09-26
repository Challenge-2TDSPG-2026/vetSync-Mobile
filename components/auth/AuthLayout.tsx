import React, { type ReactNode, useMemo } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[theme.colors.navigation, theme.colors.navigationAccent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <AppIcon
            name="paw"
            set="MaterialCommunityIcons"
            size={230}
            color="rgba(255,255,255,0.05)"
            style={styles.pawMarca}
          />
          <AppIcon name="paw" set="MaterialCommunityIcons" size={11} color="rgba(191,233,213,0.3)" style={styles.pegada1} />
          <AppIcon name="paw" set="MaterialCommunityIcons" size={15} color="rgba(191,233,213,0.45)" style={styles.pegada2} />
          <AppIcon name="paw" set="MaterialCommunityIcons" size={19} color="rgba(191,233,213,0.6)" style={styles.pegada3} />

          <View style={styles.marca}>
            <View style={styles.seloWrap}>
              <View style={styles.seloGlowOut} />
              <View style={styles.seloGlowIn} />
              <LinearGradient
                colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.03)']}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.seloDisco}
              >
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.seloImg}
                  resizeMode="contain"
                  accessible={false}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </LinearGradient>
            </View>
            <Text style={styles.marcaTexto}>VetSync</Text>
          </View>

          <Text style={styles.heroTitulo}>{title}</Text>
          <Text style={styles.heroSub}>{subtitle}</Text>
        </LinearGradient>

        <View style={styles.sheet}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1 },
    scrollView: { flex: 1 },
    scroll: { flexGrow: 1 },
    hero: {
      paddingTop: 64,
      paddingHorizontal: 30,
      paddingBottom: 56,
      overflow: 'hidden',
    },
    pawMarca: {
      position: 'absolute',
      top: -26,
      right: -34,
      transform: [{ rotate: '-18deg' }],
    },
    pegada1: { position: 'absolute', top: 6, left: 2, transform: [{ rotate: '18deg' }] },
    pegada2: { position: 'absolute', top: 22, left: 20, transform: [{ rotate: '-10deg' }] },
    pegada3: { position: 'absolute', top: 40, left: 42, transform: [{ rotate: '20deg' }] },
    marca: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
    seloWrap: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center' },
    seloGlowOut: {
      position: 'absolute', width: 112, height: 112, borderRadius: 56,
      backgroundColor: 'rgba(242,200,121,0.10)',
    },
    seloGlowIn: {
      position: 'absolute', width: 92, height: 92, borderRadius: 46,
      backgroundColor: 'rgba(242,200,121,0.14)',
    },
    seloDisco: {
      width: 78, height: 78, borderRadius: 39,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
      shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    seloImg: { width: 54, height: 54 },
    marcaTexto: { fontSize: 19, fontWeight: '700', color: theme.colors.onNavigation, letterSpacing: -0.3 },
    heroTitulo: {
      fontSize: 32, fontWeight: '800', color: theme.colors.onNavigation,
      letterSpacing: -0.7, lineHeight: 38, marginBottom: 10, maxWidth: 300,
    },
    heroSub: {
      fontSize: 15, fontWeight: '500', color: theme.colors.onNavigation,
      opacity: 0.8, lineHeight: 22, maxWidth: 270,
    },
    sheet: {
      flexGrow: 1,
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      marginTop: -28,
      paddingTop: 36,
      paddingHorizontal: 28,
      paddingBottom: 32,
    },
  });
}
