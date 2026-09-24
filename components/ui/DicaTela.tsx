import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from '../AppIcon';
import { CORES } from '../../constants/theme';

export interface DicaTelaProps {
  titulo?: string;
  texto?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DicaTela({ titulo = 'Dica', texto, children, style }: DicaTelaProps) {
  return (
    <View style={[s.container, style]}>
      <View style={s.icon}>
        <AppIcon name="bulb-outline" set="Ionicons" size={19} color={CORES.aviso} />
      </View>
      <View style={s.content}>
        <Text style={s.title}>{titulo}</Text>
        {texto ? <Text style={s.text}>{texto}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export default DicaTela;

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: CORES.avisoBg,
    borderWidth: 1,
    borderColor: '#f5d58a',
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8df',
  },
  content: { flex: 1 },
  title: { color: CORES.texto, fontSize: 13, fontWeight: '700' },
  text: { color: CORES.textoSecundario, fontSize: 12, lineHeight: 17, marginTop: 3 },
});
