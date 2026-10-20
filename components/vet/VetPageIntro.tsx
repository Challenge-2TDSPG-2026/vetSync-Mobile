import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';

type Props = { eyebrow: string; title: string; description: string; icon: string };

export function VetPageIntro({ eyebrow, title, description, icon }: Props) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.components.header.background }]}>
      <View style={[styles.icon, { backgroundColor: theme.components.header.backgroundAccent }]}>
        <AppIcon name={icon} set="Ionicons" size={24} color={theme.components.header.title} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: theme.colors.brandAccent }]}>{eyebrow}</Text>
        <Text style={[styles.title, { color: theme.components.header.title }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.components.header.title }]}>{description}</Text>
      </View>
      <View style={[styles.orb, { backgroundColor: theme.components.header.backgroundAccent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 146, borderRadius: 22, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 15, overflow: 'hidden' },
  icon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, zIndex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  description: { fontSize: 12, lineHeight: 17, opacity: 0.78, marginTop: 5 },
  orb: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: -54, top: -54, opacity: 0.55 },
});
