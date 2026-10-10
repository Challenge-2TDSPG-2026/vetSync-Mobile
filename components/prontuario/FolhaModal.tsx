import React, { useEffect, useMemo } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

interface FolhaModalProps {
  visivel: boolean;
  titulo: string;
  subtitulo?: string;
  onFechar: () => void;
  children: React.ReactNode;
}

/** Folha deslizante de baixo para cima, usada pelos modais do prontuário. */
export function FolhaModal({ visivel, titulo, subtitulo, onFechar, children }: FolhaModalProps) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visivel) return;
    const fecharComEscape = (evento: KeyboardEvent) => evento.key === 'Escape' && onFechar();
    window.addEventListener('keydown', fecharComEscape);
    return () => window.removeEventListener('keydown', fecharComEscape);
  }, [visivel, onFechar]);

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} accessibilityLabel="Fechar" />
        <View style={s.sheet} accessibilityViewIsModal>
          <View style={s.handle} />
          <View style={s.header}>
            <View style={s.headerTexto}>
              <Text style={s.titulo} numberOfLines={1}>{titulo}</Text>
              {subtitulo ? <Text style={s.subtitulo} numberOfLines={2}>{subtitulo}</Text> : null}
            </View>
            <Pressable style={s.fechar} onPress={onFechar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fechar">
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.corpo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      width: '100%', maxHeight: '92%', backgroundColor: page.cardElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      overflow: 'hidden', borderWidth: theme.mode === 'dark' ? 1 : 0, borderColor: page.border,
    },
    handle: { width: 38, height: 4, borderRadius: 4, backgroundColor: page.borderStrong, alignSelf: 'center', marginTop: 10, marginBottom: 2 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: page.border, backgroundColor: page.card },
    headerTexto: { flex: 1, minWidth: 0 },
    titulo: { color: page.text, fontSize: 20, fontWeight: '800' },
    subtitulo: { color: page.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
    fechar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: page.cardSecondary },
    corpo: { padding: 20, paddingBottom: 36 },
  });
}
