import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';

const C = {
  g900: '#0a2218',
  g700: '#155c3f',
  cream: '#fafaf8',
  w50: '#f0ece5',
  text: '#1a1512',
  muted: '#7a6a5e',
  border: '#e8e2da',
  white: '#fff',
  danger: '#dc3545',
};

type Props = {
  visivel: boolean;
  onFechar: () => void;
  onConfirmarSair: () => void | Promise<void>;
};

export function LogoutConfirmationModal({ visivel, onFechar, onConfirmarSair }: Props) {
  const { modoSimples } = useAccessibility();
  const escala = useRef(new Animated.Value(0.92)).current;
  const opacidade = useRef(new Animated.Value(0)).current;
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (!visivel) {
      setSaindo(false);
      return;
    }
    escala.setValue(0.92);
    opacidade.setValue(0);
    Animated.parallel([
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, friction: 8, tension: 80 }),
      Animated.timing(opacidade, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [visivel, escala, opacidade]);

  async function handleSair() {
    if (saindo) return;
    setSaindo(true);
    try {
      await onConfirmarSair();
    } finally {
      setSaindo(false);
    }
  }

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onFechar}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <Animated.View
          style={[
            s.card,
            modoSimples && sSimples.card,
            { opacity: opacidade, transform: [{ scale: escala }] },
          ]}
          accessibilityViewIsModal
        >
          <View style={[s.iconeWrap, modoSimples && sSimples.iconeWrap]}>
            <Ionicons name="log-out-outline" size={modoSimples ? 34 : 26} color={C.g700} />
          </View>
          <Text style={[s.titulo, modoSimples && sSimples.titulo]}>Tem certeza que deseja sair?</Text>
          <Text style={[s.subtitulo, modoSimples && sSimples.subtitulo]}>
            Você precisará entrar novamente para acessar o aplicativo.
          </Text>
          <View style={s.acoes}>
            <Pressable
              style={[s.btnFechar, modoSimples && sSimples.btn]}
              onPress={onFechar}
              disabled={saindo}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Text style={[s.btnFecharText, modoSimples && sSimples.btnText]}>Fechar</Text>
            </Pressable>
            <Pressable
              style={[s.btnSair, modoSimples && sSimples.btn, saindo && { opacity: 0.6 }]}
              onPress={handleSair}
              disabled={saindo}
              accessibilityRole="button"
              accessibilityLabel="Sair"
            >
              <Text style={[s.btnSairText, modoSimples && sSimples.btnText]}>Sair</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,34,24,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  iconeWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    alignSelf: 'center',
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  acoes: {
    flexDirection: 'row',
    gap: 10,
  },
  btnFechar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.w50,
  },
  btnFecharText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  btnSair: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: C.danger,
  },
  btnSairText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

const sSimples = StyleSheet.create({
  card: { padding: 28 },
  iconeWrap: { width: 64, height: 64, borderRadius: 32, marginBottom: 18 },
  titulo: { fontSize: 24 },
  subtitulo: { fontSize: 19, lineHeight: 26, marginBottom: 24 },
  btn: { paddingVertical: 19 },
  btnText: { fontSize: 20 },
});