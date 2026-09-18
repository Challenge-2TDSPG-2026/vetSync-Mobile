import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

type Props = { href: '/(tutor)/perfil' | '/(vet)/perfil' };

export function AccountHeaderAction({ href }: Props) {
  const router = useRouter();
  const { sessao } = useAuth();
  const nome = sessao?.nome?.trim().split(/\s+/)[0] ?? 'Conta';
  return <Pressable onPress={() => router.push(href)} style={s.button} accessibilityRole="button" accessibilityLabel="Abrir minha conta">
    <View style={s.copy}><Text numberOfLines={1} style={s.greeting}>Olá, {nome}</Text><Text style={s.caption}>MINHA CONTA</Text></View>
    <View style={s.icon}><Ionicons name="person" size={16} color="#0e3326" /></View>
  </Pressable>;
}

const s = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', maxWidth: 148, marginRight: 12, paddingVertical: 4, paddingRight: 4, paddingLeft: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  copy: { alignItems: 'flex-end', flexShrink: 1 }, greeting: { color: '#ffffff', fontSize: 12, fontWeight: '800', maxWidth: 94 }, caption: { color: 'rgba(255,255,255,0.67)', fontSize: 8, letterSpacing: 0.7, fontWeight: '800', marginTop: 1 },
  icon: { width: 32, height: 32, borderRadius: 16, marginLeft: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#bfe9d5' },
});
