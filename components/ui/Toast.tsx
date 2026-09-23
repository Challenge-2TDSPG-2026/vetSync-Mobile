import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../AppIcon';
import { CORES } from '../../constants/theme';

type TipoToast = 'sucesso' | 'erro' | 'info';

interface ToastData {
  id: number;
  tipo: TipoToast;
  titulo: string;
  mensagem?: string;
}

const ESTILO_POR_TIPO: Record<TipoToast, { fundo: string; borda: string; cor: string; icone: string }> = {
  sucesso: { fundo: CORES.successBg, borda: CORES.success, cor: CORES.success, icone: 'checkmark-circle' },
  erro: { fundo: CORES.alertaBg, borda: CORES.alerta, cor: CORES.alerta, icone: 'alert-circle' },
  info: { fundo: CORES.infoBg, borda: CORES.info, cor: CORES.info, icone: 'information-circle' },
};

let idAtual = 0;
let ouvinte: ((toast: ToastData) => void) | null = null;

/**
 * Mostra um toast padronizado (sucesso/erro/info) no topo da tela, some sozinho.
 * Pode ser chamado de qualquer lugar do app, sem precisar de hook/contexto:
 *   mostrarToast('sucesso', 'Evento agendado!');
 *   mostrarToast('erro', 'Não foi possível salvar', 'Tente novamente em instantes.');
 */
export function mostrarToast(tipo: TipoToast, titulo: string, mensagem?: string): void {
  idAtual += 1;
  ouvinte?.({ id: idAtual, tipo, titulo, mensagem });
}

/** Monte uma única vez, na raiz do app (app/_layout.tsx), pra renderizar os toasts disparados por mostrarToast(). */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastData | null>(null);
  const opacidade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ouvinte = novoToast => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast(novoToast);
    };
    return () => {
      ouvinte = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    opacidade.setValue(0);
    translateY.setValue(-16);
    Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      Animated.timing(opacidade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
    }, toast.tipo === 'erro' ? 4200 : 2800);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  if (!toast) return null;

  const estilo = ESTILO_POR_TIPO[toast.tipo];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.container,
        {
          top: insets.top + 10,
          backgroundColor: estilo.fundo,
          borderColor: estilo.borda,
          opacity: opacidade,
          transform: [{ translateY }],
        },
      ]}
    >
      <AppIcon name={estilo.icone} set="Ionicons" size={20} color={estilo.cor} />
      <View style={s.textos}>
        <Text style={[s.titulo, { color: estilo.cor }]}>{toast.titulo}</Text>
        {toast.mensagem ? <Text style={s.mensagem}>{toast.mensagem}</Text> : null}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  textos: { flex: 1 },
  titulo: { fontSize: 14, fontWeight: '700' },
  mensagem: { fontSize: 13, color: CORES.textoSecundario, marginTop: 2 },
});