import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function OAuthRedirectScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={[styles.title, { color: theme.colors.text }]}>Concluindo login com Google…</Text>
      <Pressable onPress={() => router.replace('/login')} accessibilityRole="button">
        <Text style={[styles.link, { color: theme.colors.primary }]}>Voltar ao login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  link: { fontSize: 15, fontWeight: '600', padding: 10 },
});
