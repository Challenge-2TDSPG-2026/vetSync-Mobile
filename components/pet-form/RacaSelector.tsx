import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useRacas } from '../../hooks/useRacas';
import type { Pet } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

type Props = {
  especie: Pet['especie'] | null;
  raca: string;
  onChange: (raca: string) => void;
};

/** Campo de raça com sugestões reais da API para a espécie escolhida. */
export function RacaSelector({ especie, raca, onChange }: Props) {
  const [focada, setFocada] = useState(false);
  const { theme } = useTheme();
  const estilos = useMemo(() => createStyles(theme), [theme]);
  const { data: racasSugeridas = [], isFetching, error } = useRacas(especie, raca);

  useEffect(() => {
    if (error) console.error('[useRacas] Falha ao buscar sugestões de raça:', error);
  }, [error]);

  const sugestoesVisiveis = useMemo(() => {
    if (!especie || !focada) return [];
    const digitado = raca.trim().toLowerCase();
    return racasSugeridas.filter(item => item.toLowerCase() !== digitado).slice(0, 6);
  }, [especie, focada, raca, racasSugeridas]);

  return (
    <>
      <View style={[estilos.inputWrap, !especie && estilos.inputWrapDesativado]}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} style={estilos.icone} />
        <TextInput
          style={estilos.campo}
          value={raca}
          onChangeText={onChange}
          onFocus={() => setFocada(true)}
          onBlur={() => setTimeout(() => setFocada(false), 150)}
          editable={!!especie}
          placeholder={especie ? 'Comece a digitar e escolha uma sugestão' : 'Escolha a espécie primeiro'}
          placeholderTextColor={theme.colors.placeholder}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      {focada && isFetching && <Text style={estilos.ajuda}>Buscando raças…</Text>}
      {focada && !isFetching && !!error && (
        <Text style={estilos.erro}>Não deu para buscar sugestões agora. Confira sua conexão.</Text>
      )}
      {sugestoesVisiveis.length > 0 && (
        <View style={estilos.listaSugestoes}>
          {sugestoesVisiveis.map(sugestao => (
            <Pressable
              key={sugestao}
              style={estilos.sugestao}
              onPress={() => {
                onChange(sugestao);
                setFocada(false);
              }}
            >
              <Ionicons name="paw-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={estilos.textoSugestao}>{sugestao}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.input,
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 15,
  },
  inputWrapDesativado: { opacity: 0.6 },
  icone: { marginRight: 10 },
  campo: { flex: 1, paddingVertical: 13, fontSize: 15, color: theme.colors.text },
  ajuda: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6 },
  erro: { fontSize: 12, color: theme.colors.danger, marginTop: 6, fontWeight: '600' },
  listaSugestoes: {
    marginTop: 8, borderRadius: 14, backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: theme.mode === 'dark' ? 0 : 0.08, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  sugestao: {
    flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 15,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
  },
  textoSugestao: { fontSize: 14, color: theme.colors.text },
  });
}
