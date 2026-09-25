import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { ESPECIES } from '../../constants';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';

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
  const [falhouAoCarregar, setFalhouAoCarregar] = useState(false);

  useEffect(() => {
    setFalhouAoCarregar(false);
  }, [pet.fotoUrl]);

  const especieInfo = ESPECIES.find(item => item.valor === pet.especie);
  const temFoto = Boolean(pet.fotoUrl) && !falhouAoCarregar;
  const corIcone = color ?? theme.colors.primary;
  const corFundo = backgroundColor ?? theme.colors.surface;
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
          source={{ uri: pet.fotoUrl as string }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setFalhouAoCarregar(true)}
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
