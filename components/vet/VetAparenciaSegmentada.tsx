import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme, ThemePreference } from '../../constants/theme';

const TEMAS: { value: ThemePreference; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Claro', icon: 'sunny-outline' },
  { value: 'dark', label: 'Escuro', icon: 'moon-outline' },
];

/** Seletor de aparência (Sistema, Claro, Escuro) do veterinário, usado na Conta mobile e no painel de perfil desktop. */
export function VetAparenciaSegmentada() {
  const { theme, preference, resolvedTheme, setPreference } = useTheme();
  const { modoSimples } = useAccessibility();
  const s = useMemo(() => createStyles(theme, modoSimples), [theme, modoSimples]);

  return (
    <View>
      <View style={s.segmented} accessibilityRole="radiogroup">
        {TEMAS.map(opcao => {
          const selecionado = preference === opcao.value;
          return (
            <Pressable
              key={opcao.value}
              style={[s.segment, selecionado && s.segmentSelected]}
              onPress={() => void setPreference(opcao.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selecionado }}
              accessibilityLabel={`Aparência ${opcao.label}`}
            >
              <Ionicons name={opcao.icon} size={modoSimples ? 20 : 15} color={selecionado ? theme.colors.onPrimary : theme.colors.textSecondary} />
              <Text style={[s.segmentText, selecionado && s.segmentTextSelected]}>{opcao.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {preference === 'system' && (
        <Text style={s.hint}>Seguindo o dispositivo. Atualmente: {resolvedTheme === 'dark' ? 'escuro' : 'claro'}.</Text>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme, simples: boolean) => {
  const page = theme.pages.vetProfile;
  return StyleSheet.create({
    segmented: { flexDirection: 'row', backgroundColor: page.cardSecondary, borderRadius: 14, padding: 4, gap: 4, borderWidth: 1, borderColor: page.border },
    segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: simples ? 15 : 10, borderRadius: 11 },
    segmentSelected: { backgroundColor: theme.colors.primary },
    segmentText: { fontSize: simples ? 16 : 12, fontWeight: '700', color: theme.colors.textSecondary },
    segmentTextSelected: { color: theme.colors.onPrimary },
    hint: { fontSize: simples ? 15 : 11, color: theme.colors.textSecondary, marginTop: 8, paddingLeft: 2 },
  });
};
