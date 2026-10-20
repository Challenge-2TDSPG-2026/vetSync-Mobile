import React, { useMemo } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IllustratedPageHeroProps {
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
  icon: IconName;
  accessibilityLabel: string;
  simple?: boolean;
  onBack?: () => void;
  backLabel?: string;
  height?: number;
}

export function IllustratedPageHero({
  image,
  title,
  subtitle,
  icon,
  accessibilityLabel,
  simple = false,
  onBack,
  backLabel = 'Voltar',
  height = 286,
}: IllustratedPageHeroProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, height), [theme, height]);

  return (
    <ImageBackground
      source={image}
      style={styles.hero}
      imageStyle={styles.image}
      resizeMode="cover"
      accessibilityLabel={accessibilityLabel}
    >
      <LinearGradient
        colors={['rgba(5, 25, 18, 0.15)', 'rgba(5, 25, 18, 0.34)', 'rgba(5, 25, 18, 0.94)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      {onBack ? (
        <Pressable
          style={[styles.back, { top: Math.max(insets.top, 14) }]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
      ) : null}
      <View style={[styles.content, !onBack && styles.contentWithoutBack]}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={simple ? 30 : 24} color={theme.colors.primary} />
        </View>
        <Text style={[styles.eyebrow, simple && styles.simpleEyebrow]}>VETSYNC · CUIDADO EM CADA DETALHE</Text>
        <Text style={[styles.title, simple && styles.simpleTitle]}>{title}</Text>
        <Text style={[styles.subtitle, simple && styles.simpleSubtitle]}>{subtitle}</Text>
      </View>
    </ImageBackground>
  );
}

function createStyles(theme: AppTheme, height: number) {
  return StyleSheet.create({
    hero: {
      height,
      marginHorizontal: -18,
      justifyContent: 'flex-end',
      backgroundColor: theme.pages.shared.heroBackground,
    },
    image: { width: '100%', height: '100%' },
    back: {
      position: 'absolute',
      left: 18,
      zIndex: 2,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.pages.shared.cardElevated,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
    },
    content: { paddingHorizontal: 22, paddingTop: 80, paddingBottom: 23 },
    contentWithoutBack: { paddingTop: 34 },
    icon: {
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.pages.shared.cardElevated,
      marginBottom: 10,
    },
    eyebrow: { color: '#d8f1df', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
    title: { color: '#ffffff', fontSize: 26, fontWeight: '900', letterSpacing: -0.6, marginTop: 4 },
    subtitle: { color: '#f0f6f1', fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 520 },
    simpleEyebrow: { fontSize: 12 },
    simpleTitle: { fontSize: 31 },
    simpleSubtitle: { fontSize: 16, lineHeight: 23 },
  });
}
