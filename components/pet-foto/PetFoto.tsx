import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { ESPECIES } from '../../constants';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

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
  const [falhouAoCarregar, setFalhouAoCarregar] = useState(false);
  const [fotoWebUrl, setFotoWebUrl] = useState<string | null>(null);

  useEffect(() => {
    setFalhouAoCarregar(false);
    setFotoWebUrl(null);
    if (Platform.OS !== 'web' || !pet.fotoUrl || !sessao?.token) return;

    let ativo = true;
    let objectUrl: string | null = null;
    void fetch(pet.fotoUrl, { headers: { Authorization: `Bearer ${sessao.token}` } })
      .then(async resposta => {
        if (!resposta.ok) throw new Error('Não foi possível carregar a foto do pet.');
        return resposta.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        if (ativo) setFotoWebUrl(objectUrl);
      })
      .catch(() => {
        if (ativo) setFalhouAoCarregar(true);
      });

    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pet.fotoUrl, sessao?.token]);

  const especieInfo = ESPECIES.find(item => item.valor === pet.especie);
  const uriImagem = Platform.OS === 'web' ? fotoWebUrl : pet.fotoUrl;
  const temFoto = Boolean(uriImagem) && Boolean(sessao?.token) && !falhouAoCarregar;
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
          source={Platform.OS === 'web'
            ? { uri: uriImagem as string }
            : { uri: uriImagem as string, headers: { Authorization: `Bearer ${sessao?.token}` } }}
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
