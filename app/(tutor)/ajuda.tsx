import { EmojiFilteredTextInput } from '../../components/ui/EmojiFilteredTextInput';
import React, { useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type RotaAjuda = Parameters<ReturnType<typeof useRouter>['push']>[0];

interface GuiaAjuda {
  icone: IconName;
  titulo: string;
  descricao: string;
  categoria: 'PET' | 'CLINICA' | 'CONTA';
  rota: RotaAjuda;
  acao: string;
}

const GUIAS: GuiaAjuda[] = [
  {
    icone: 'paw-outline',
    titulo: 'Cadastrar ou escolher um pet',
    descricao: 'Veja os pets da sua conta, atualize os dados ou cadastre um novo companheiro.',
    categoria: 'PET',
    rota: '/pets-cadastrados',
    acao: 'Ver meus pets',
  },
  {
    icone: 'calendar-outline',
    titulo: 'Organizar a agenda',
    descricao: 'Consulte os cuidados previstos e toque em uma data para ver os eventos do seu pet.',
    categoria: 'PET',
    rota: '/(tutor)/(tabs)/agenda',
    acao: 'Abrir agenda',
  },
  {
    icone: 'notifications-outline',
    titulo: 'Criar lembretes',
    descricao: 'Ao cadastrar um evento, escolha os avisos que quer receber antes do compromisso.',
    categoria: 'PET',
    rota: '/(tutor)/add-evento',
    acao: 'Criar evento',
  },
  {
    icone: 'card-outline',
    titulo: 'Consultar a carteirinha',
    descricao: 'Acompanhe as vacinas registradas e os próximos cuidados de cada pet.',
    categoria: 'PET',
    rota: '/(tutor)/(tabs)/carteirinhas',
    acao: 'Abrir carteirinhas',
  },
  {
    icone: 'time-outline',
    titulo: 'Ver o histórico de saúde',
    descricao: 'Encontre os atendimentos e cuidados que já foram registrados para o seu pet.',
    categoria: 'PET',
    rota: '/(tutor)/(tabs)/historico',
    acao: 'Abrir histórico',
  },
  {
    icone: 'camera-outline',
    titulo: 'Atualizar a foto do pet',
    descricao: 'Abra os pets cadastrados e toque na foto para usar a câmera ou escolher uma imagem.',
    categoria: 'PET',
    rota: '/pets-cadastrados',
    acao: 'Ver meus pets',
  },
  {
    icone: 'business-outline',
    titulo: 'Encontrar informações da clínica',
    descricao: 'Consulte endereço, telefone, horários e serviços da clínica vinculada à sua conta.',
    categoria: 'CLINICA',
    rota: '/(tutor)/minha-clinica',
    acao: 'Ver minha clínica',
  },
  {
    icone: 'chatbubbles-outline',
    titulo: 'Conversar com a clínica',
    descricao: 'Inicie uma conversa e acompanhe as mensagens enviadas pela equipe.',
    categoria: 'CLINICA',
    rota: '/(tutor)/mensagens-clinica',
    acao: 'Abrir mensagens',
  },
  {
    icone: 'people-outline',
    titulo: 'Compartilhar os cuidados',
    descricao: 'Convide alguém de confiança e escolha se essa pessoa poderá apenas consultar ou também editar.',
    categoria: 'CLINICA',
    rota: '/(tutor)/responsaveis',
    acao: 'Gerenciar responsáveis',
  },
  {
    icone: 'notifications-outline',
    titulo: 'Encontrar avisos e lembretes',
    descricao: 'Notificações novas ficam destacadas até você abrir ou marcar como vistas.',
    categoria: 'CLINICA',
    rota: '/(tutor)/(tabs)/notificacoes',
    acao: 'Ver notificações',
  },
  {
    icone: 'shield-checkmark-outline',
    titulo: 'Proteger o acesso à conta',
    descricao: 'Ative a biometria neste aparelho, vincule o Google ou solicite a troca da senha.',
    categoria: 'CONTA',
    rota: '/(tutor)/(tabs)/seguranca',
    acao: 'Abrir segurança',
  },
  {
    icone: 'settings-outline',
    titulo: 'Ajustar conta e aparência',
    descricao: 'Atualize seus dados, escolha o tema e encontre as preferências do aplicativo.',
    categoria: 'CONTA',
    rota: '/(tutor)/configuracoes',
    acao: 'Abrir configurações',
  },
  {
    icone: 'sparkles-outline',
    titulo: 'Conversar com a SIA',
    descricao: 'Peça ajuda para organizar dúvidas e marcar uma consulta. Para urgências, procure uma clínica presencialmente.',
    categoria: 'CONTA',
    rota: '/(tutor)/assistente',
    acao: 'Abrir assistente',
  },
];

const SECOES: { id: GuiaAjuda['categoria']; titulo: string }[] = [
  { id: 'PET', titulo: 'Cuidados com o pet' },
  { id: 'CLINICA', titulo: 'Clínica e comunicação' },
  { id: 'CONTA', titulo: 'Conta e segurança' },
];

export default function AjudaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [busca, setBusca] = useState('');

  const secoesVisiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return SECOES.map(secao => ({
      ...secao,
      guias: GUIAS.filter(guia =>
        guia.categoria === secao.id &&
        (!termo || `${guia.titulo} ${guia.descricao}`.toLocaleLowerCase('pt-BR').includes(termo)),
      ),
    })).filter(secao => secao.guias.length > 0);
  }, [busca]);

  function abrirGuia(rota: RotaAjuda) {
    router.push(rota);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) + 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ImageBackground
          source={require('../../assets/images/help.png')}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="Tutor e veterinária conversando sobre o cuidado de um pet"
        >
          <LinearGradient
            colors={['rgba(5, 25, 18, 0.16)', 'rgba(5, 25, 18, 0.36)', 'rgba(5, 25, 18, 0.94)']}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            style={[styles.backButton, { top: Math.max(insets.top, 14) }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para minha conta"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Ionicons name="help-buoy" size={modoSimples ? 31 : 25} color={theme.colors.primary} />
            </View>
            <Text style={[styles.heroEyebrow, modoSimples && sSimple.heroEyebrow]}>CENTRAL DE AJUDA</Text>
            <Text style={[styles.heroTitle, modoSimples && sSimple.heroTitle]}>Como usar o VetSync</Text>
            <Text style={[styles.heroSubtitle, modoSimples && sSimple.heroSubtitle]}>
              Encontre orientações e abra direto a área que você precisa.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color={theme.colors.textMuted} />
            <EmojiFilteredTextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar uma orientação"
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.searchInput, modoSimples && sSimple.searchInput]}
              accessibilityLabel="Buscar orientações de ajuda"
              returnKeyType="search"
            />
            {busca ? (
              <Pressable
                onPress={() => setBusca('')}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {secoesVisiveis.length ? (
            secoesVisiveis.map(secao => (
              <View key={secao.id}>
                <View style={styles.sectionHeading}>
                  <View style={styles.sectionIcon}>
                    <Ionicons
                      name={secao.id === 'PET' ? 'paw-outline' : secao.id === 'CLINICA' ? 'business-outline' : 'person-circle-outline'}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={[styles.sectionTitle, modoSimples && sSimple.sectionTitle]}>
                    {secao.titulo}
                  </Text>
                </View>

                <View style={styles.guideList}>
                  {secao.guias.map(guia => (
                    <View style={styles.guideCard} key={guia.titulo}>
                      <View style={styles.guideTop}>
                        <View style={styles.guideIcon}>
                          <Ionicons name={guia.icone} size={21} color={theme.colors.primary} />
                        </View>
                        <View style={styles.guideCopy}>
                          <Text style={[styles.guideTitle, modoSimples && sSimple.guideTitle]}>
                            {guia.titulo}
                          </Text>
                          <Text style={[styles.guideDescription, modoSimples && sSimple.guideDescription]}>
                            {guia.descricao}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        style={styles.guideAction}
                        onPress={() => abrirGuia(guia.rota)}
                        accessibilityRole="button"
                        accessibilityLabel={guia.acao}
                      >
                        <Text style={[styles.guideActionText, modoSimples && sSimple.guideActionText]}>
                          {guia.acao}
                        </Text>
                        <Ionicons name="arrow-forward" size={17} color={theme.colors.primary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={28} color={theme.colors.textMuted} />
              <Text style={[styles.noResultsTitle, modoSimples && sSimple.sectionTitle]}>
                Nenhum guia encontrado
              </Text>
              <Text style={[styles.noResultsText, modoSimples && sSimple.guideDescription]}>
                Tente buscar por pet, agenda, senha ou clínica.
              </Text>
              <Pressable onPress={() => setBusca('')} accessibilityRole="button">
                <Text style={styles.clearSearchText}>Limpar busca</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={styles.contactCard}
            onPress={() => router.push('/(tutor)/mensagens-clinica')}
            accessibilityRole="button"
            accessibilityLabel="Conversar com a clínica para obter ajuda"
          >
            <View style={styles.contactIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.contactCopy}>
              <Text style={[styles.contactTitle, modoSimples && sSimple.guideTitle]}>
                Ainda precisa de ajuda?
              </Text>
              <Text style={[styles.contactDescription, modoSimples && sSimple.guideDescription]}>
                Converse diretamente com a equipe da sua clínica.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    content: { paddingBottom: 30 },
    hero: { height: 290, justifyContent: 'flex-end', backgroundColor: theme.pages.shared.heroBackground },
    heroImage: { width: '100%', height: '100%' },
    backButton: {
      position: 'absolute',
      left: 18,
      zIndex: 2,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.pages.shared.cardElevated,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
    },
    heroContent: { paddingHorizontal: 22, paddingTop: 80, paddingBottom: 23 },
    heroIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.pages.shared.cardElevated, marginBottom: 11 },
    heroEyebrow: { color: '#d8f1df', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
    heroTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900', letterSpacing: -0.7, marginTop: 4 },
    heroSubtitle: { color: '#f0f6f1', fontSize: 13, lineHeight: 19, marginTop: 5 },
    body: { paddingHorizontal: 19, paddingTop: 20 },
    searchBox: {
      minHeight: 51,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      backgroundColor: theme.pages.shared.card,
      marginBottom: 24,
    },
    searchInput: { flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 14, paddingVertical: 10 },
    sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 11, marginTop: 4 },
    sectionIcon: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.successBackground },
    sectionTitle: { flex: 1, color: theme.colors.text, fontSize: 17, fontWeight: '900' },
    guideList: { gap: 10, marginBottom: 22 },
    guideCard: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: theme.pages.shared.border, backgroundColor: theme.pages.shared.card },
    guideTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
    guideIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.colors.successBackground },
    guideCopy: { flex: 1, minWidth: 0 },
    guideTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '900' },
    guideDescription: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
    guideAction: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7, marginTop: 6, paddingHorizontal: 2 },
    guideActionText: { color: theme.colors.primary, fontSize: 12, fontWeight: '900' },
    noResults: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 35 },
    noResultsTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900', marginTop: 12 },
    noResultsText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5 },
    clearSearchText: { color: theme.colors.primary, fontSize: 13, fontWeight: '900', padding: 12, marginTop: 3 },
    contactCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: theme.pages.shared.border, backgroundColor: theme.pages.shared.card, marginTop: 4 },
    contactIcon: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.colors.successBackground },
    contactCopy: { flex: 1, minWidth: 0 },
    contactTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '900' },
    contactDescription: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
  });
}

const sSimple = StyleSheet.create({
  heroEyebrow: { fontSize: 13 },
  heroTitle: { fontSize: 33 },
  heroSubtitle: { fontSize: 17, lineHeight: 24 },
  searchInput: { fontSize: 17 },
  sectionTitle: { fontSize: 21 },
  guideTitle: { fontSize: 18 },
  guideDescription: { fontSize: 16, lineHeight: 24 },
  guideActionText: { fontSize: 16 },
  contactTitle: { fontSize: 18 },
});
