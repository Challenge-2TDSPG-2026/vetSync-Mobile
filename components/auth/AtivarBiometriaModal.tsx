import React, { useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

type Props = {
  visivel: boolean;
  nomeBiometria: string;
  carregando?: boolean;
  onAtivar: () => void;
  onAgoraNao: () => void;
};

export function AtivarBiometriaModal({
  visivel,
  nomeBiometria,
  carregando = false,
  onAtivar,
  onAgoraNao,
}: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={carregando ? undefined : onAgoraNao}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <View style={s.card} accessibilityViewIsModal>
          <View style={s.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={31} color={theme.colors.primary} />
          </View>
          <Text style={s.title}>Acesso mais rápido e protegido</Text>
          <Text style={s.description}>
            Deseja usar {nomeBiometria} para entrar neste aparelho? Sua senha não será salva.
          </Text>

          <Pressable
            style={({ pressed }) => [s.primaryButton, pressed && s.pressed, carregando && s.disabled]}
            onPress={onAtivar}
            disabled={carregando}
            accessibilityRole="button"
            accessibilityLabel={`Ativar login com ${nomeBiometria}`}
            accessibilityState={{ disabled: carregando, busy: carregando }}
          >
            {carregando ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={s.primaryText}>Ativar {nomeBiometria}</Text>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.secondaryButton, pressed && s.pressed]}
            onPress={onAgoraNao}
            disabled={carregando}
            accessibilityRole="button"
            accessibilityLabel="Agora não"
            accessibilityState={{ disabled: carregando }}
          >
            <Text style={s.secondaryText}>Agora não</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: 'rgba(8, 25, 20, 0.54)',
    },
    card: {
      borderRadius: 24,
      padding: 24,
      backgroundColor: theme.pages.shared.card,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
    },
    iconWrap: {
      width: 58,
      height: 58,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.successBackground,
    },
    title: { marginTop: 18, fontSize: 20, fontWeight: '800', color: theme.colors.text },
    description: {
      marginTop: 8,
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    primaryButton: {
      marginTop: 24,
      minHeight: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
    },
    primaryText: { fontSize: 15, fontWeight: '800', color: theme.colors.onPrimary },
    secondaryButton: { minHeight: 48, marginTop: 4, justifyContent: 'center', alignItems: 'center' },
    secondaryText: { color: theme.colors.primary, fontSize: 14, fontWeight: '800' },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.65 },
  });
}
