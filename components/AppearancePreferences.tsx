import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme, ThemePreference } from '../constants/theme';

const OPTIONS: { value: ThemePreference; title: string; description: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'system', title: 'Seguir sistema', description: 'Usa a aparência definida no dispositivo.', icon: 'phone-portrait-outline' },
  { value: 'light', title: 'Claro', description: 'Mantém o aplicativo em tema claro.', icon: 'sunny-outline' },
  { value: 'dark', title: 'Escuro', description: 'Mantém o aplicativo em tema escuro.', icon: 'moon-outline' },
];

export function AppearancePreferences() {
  const { modoSimples } = useAccessibility();
  const { theme, preference, resolvedTheme, setPreference } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={s.wrapper}>
      <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Aparência</Text>
      <View style={s.card}>
        {OPTIONS.map((option, index) => {
          const selected = preference === option.value;
          const description = option.value === 'system'
            ? `${option.description} Atualmente: ${resolvedTheme === 'dark' ? 'escuro' : 'claro'}.`
            : option.description;

          return (
            <React.Fragment key={option.value}>
              <Pressable
                style={[s.option, modoSimples && sSimples.option, selected && s.optionSelected]}
                onPress={() => void setPreference(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.title}. ${description}`}
              >
                <View style={[s.icon, selected && s.iconSelected]}>
                  <Ionicons name={option.icon} size={modoSimples ? 27 : 20} color={selected ? theme.colors.onPrimary : theme.colors.primary} />
                </View>
                <View style={s.copy}>
                  <Text style={[s.title, modoSimples && sSimples.title]}>{option.title}</Text>
                  <Text style={[s.description, modoSimples && sSimples.description]}>{description}</Text>
                </View>
                <View style={[s.radio, selected && s.radioSelected]}>
                  {selected ? <Ionicons name="checkmark" size={modoSimples ? 18 : 14} color={theme.colors.onPrimary} /> : null}
                </View>
              </Pressable>
              {index < OPTIONS.length - 1 ? <View style={s.divider} /> : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  wrapper: { marginBottom: 22 },
  sectionTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '800', letterSpacing: 0.85, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 13 },
  optionSelected: { backgroundColor: theme.colors.surfaceSubtle },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceSubtle },
  iconSelected: { backgroundColor: theme.colors.primary },
  copy: { flex: 1, minWidth: 0 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
  description: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: theme.colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 65 },
});

const sSimples = StyleSheet.create({
  sectionTitle: { fontSize: 18 },
  option: { paddingVertical: 19, gap: 16 },
  title: { fontSize: 22 },
  description: { fontSize: 17, lineHeight: 23 },
});
