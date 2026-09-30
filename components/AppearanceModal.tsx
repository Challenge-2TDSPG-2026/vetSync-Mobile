import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme, ThemePreference } from '../constants/theme';

type Props = {
  onFechar: () => void;
};

const OPCOES: { valor: ThemePreference; titulo: string; descricao?: string }[] = [
  { valor: 'light', titulo: 'Modo claro' },
  { valor: 'dark', titulo: 'Modo escuro' },
  {
    valor: 'system',
    titulo: 'Usar as configurações do dispositivo',
    descricao: 'Vamos usar o tema de exibição do seu dispositivo.',
  },
];

export function AppearanceModal({ onFechar }: Props) {
  const insets = useSafeAreaInsets();
  const { modoSimples } = useAccessibility();
  const { theme, preference, resolvedTheme, setPreference } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<ThemePreference>(preference);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (salvando) return;
    setSalvando(true);
    try {
      await setPreference(opcaoSelecionada);
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <View style={[s.backdrop, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={salvando ? undefined : onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar aparência"
        />
        <View
          style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 18) + 12 }]}
          accessibilityViewIsModal
        >
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={[s.title, modoSimples && sSimples.title]}>Aparência</Text>
            <Pressable
              onPress={onFechar}
              disabled={salvando}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={modoSimples ? 31 : 23} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={s.options}>
            {OPCOES.map((opcao, index) => {
              const selecionada = opcaoSelecionada === opcao.valor;
              const descricao =
                opcao.valor === 'system'
                  ? `${opcao.descricao} Atualmente: ${resolvedTheme === 'dark' ? 'escuro' : 'claro'}.`
                  : opcao.descricao;
              return (
                <React.Fragment key={opcao.valor}>
                  <Pressable
                    style={[s.option, modoSimples && sSimples.option]}
                    onPress={() => setOpcaoSelecionada(opcao.valor)}
                    disabled={salvando}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selecionada }}
                    accessibilityLabel={descricao ? `${opcao.titulo}. ${descricao}` : opcao.titulo}
                  >
                    <View style={s.optionCopy}>
                      <Text style={[s.optionTitle, modoSimples && sSimples.optionTitle]}>
                        {opcao.titulo}
                      </Text>
                      {descricao ? (
                        <Text
                          style={[s.optionDescription, modoSimples && sSimples.optionDescription]}
                        >
                          {descricao}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name={selecionada ? 'radio-button-on' : 'radio-button-off'}
                      size={modoSimples ? 31 : 25}
                      color={selecionada ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </Pressable>
                  {index < OPCOES.length - 1 ? <View style={s.divider} /> : null}
                </React.Fragment>
              );
            })}
          </View>

          <Pressable
            style={[s.saveButton, salvando && s.buttonDisabled]}
            onPress={() => void salvar()}
            disabled={salvando}
            accessibilityRole="button"
          >
            <Text style={[s.saveButtonText, modoSimples && sSimples.saveButtonText]}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Text>
          </Pressable>
          <Pressable
            style={[s.cancelButton, salvando && s.buttonDisabled]}
            onPress={onFechar}
            disabled={salvando}
            accessibilityRole="button"
          >
            <Text style={[s.cancelButtonText, modoSimples && sSimples.cancelButtonText]}>
              Cancelar
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: theme.pages.shared.card,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    handle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      backgroundColor: theme.pages.shared.borderStrong,
      marginBottom: 14,
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: theme.colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
    options: {
      marginTop: 18,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.pages.shared.border,
    },
    option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18 },
    optionCopy: { flex: 1, minWidth: 0 },
    optionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
    optionDescription: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 4,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.pages.shared.border },
    saveButton: {
      minHeight: 54,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      marginTop: 20,
    },
    saveButtonText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '800' },
    cancelButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
    cancelButtonText: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
    buttonDisabled: { opacity: 0.55 },
  });

const sSimples = StyleSheet.create({
  title: { fontSize: 31 },
  option: { paddingVertical: 22 },
  optionTitle: { fontSize: 22 },
  optionDescription: { fontSize: 17, lineHeight: 24 },
  saveButtonText: { fontSize: 21 },
  cancelButtonText: { fontSize: 21 },
});
