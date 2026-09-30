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
  const [estadoImagem, setEstadoImagem] = useState<{
    fotoUrl: string | null;
    token: string | null;
    webUrl: string | null;
    falhou: boolean;
  } | null>(null);
  const fotoUrl = pet.fotoUrl ?? null;
  const token = sessao?.token ?? null;

  useEffect(() => {
    if (Platform.OS !== 'web' || !fotoUrl || !token) return;

    let ativo = true;
    let objectUrl: string | null = null;
    void fetch(fotoUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(async resposta => {
        if (!resposta.ok) throw new Error('Não foi possível carregar a foto do pet.');
        return resposta.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        if (ativo) setEstadoImagem({ fotoUrl, token, webUrl: objectUrl, falhou: false });
      })
      .catch(() => {
        if (ativo) setEstadoImagem({ fotoUrl, token, webUrl: null, falhou: true });
      });

    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fotoUrl, token]);

  const imagemAtual = estadoImagem?.fotoUrl === fotoUrl && estadoImagem.token === token ? estadoImagem : null;
  const especieInfo = ESPECIES.find(item => item.valor === pet.especie);
  const uriImagem = Platform.OS === 'web' ? imagemAtual?.webUrl ?? null : fotoUrl;
  const temFoto = Boolean(uriImagem) && Boolean(token) && !imagemAtual?.falhou;
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
          source={Platform.OS === 'web'
            ? { uri: uriImagem as string }
            : { uri: uriImagem as string, headers: { Authorization: `Bearer ${token}` } }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setEstadoImagem({ fotoUrl, token, webUrl: uriImagem, falhou: true })}
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
