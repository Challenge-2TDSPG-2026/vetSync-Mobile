import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export function NotificationHeaderAction() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => router.push('/notificacoes')}
      style={s.button}
      accessibilityRole="button"
      accessibilityLabel="Abrir notificações"
      hitSlop={8}
    >
      <Ionicons name="notifications-outline" size={23} color={theme.colors.onNavigation} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: { padding: 6, marginRight: 2 },
});
