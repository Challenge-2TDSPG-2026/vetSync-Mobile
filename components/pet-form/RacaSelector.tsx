import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useRacas } from '../../hooks/useRacas';
import type { Pet } from '../../types';

type Props = {
  especie: Pet['especie'] | null;
  raca: string;
  onChange: (raca: string) => void;
};

const C = {
  fill: '#f1ece1',
  ink: '#1a1512',
  muted: '#7a6a5e',
  border: '#e8e2da',
};

/** Campo de raça com sugestões reais da API para a espécie escolhida. */
export function RacaSelector({ especie, raca, onChange }: Props) {
  const [focada, setFocada] = useState(false);
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
        <Ionicons name="search-outline" size={18} color={C.muted} style={estilos.icone} />
        <TextInput
          style={estilos.campo}
          value={raca}
          onChangeText={onChange}
          onFocus={() => setFocada(true)}
          onBlur={() => setTimeout(() => setFocada(false), 150)}
          editable={!!especie}
          placeholder={especie ? 'Comece a digitar e escolha uma sugestão' : 'Escolha a espécie primeiro'}
          placeholderTextColor={C.muted}
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
              <Ionicons name="paw-outline" size={15} color={C.muted} />
              <Text style={estilos.textoSugestao}>{sugestao}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

const estilos = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.fill,
    borderWidth: 1.5, borderColor: 'transparent', borderRadius: 14, paddingHorizontal: 15,
  },
  inputWrapDesativado: { opacity: 0.6 },
  icone: { marginRight: 10 },
  campo: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.ink },
  ajuda: { fontSize: 13, color: C.muted, marginTop: 6 },
  erro: { fontSize: 12, color: '#dc3545', marginTop: 6, fontWeight: '600' },
  listaSugestoes: {
    marginTop: 8, borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  sugestao: {
    flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 15,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  textoSugestao: { fontSize: 14, color: C.ink },
});
