import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';

const C = {
  night: '#0a2218', forest: '#155c3f', green: '#1a7a52', mint: '#d4f2e4', mintSoft: '#edf9f3',
  cream: '#fafaf8', white: '#fff', text: '#1a1512', muted: '#685f58', border: '#dfd9d1',
};

export default function ModoSimplesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { modoSimples, alternarModoSimples } = useAccessibility();

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: Math.max(insets.top, 16) + 12, paddingBottom: Math.max(insets.bottom, 18) + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={s.backButton}
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao perfil"
        >
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </Pressable>

        <View style={s.heroIcon}>
          <Ionicons name="accessibility-outline" size={34} color={C.green} />
        </View>
        <Text style={s.title}>Modo simples</Text>
        <Text style={s.intro}>
          Uma forma mais confortável de usar o VetSync, pensada para quem prefere textos maiores, botões mais fáceis de tocar e menos informações por tela.
        </Text>

        <View style={s.toggleCard}>
          <View style={s.toggleCopy}>
            <Text style={s.toggleTitle}>Usar versão simplificada</Text>
            <Text style={s.toggleDescription}>A mudança será percebida nas demais telas quando você sair daqui.</Text>
          </View>
          <Switch
            value={modoSimples}
            onValueChange={alternarModoSimples}
            trackColor={{ false: '#d8d2ca', true: C.green }}
            thumbColor={C.white}
            style={s.switch}
            accessibilityLabel={modoSimples ? 'Desativar modo simples' : 'Ativar modo simples'}
          />
        </View>

        <View style={s.statusCard}>
          <View style={[s.statusDot, modoSimples && s.statusDotActive]} />
          <Text style={s.statusText}>{modoSimples ? 'O modo simples está ativado.' : 'O modo simples está desativado.'}</Text>
        </View>

        <Text style={s.sectionTitle}>O que muda no aplicativo</Text>
        <View style={s.benefitsCard}>
          <Benefit icon="text-outline" title="Textos maiores" description="As informações principais ficam mais fáceis de ler." />
          <View style={s.divider} />
          <Benefit icon="hand-left-outline" title="Botões amplos" description="Mais espaço para tocar com segurança e conforto." />
          <View style={s.divider} />
          <Benefit icon="eye-outline" title="Menos distrações" description="As telas mostram primeiro o que é mais importante." />
        </View>

        <View style={s.notice}>
          <Ionicons name="information-circle-outline" size={22} color={C.green} />
          <Text style={s.noticeText}>Esta tela mantém o mesmo tamanho antes e depois da escolha. Assim, você pode decidir com tranquilidade.</Text>
        </View>

        <Pressable style={s.doneButton} onPress={() => router.back()} accessibilityRole="button">
          <Text style={s.doneButtonText}>Voltar para o perfil</Text>
          <Ionicons name="arrow-forward" size={21} color={C.white} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Benefit({ icon, title, description }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; description: string }) {
  return (
    <View style={s.benefit}>
      <View style={s.benefitIcon}><Ionicons name={icon} size={22} color={C.green} /></View>
      <View style={s.benefitCopy}>
        <Text style={s.benefitTitle}>{title}</Text>
        <Text style={s.benefitDescription}>{description}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.night },
  content: { paddingHorizontal: 22, backgroundColor: C.night },
  backButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  heroIcon: { width: 68, height: 68, borderRadius: 22, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { color: C.white, fontSize: 38, fontWeight: '800', letterSpacing: -1.1, lineHeight: 44 },
  intro: { color: 'rgba(255,255,255,0.82)', fontSize: 20, lineHeight: 30, marginTop: 14, maxWidth: 550 },

  toggleCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)', padding: 18, marginTop: 30 },
  toggleCopy: { flex: 1, minWidth: 0 },
  toggleTitle: { color: C.white, fontSize: 21, fontWeight: '800', lineHeight: 27 },
  toggleDescription: { color: 'rgba(255,255,255,0.70)', fontSize: 16, lineHeight: 22, marginTop: 6 },
  switch: { transform: [{ scale: 1.18 }] },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#aaa39a' },
  statusDotActive: { backgroundColor: '#6ce2a5' },
  statusText: { color: 'rgba(255,255,255,0.74)', fontSize: 15, fontWeight: '700' },

  sectionTitle: { color: C.white, fontSize: 25, fontWeight: '800', letterSpacing: -0.45, marginTop: 36, marginBottom: 14 },
  benefitsCard: { backgroundColor: C.cream, borderRadius: 22, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 17, paddingVertical: 18 },
  benefitIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center' },
  benefitCopy: { flex: 1, minWidth: 0 },
  benefitTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  benefitDescription: { color: C.muted, fontSize: 15, lineHeight: 21, marginTop: 3 },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 77 },

  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(212,242,228,0.12)', borderRadius: 16, padding: 15, marginTop: 18 },
  noticeText: { flex: 1, color: 'rgba(255,255,255,0.82)', fontSize: 15, lineHeight: 21 },
  doneButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 58, borderRadius: 18, backgroundColor: C.green, marginTop: 28 },
  doneButtonText: { color: C.white, fontSize: 18, fontWeight: '800' },
});
