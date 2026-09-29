import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { Pet } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { petHealthService } from '../../services/petHealthService';
import { carteiraPdfService } from '../../services/carteiraPdfService';
import { mostrarToast } from '../ui/Toast';
import type { AppTheme } from '../../constants/theme';

type Props = {
  pet: Pet | null;
  /** `preenchido` = botão principal; `contorno` = botão secundário. */
  variante?: 'preenchido' | 'contorno';
  style?: StyleProp<ViewStyle>;
};

/**
 * Baixa/compartilha (celular) ou imprime/salva (web) o PDF com a carteirinha
 * e a carteira de vacinação do pet. Sempre busca os dados atualizados na API.
 */
export function BotaoCarteiraPdf({ pet, variante = 'contorno', style }: Props) {
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const { sessao } = useAuth();
  const queryClient = useQueryClient();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [gerando, setGerando] = useState(false);
  const preenchido = variante === 'preenchido';
  const texto = Platform.OS === 'web' ? 'Imprimir / salvar PDF' : 'Baixar ou compartilhar PDF';

  async function gerarPdf() {
    if (!pet || gerando) return;
    setGerando(true);
    try {
      const carteira = await queryClient.fetchQuery({
        queryKey: ['pets', pet.id, 'carteira-vacinacao'] as const,
        queryFn: () => petHealthService.buscarCarteiraVacinacao(pet.id),
        staleTime: 0,
      });
      await carteiraPdfService.exportar(pet, carteira, sessao?.token);
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível gerar o PDF', erro instanceof Error ? erro.message : undefined);
    } finally {
      setGerando(false);
    }
  }

  const cor = preenchido ? theme.colors.onPrimary : theme.colors.primary;
  return (
    <Pressable
      onPress={gerarPdf}
      disabled={!pet || gerando}
      accessibilityRole="button"
      accessibilityLabel={pet ? `${texto}: carteirinha e carteira de vacinação de ${pet.nome}` : texto}
      accessibilityState={{ disabled: !pet || gerando, busy: gerando }}
      style={[
        s.botao,
        modoSimples && sSimples.botao,
        preenchido ? s.preenchido : s.contorno,
        (!pet || gerando) && s.desativado,
        style,
      ]}
    >
      {gerando ? (
        <ActivityIndicator color={cor} />
      ) : (
        <>
          <Ionicons name="document-text-outline" size={modoSimples ? 24 : 19} color={cor} />
          <Text style={[s.texto, modoSimples && sSimples.texto, { color: cor }]}>{texto}</Text>
        </>
      )}
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  botao: { minHeight: 46, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  preenchido: { backgroundColor: theme.colors.primary },
  contorno: { borderWidth: 1, borderColor: theme.colors.primary },
  desativado: { opacity: 0.58 },
  texto: { fontSize: 14, fontWeight: '800' },
});

const sSimples = StyleSheet.create({
  botao: { minHeight: 60 },
  texto: { fontSize: 18 },
});