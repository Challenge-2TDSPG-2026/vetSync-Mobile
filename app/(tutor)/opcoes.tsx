import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppIcon } from '../../components/AppIcon';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import { withAlpha, type AppTheme } from '../../constants/theme';

const ATALHOS = [
  {
    titulo: 'Agenda',
    descricao: 'Próximos cuidados',
    icone: 'calendar-outline' as const,
    rota: '/(tutor)/agenda' as const,
    cor: 'primary' as const,
  },
  {
    titulo: 'Carteirinhas',
    descricao: 'Vacinas e documentos',
    icone: 'wallet-outline' as const,
    rota: '/(tutor)/carteirinhas' as const,
    cor: 'info' as const,
  },
  {
    titulo: 'Histórico',
    descricao: 'Cuidados realizados',
    icone: 'time-outline' as const,
    rota: '/(tutor)/historico' as const,
    cor: 'success' as const,
  },
  {
    titulo: 'Fidelidade',
    descricao: 'Pontos e benefícios',
    icone: 'gift-outline' as const,
    rota: '/(tutor)/recompensas' as const,
    cor: 'warning' as const,
  },
];

export default function OpcoesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const s = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, modoSimples && s.contentSimples]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[theme.pages.home.heroCard.background, theme.pages.home.heroCard.backgroundAccent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <AppIcon
          name="paw"
          set="MaterialCommunityIcons"
          size={220}
          color={theme.pages.home.heroCard.decoration}
          style={s.heroPawLarge}
        />
        <AppIcon name="paw" set="MaterialCommunityIcons" size={15} color={theme.pages.home.heroCard.decoration} style={s.heroPaw1} />
        <AppIcon name="paw" set="MaterialCommunityIcons" size={21} color={theme.pages.home.heroCard.decoration} style={s.heroPaw2} />
        <View style={s.heroMarca}>
          <Ionicons name="paw-outline" size={18} color={theme.pages.home.heroCard.title} />
          <Text style={s.heroMarcaTexto}>CUIDADOS DO PET</Text>
        </View>
        <Text style={[s.titulo, modoSimples && s.tituloSimples]}>Opções</Text>
        <Text style={[s.subtitulo, modoSimples && s.subtituloSimples]}>
          Acesse rapidamente os cuidados e registros mais importantes.
        </Text>
      </LinearGradient>

      <View style={s.secaoCabecalho}>
        <Text style={[s.secaoTitulo, modoSimples && s.secaoTituloSimples]}>Organize a rotina</Text>
        <Text style={[s.secaoDescricao, modoSimples && s.secaoDescricaoSimples]}>Escolha o que deseja consultar</Text>
      </View>

      <View style={s.grade}>
        {ATALHOS.map(atalho => {
          const cor = theme.colors[atalho.cor];

          return (
            <Pressable
              key={atalho.titulo}
              style={({ pressed }) => [
                s.cartao,
                modoSimples && s.cartaoSimples,
                pressed && s.cartaoPressionado,
              ]}
              onPress={() => router.push(atalho.rota)}
              accessibilityRole="button"
              accessibilityLabel={atalho.titulo}
              accessibilityHint={`Abre ${atalho.titulo.toLocaleLowerCase('pt-BR')}`}
            >
              <View style={[s.icone, { backgroundColor: withAlpha(cor, theme.mode === 'dark' ? 0.25 : 0.12) }]}>
                <Ionicons name={atalho.icone} size={modoSimples ? 32 : 25} color={cor} />
              </View>
              <View style={s.cartaoRodape}>
                <View style={s.cartaoTexto}>
                  <Text style={[s.cartaoTitulo, modoSimples && s.cartaoTituloSimples]}>{atalho.titulo}</Text>
                  <Text style={[s.cartaoDescricao, modoSimples && s.cartaoDescricaoSimples]}>{atalho.descricao}</Text>
                </View>
                <Ionicons name="arrow-forward" size={modoSimples ? 22 : 18} color={cor} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: page.background },
    content: { padding: 20, paddingBottom: 120 },
    contentSimples: { paddingHorizontal: 18 },
    hero: {
      borderRadius: 28,
      padding: 24,
      minHeight: 190,
      justifyContent: 'flex-end',
      marginBottom: 28,
      overflow: 'hidden',
    },
    heroPawLarge: { position: 'absolute', right: -35, top: -22, transform: [{ rotate: '-18deg' }] },
    heroPaw1: { position: 'absolute', right: 57, top: 22, transform: [{ rotate: '16deg' }] },
    heroPaw2: { position: 'absolute', right: 28, top: 51, transform: [{ rotate: '-18deg' }] },
    heroMarca: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
    heroMarcaTexto: { color: theme.pages.home.heroCard.title, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
    titulo: { color: theme.pages.home.heroCard.title, fontSize: 36, fontWeight: '800', letterSpacing: -0.8 },
    tituloSimples: { fontSize: 42 },
    subtitulo: { color: theme.pages.home.heroCard.title, fontSize: 16, lineHeight: 22, marginTop: 8, maxWidth: 275, opacity: 0.88 },
    subtituloSimples: { fontSize: 20, lineHeight: 27, maxWidth: 315 },
    secaoCabecalho: { marginBottom: 14 },
    secaoTitulo: { color: page.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.35 },
    secaoTituloSimples: { fontSize: 27 },
    secaoDescricao: { color: page.textSecondary, fontSize: 14, marginTop: 4 },
    secaoDescricaoSimples: { fontSize: 18, marginTop: 6 },
    grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    cartao: {
      flexBasis: '47.5%',
      minHeight: 168,
      justifyContent: 'space-between',
      backgroundColor: page.card,
      borderWidth: 1,
      borderColor: page.border,
      borderRadius: 22,
      padding: 16,
    },
    cartaoSimples: { width: '100%', minHeight: 148, padding: 20 },
    cartaoPressionado: { opacity: 0.78, transform: [{ scale: 0.98 }] },
    icone: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    cartaoRodape: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    cartaoTexto: { flex: 1 },
    cartaoTitulo: { color: page.text, fontSize: 17, fontWeight: '800' },
    cartaoTituloSimples: { fontSize: 24 },
    cartaoDescricao: { color: page.textSecondary, fontSize: 12, lineHeight: 16, marginTop: 4 },
    cartaoDescricaoSimples: { fontSize: 17, lineHeight: 22, marginTop: 6 },
  });
}
