import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme } from '../constants/theme';

export default function ModoSimplesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { modoSimples, alternarModoSimples } = useAccessibility();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 18) + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../assets/images/simpleMode.png')}
          style={s.heroImage}
          resizeMode="cover"
          accessibilityLabel="Tutor utilizando o VetSync ao lado de seu cachorro"
        />
        <View style={s.body}>
          <Text style={s.title}>Modo simples</Text>
          <Text style={s.intro}>
            Uma forma mais confortável de usar o VetSync, pensada para quem prefere textos maiores, botões mais fáceis de tocar e menos informações por tela.
          </Text>

          <View style={s.toggleCard}>
            <View style={s.toggleCopy}>
              <Text style={s.toggleTitle}>Usar versão simplificada</Text>
            </View>
            <Switch
              value={modoSimples}
              onValueChange={alternarModoSimples}
              trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primary }}
              thumbColor={theme.colors.surfaceElevated}
              style={s.switch}
              accessibilityLabel={modoSimples ? 'Desativar modo simples' : 'Ativar modo simples'}
            />
          </View>

          <Text style={s.sectionTitle}>O que muda no aplicativo</Text>
          <View style={s.benefitsCard}>
            <Benefit icon="text-outline" title="Textos maiores" description="As informações principais ficam mais fáceis de ler." />
            <View style={s.divider} />
            <Benefit icon="hand-left-outline" title="Botões amplos" description="Mais espaço para tocar com segurança e conforto." />
            <View style={s.divider} />
            <Benefit icon="eye-outline" title="Menos distrações" description="As telas mostram primeiro o que é mais importante." />
          </View>

          <Pressable style={s.doneButton} onPress={() => router.back()} accessibilityRole="button">
            <Text style={s.doneButtonText}>Voltar para o perfil</Text>
            <Ionicons name="arrow-forward" size={21} color={theme.colors.onPrimary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Benefit({ icon, title, description }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; description: string }) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={s.benefit}>
      <View style={s.benefitIcon}><Ionicons name={icon} size={22} color={theme.colors.primary} /></View>
      <View style={s.benefitCopy}>
        <Text style={s.benefitTitle}>{title}</Text>
        <Text style={s.benefitDescription}>{description}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { backgroundColor: theme.colors.background },
  heroImage: { width: '100%', height: 270 },
  body: { paddingHorizontal: 22, paddingTop: 28 },
  title: { color: theme.colors.text, fontSize: 38, fontWeight: '800', letterSpacing: -1.1, lineHeight: 44 },
  intro: { color: theme.colors.textSecondary, fontSize: 20, lineHeight: 30, marginTop: 14, maxWidth: 550 },

  toggleCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle, padding: 18, marginTop: 30 },
  toggleCopy: { flex: 1, minWidth: 0 },
  toggleTitle: { color: theme.colors.text, fontSize: 21, fontWeight: '800', lineHeight: 27 },
  switch: { transform: [{ scale: 1.18 }] },

  sectionTitle: { color: theme.colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.45, marginTop: 36, marginBottom: 14 },
  benefitsCard: { backgroundColor: theme.colors.surface, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 17, paddingVertical: 18 },
  benefitIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: theme.colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  benefitCopy: { flex: 1, minWidth: 0 },
  benefitTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  benefitDescription: { color: theme.colors.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 3 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginLeft: 77 },

  doneButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 58, borderRadius: 18, backgroundColor: theme.colors.primary, marginTop: 28 },
  doneButtonText: { color: theme.colors.onPrimary, fontSize: 18, fontWeight: '800' },
});
