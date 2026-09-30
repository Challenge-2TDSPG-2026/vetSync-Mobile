import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

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
 * Foto do produto da recompensa. O endpoint exige Authorization: Bearer <token>,
 * então na web buscamos via fetch -> blob (igual ao PetFoto) e no nativo passamos
 * o header direto no <Image>. Sem imagem (ou se falhar), cai no ícone de presente.
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
  const [estadoImagem, setEstadoImagem] = useState<{
    imagemUrl: string | null;
    token: string | null;
    webUrl: string | null;
    falhou: boolean;
  } | null>(null);
  const token = sessao?.token ?? null;
  const urlOriginal = imagemUrl ?? null;

  useEffect(() => {
    if (Platform.OS !== 'web' || !urlOriginal || !token) return;

    let ativo = true;
    let objectUrl: string | null = null;
    void fetch(urlOriginal, { headers: { Authorization: `Bearer ${token}` } })
      .then(async resposta => {
        if (!resposta.ok) throw new Error('Não foi possível carregar a imagem da recompensa.');
        return resposta.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        if (ativo) setEstadoImagem({ imagemUrl: urlOriginal, token, webUrl: objectUrl, falhou: false });
      })
      .catch(() => {
        if (ativo) setEstadoImagem({ imagemUrl: urlOriginal, token, webUrl: null, falhou: true });
      });

    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [urlOriginal, token]);

  const imagemAtual = estadoImagem?.imagemUrl === urlOriginal && estadoImagem.token === token ? estadoImagem : null;
  const uri = Platform.OS === 'web' ? imagemAtual?.webUrl ?? null : urlOriginal;
  const temImagem = Boolean(uri) && Boolean(token) && !imagemAtual?.falhou;
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
          source={Platform.OS === 'web'
            ? { uri: uri as string }
            : { uri: uri as string, headers: { Authorization: `Bearer ${token}` } }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setEstadoImagem({ imagemUrl: urlOriginal, token, webUrl: uri, falhou: true })}
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
