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
  compactControls?: boolean;
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
  compactControls = false,
}: IllustratedPageHeroProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, height, compactControls),
    [theme, height, compactControls],
  );

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
          style={[styles.back, { top: compactControls ? 14 : Math.max(insets.top, 14) }]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={compactControls ? '#ffffff' : theme.colors.text}
          />
        </Pressable>
      ) : null}
      <View style={[styles.content, !onBack && styles.contentWithoutBack]}>
        {compactControls ? (
          <View style={styles.eyebrowRow}>
            <View style={styles.compactIcon}>
              <Ionicons name={icon} size={simple ? 23 : 19} color={theme.colors.primary} />
            </View>
            <Text style={[styles.eyebrow, simple && styles.simpleEyebrow]}>
              VETSYNC · CUIDADO EM CADA DETALHE
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.icon}>
              <Ionicons name={icon} size={simple ? 30 : 24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.eyebrow, simple && styles.simpleEyebrow]}>
              VETSYNC · CUIDADO EM CADA DETALHE
            </Text>
          </>
        )}
        <Text style={[styles.title, simple && styles.simpleTitle]}>{title}</Text>
        <Text style={[styles.subtitle, simple && styles.simpleSubtitle]}>{subtitle}</Text>
      </View>
    </ImageBackground>
  );
}

function createStyles(theme: AppTheme, height: number, compactControls: boolean) {
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
      width: compactControls ? 40 : 44,
      height: compactControls ? 40 : 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: compactControls ? 20 : 15,
      backgroundColor: compactControls ? 'rgba(7, 31, 24, 0.66)' : theme.pages.shared.cardElevated,
      borderWidth: 1,
      borderColor: compactControls ? 'rgba(255,255,255,0.34)' : theme.pages.shared.border,
    },
    content: { paddingHorizontal: 22, paddingTop: 80, paddingBottom: 23 },
    contentWithoutBack: { paddingTop: 34 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 3 },
    compactIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: 'rgba(7, 31, 24, 0.66)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    icon: {
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.pages.shared.cardElevated,
      marginBottom: 10,
    },
    eyebrow: {
      color: '#d8f1df',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1.1,
      flexShrink: 1,
    },
    title: { color: '#ffffff', fontSize: 26, fontWeight: '900', letterSpacing: -0.6, marginTop: 4 },
    subtitle: { color: '#f0f6f1', fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 520 },
    simpleEyebrow: { fontSize: 12 },
    simpleTitle: { fontSize: 31 },
    simpleSubtitle: { fontSize: 16, lineHeight: 23 },
  });
}
