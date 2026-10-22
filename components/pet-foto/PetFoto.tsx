import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { ESPECIES } from '../../constants';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useImagemCache } from '../../hooks/useImagemCache';

type EspecieValor = (typeof ESPECIES)[number]['valor'];

export interface PetFotoInfo {
  especie: EspecieValor | string;
  fotoUrl?: string | null;
}

interface PetFotoProps {
  pet: PetFotoInfo;
  size?: number;
  color?: string;
  backgroundColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function PetFoto({ pet, size = 48, color, backgroundColor, accessibilityLabel, style }: PetFotoProps) {
  const { theme } = useTheme();
  const { sessao } = useAuth();
  const fotoUrl = pet.fotoUrl ?? null;
  const token = sessao?.token ?? null;
  const { uri, falhou, aoFalhar } = useImagemCache(fotoUrl, token);

  const especieInfo = ESPECIES.find(item => item.valor === pet.especie);
  const temFoto = Boolean(uri) && Boolean(token) && !falhou;
  const corIcone = color ?? theme.colors.primary;
  const corFundo = backgroundColor ?? theme.pages.shared.card;
  const rotulo = accessibilityLabel ?? `Foto de ${especieInfo?.label ?? 'pet'}`;

  return (
    <View
      accessible
      accessibilityLabel={rotulo}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: corFundo },
        style,
      ]}
    >
      {temFoto ? (
        <Image
          source={{ uri: uri as string }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={aoFalhar}
        />
      ) : (
        <AppIcon
          name={especieInfo?.icon ?? 'paw'}
          set={especieInfo?.iconSet ?? 'MaterialCommunityIcons'}
          size={Math.round(size * 0.5)}
          color={corIcone}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
