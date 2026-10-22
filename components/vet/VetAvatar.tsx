import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useVetFoto } from '../../hooks/useVetFoto';

type Props = {
  nome: string;
  size?: number;
  onPress?: () => void;
  mostrarCamera?: boolean;
  accessibilityLabel?: string;
};

/** Avatar do veterinário: foto salva no aparelho ou, na falta dela, a inicial do nome. */
export function VetAvatar({ nome, size = 44, onPress, mostrarCamera = false, accessibilityLabel }: Props) {
  const { theme } = useTheme();
  const { fotoUri } = useVetFoto();
  const inicial = nome.trim()[0]?.toUpperCase() ?? '?';
  const raio = size / 2;
  const badge = Math.max(22, Math.round(size * 0.32));

  const conteudo = (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          s.circulo,
          { width: size, height: size, borderRadius: raio, backgroundColor: theme.pages.vetDashboard.heroBackground },
        ]}
      >
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={{ width: size, height: size, borderRadius: raio }} accessibilityIgnoresInvertColors />
        ) : (
          <Text style={[s.inicial, { fontSize: Math.round(size * 0.38), color: theme.colors.brandAccent }]}>{inicial}</Text>
        )}
      </View>
      {mostrarCamera && (
        <View
          style={[
            s.badge,
            {
              width: badge,
              height: badge,
              borderRadius: badge / 2,
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.background,
            },
          ]}
        >
          <Ionicons name="camera" size={Math.round(badge * 0.55)} color={theme.colors.onPrimary} />
        </View>
      )}
    </View>
  );

  if (!onPress) return conteudo;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? 'Foto do veterinário'}>
      {conteudo}
    </Pressable>
  );
}

const s = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  inicial: { fontWeight: '800' },
  badge: { position: 'absolute', right: -2, bottom: -2, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
