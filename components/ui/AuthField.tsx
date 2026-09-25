import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

type AuthFieldProps = Pick<
  TextInputProps,
  'autoCapitalize' | 'autoComplete' | 'keyboardType' | 'maxLength' | 'onChangeText' | 'placeholder' | 'secureTextEntry' | 'textContentType' | 'value'
> & {
  label: string;
  icon: string;
  error?: string;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
};

/** Campo reutilizável do fluxo de autenticação, com contraste resolvido pelo ThemeContext. */
export function AuthField({
  label,
  icon,
  error,
  isPassword,
  showPassword,
  onTogglePassword,
  ...inputProps
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused, error && styles.inputWrapError]}>
        <AppIcon name={icon} set="Ionicons" size={21} color={focused ? theme.colors.primary : theme.colors.textSecondary} style={styles.leadingIcon} />
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor={theme.colors.placeholder}
          secureTextEntry={isPassword ? !showPassword : inputProps.secureTextEntry}
          autoCapitalize={inputProps.autoCapitalize ?? (isPassword ? 'none' : undefined)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isPassword ? (
          <Pressable
            onPress={onTogglePassword}
            style={styles.togglePassword}
            hitSlop={8}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            accessibilityRole="button"
          >
            <AppIcon name={showPassword ? 'eye-off-outline' : 'eye-outline'} set="Ionicons" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    field: { marginBottom: 22 },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 10 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.input,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 16,
      paddingHorizontal: 18,
    },
    inputWrapFocused: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceElevated },
    inputWrapError: { borderColor: theme.colors.danger },
    leadingIcon: { marginRight: 12 },
    input: {
      flex: 1,
      paddingVertical: 19,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: 'transparent',
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
    },
    togglePassword: { paddingLeft: 6, paddingVertical: 6, justifyContent: 'center', alignItems: 'center' },
    error: { color: theme.colors.danger, fontSize: 12, marginTop: 6 },
  });
}
