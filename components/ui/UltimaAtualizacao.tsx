import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useOnline } from '../../hooks/useConexao';
import { textoUltimaAtualizacao } from '../../utils/ultimaAtualizacao';

interface Props {
  /** Momento (ms) em que os dados exibidos foram baixados do servidor; null enquanto nunca carregaram. */
  atualizadoEm: number | null;
}

/**
 * Mostra quando os dados foram atualizados pela última vez. Sem conexão, deixa claro que o que está na
 * tela é a cópia salva no aparelho.
 */
export function UltimaAtualizacao({ atualizadoEm }: Props) {
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const online = useOnline();
  const [agora, setAgora] = useState(() => Date.now());

  // Atualiza o "há X min" sem exigir nova busca.
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (atualizadoEm === null) return null;

  const cor = online ? theme.colors.textSecondary : theme.colors.warning;
  const texto = textoUltimaAtualizacao(atualizadoEm, agora);

  return (
    <View
      style={[styles.container, !online && { backgroundColor: theme.colors.warningBackground }]}
      accessibilityRole="text"
      accessibilityLabel={online ? texto : `Sem conexão. Mostrando dados salvos. ${texto}`}
    >
      <Ionicons
        name={online ? 'cloud-done-outline' : 'cloud-offline-outline'}
        size={modoSimples ? 20 : 15}
        color={cor}
      />
      <Text style={[styles.texto, { color: cor }, modoSimples && styles.textoSimples]}>
        {online ? texto : `Sem conexão · dados salvos no aparelho. ${texto}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  texto: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  textoSimples: { fontSize: 15 },
});
