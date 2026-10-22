import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useImagemCache } from '../../hooks/useImagemCache';

interface RecompensaImagemProps {
  /** URL absoluta da imagem (GET /recompensas/{id}/imagem). Se vazia, mostra o ícone. */
  imagemUrl?: string | null;
  /** Tamanho do lado do quadrado, em px. */
  size: number;
  /** Raio da borda. Padrão: 1/3 do tamanho. */
  borderRadius?: number;
  iconColor?: string;
  backgroundColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Foto do produto da recompensa. O endpoint exige Authorization: Bearer <token>, então a imagem
 * é baixada uma vez e fica salva no aparelho (useImagemCache), abrindo rápido nas próximas vezes.
 * Sem imagem (ou se falhar), cai no ícone de presente.
 */
export function RecompensaImagem({
  imagemUrl,
  size,
  borderRadius,
  iconColor,
  backgroundColor,
  accessibilityLabel,
  style,
}: RecompensaImagemProps) {
  const { theme } = useTheme();
  const { sessao } = useAuth();
  const token = sessao?.token ?? null;
  const urlOriginal = imagemUrl ?? null;
  const { uri, falhou, aoFalhar } = useImagemCache(urlOriginal, token);
  const temImagem = Boolean(uri) && Boolean(token) && !falhou;
  const raio = borderRadius ?? Math.round(size / 3);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? 'Imagem da recompensa'}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: raio,
          backgroundColor: backgroundColor ?? theme.pages.loyalty.catalogCard.iconBackground,
        },
        style,
      ]}
    >
      {temImagem ? (
        <Image
          source={{ uri: uri as string }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={aoFalhar}
        />
      ) : (
        <AppIcon
          name="gift"
          set="Ionicons"
          size={Math.round(size * 0.5)}
          color={iconColor ?? theme.domain.reward.gold}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
