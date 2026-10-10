import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

interface CampoFormularioProps extends Omit<TextInputProps, 'style'> {
  rotulo: string;
  erro?: string | null;
  multilinha?: boolean;
}

export function CampoFormulario({ rotulo, erro, multilinha, ...entrada }: CampoFormularioProps) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={s.grupo}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <TextInput
        {...entrada}
        style={[s.input, multilinha && s.multilinha, !!erro && s.inputErro]}
        placeholderTextColor={theme.colors.placeholder}
        multiline={multilinha}
        textAlignVertical={multilinha ? 'top' : 'center'}
        accessibilityLabel={rotulo}
      />
      {erro ? <Text style={s.erro}>{erro}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    grupo: { marginTop: 14 },
    rotulo: { color: page.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
    input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: page.border, backgroundColor: page.input, color: page.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
    multilinha: { minHeight: 96 },
    inputErro: { borderColor: theme.colors.danger },
    erro: { color: theme.colors.danger, fontSize: 12, marginTop: 5 },
  });
}
