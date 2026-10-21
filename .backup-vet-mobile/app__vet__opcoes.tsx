import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

const ATALHOS = [
  { titulo: 'Consultas', descricao: 'Confirme e acompanhe atendimentos', icone: 'calendar-outline' as const, rota: '/(vet)/consultas' as const, cor: 'info' as const },
  { titulo: 'Pacientes', descricao: 'Encontre pets e veja o histórico', icone: 'paw-outline' as const, rota: '/(vet)/pacientes' as const, cor: 'success' as const },
  { titulo: 'Disponibilidade', descricao: 'Horários e bloqueios de agenda', icone: 'time-outline' as const, rota: '/(vet)/disponibilidade' as const, cor: 'primary' as const },
  { titulo: 'Resgates', descricao: 'Valide benefícios dos tutores', icone: 'gift-outline' as const, rota: '/(vet)/resgates' as const, cor: 'warning' as const },
  { titulo: 'Relatórios', descricao: 'Indicadores e faturamento', icone: 'bar-chart-outline' as const, rota: '/(vet)/relatorios' as const, cor: 'info' as const },
  { titulo: 'Minha conta', descricao: 'Perfil e preferências', icone: 'person-outline' as const, rota: '/(vet)/perfil' as const, cor: 'primary' as const },
];

export default function VetOpcoesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[theme.components.header.background, theme.components.header.backgroundAccent]} style={s.hero}>
        <View style={s.heroIcon}><Ionicons name="grid-outline" size={24} color={theme.components.header.title} /></View>
        <Text style={s.eyebrow}>CENTRAL DA CLÍNICA</Text>
        <Text style={s.title}>Tudo para cuidar bem</Text>
        <Text style={s.description}>Acesse rapidamente as ferramentas da rotina veterinária e o suporte aos tutores.</Text>
      </LinearGradient>

      <Pressable style={s.assistant} onPress={() => router.push('/(tutor)/assistente')} accessibilityRole="button" accessibilityLabel="Abrir assistente de inteligência artificial">
        <View style={s.assistantIcon}><Ionicons name="sparkles" size={22} color={theme.colors.primary} /></View>
        <View style={s.copy}>
          <Text style={s.cardTitle}>SIA · Assistente veterinário</Text>
          <Text style={s.cardDescription}>Prepare orientações, organize retornos e estruture informações clínicas.</Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={theme.colors.textSecondary} />
      </Pressable>

      <Text style={s.sectionTitle}>Ferramentas</Text>
      <View style={s.grid}>
        {ATALHOS.map(item => (
          <Pressable key={item.titulo} style={({ pressed }) => [s.card, pressed && s.pressed]} onPress={() => router.push(item.rota)} accessibilityRole="button" accessibilityLabel={item.titulo}>
            <View style={[s.icon, { backgroundColor: item.cor === 'warning' ? theme.colors.warningBackground : item.cor === 'info' ? theme.colors.infoBackground : theme.colors.successBackground }]}>
              <Ionicons name={item.icone} size={23} color={theme.colors[item.cor]} />
            </View>
            <Text style={s.cardTitle}>{item.titulo}</Text>
            <Text style={s.cardDescription}>{item.descricao}</Text>
            <Ionicons style={s.arrow} name="arrow-forward" size={17} color={theme.colors.primary} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 20, paddingBottom: 40 },
    hero: { borderRadius: 24, padding: 22, marginBottom: 16, minHeight: 198, justifyContent: 'flex-end' },
    heroIcon: { position: 'absolute', top: 20, right: 20, width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
    eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: theme.colors.brandAccent, marginBottom: 8 },
    title: { fontSize: 26, lineHeight: 31, fontWeight: '800', color: theme.components.header.title },
    description: { fontSize: 13, lineHeight: 19, color: theme.components.header.title, opacity: 0.82, marginTop: 6, maxWidth: 300 },
    assistant: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.pages.shared.card, borderWidth: 1, borderColor: theme.pages.shared.border, borderRadius: 18, padding: 15, marginBottom: 25, elevation: 2 },
    assistantIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.successBackground },
    copy: { flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: { flexBasis: '47%', flexGrow: 1, minHeight: 150, padding: 15, borderRadius: 18, backgroundColor: theme.pages.shared.card, borderWidth: 1, borderColor: theme.pages.shared.border, elevation: 1 },
    icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    cardTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
    cardDescription: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15, marginTop: 4 },
    arrow: { position: 'absolute', right: 14, bottom: 13 },
    pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  });
}
