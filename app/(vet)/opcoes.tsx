import { EmojiFilteredTextInput } from '../../components/ui/EmojiFilteredTextInput';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useVet } from '../../context/VetContext';
import { useMeusResgates } from '../../hooks/useRecompensas';
import { statusExibicao } from '../../utils/eventoStatus';
import type { AppTheme } from '../../constants/theme';

type Rota = '/(vet)/consultas' | '/(vet)/pacientes' | '/(vet)/disponibilidade' | '/(vet)/resgates' | '/(vet)/relatorios' | '/(vet)/perfil' | '/sobre-app';
type Cor = 'info' | 'success' | 'primary' | 'warning' | 'neutral';

type Item = {
  chave: string;
  titulo: string;
  descricao: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
  rota: Rota;
  cor: Cor;
  selo?: number;
};

type Grupo = { titulo: string; itens: Item[] };

export default function VetOpcoesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { eventos, eventosDeHoje, pacientes } = useVet();
  const { data: resgates = [] } = useMeusResgates(true);
  const [busca, setBusca] = useState('');

  const atrasados = eventos.filter(e => statusExibicao(e) === 'ATRASADO').length;
  const resgatesPendentes = resgates.filter(r => r.status === 'PENDENTE').length;

  const grupos: Grupo[] = useMemo(() => [
    {
      titulo: 'Atendimento',
      itens: [
        { chave: 'consultas', titulo: 'Consultas', descricao: `${eventosDeHoje.length} hoje${atrasados > 0 ? ` • ${atrasados} em atraso` : ''}`, icone: 'calendar-outline', rota: '/(vet)/consultas', cor: 'info', selo: atrasados },
        { chave: 'pacientes', titulo: 'Pacientes', descricao: `${pacientes.length} cadastrado${pacientes.length === 1 ? '' : 's'}`, icone: 'paw-outline', rota: '/(vet)/pacientes', cor: 'success' },
        { chave: 'disponibilidade', titulo: 'Disponibilidade', descricao: 'Horários e bloqueios de agenda', icone: 'time-outline', rota: '/(vet)/disponibilidade', cor: 'primary' },
      ],
    },
    {
      titulo: 'Clínica',
      itens: [
        { chave: 'resgates', titulo: 'Resgates', descricao: resgatesPendentes > 0 ? `${resgatesPendentes} aguardando validação` : 'Valide benefícios dos tutores', icone: 'gift-outline', rota: '/(vet)/resgates', cor: 'warning', selo: resgatesPendentes },
        { chave: 'relatorios', titulo: 'Relatórios', descricao: 'Indicadores e faturamento', icone: 'bar-chart-outline', rota: '/(vet)/relatorios', cor: 'info' },
      ],
    },
    {
      titulo: 'Geral',
      itens: [
        { chave: 'conta', titulo: 'Minha conta', descricao: 'Perfil e preferências', icone: 'person-outline', rota: '/(vet)/perfil', cor: 'neutral' },
        { chave: 'sobre', titulo: 'Sobre o app', descricao: 'Versão e commit de referência', icone: 'information-circle-outline', rota: '/sobre-app', cor: 'neutral' },
      ],
    },
  ], [eventosDeHoje.length, atrasados, pacientes.length, resgatesPendentes]);

  const termo = busca.trim().toLocaleLowerCase();
  const gruposFiltrados = termo
    ? grupos
        .map(g => ({ ...g, itens: g.itens.filter(i => `${i.titulo} ${i.descricao}`.toLocaleLowerCase().includes(termo)) }))
        .filter(g => g.itens.length > 0)
    : grupos;

  const fundoIcone = (cor: Cor) => {
    if (cor === 'warning') return theme.colors.warningBackground;
    if (cor === 'info') return theme.colors.infoBackground;
    if (cor === 'neutral') return theme.pages.shared.cardSecondary;
    return theme.colors.successBackground;
  };
  const corIcone = (cor: Cor) => (cor === 'neutral' ? theme.colors.textSecondary : theme.colors[cor]);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.title} accessibilityRole="header">Opções</Text>
      <Text style={s.subtitle}>Central da clínica</Text>

      <View style={s.search}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
        <EmojiFilteredTextInput
          style={s.searchInput}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar ferramenta…"
          placeholderTextColor={theme.colors.textMuted}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar ferramenta"
        />
        {busca.length > 0 && (
          <Pressable onPress={() => setBusca('')} accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {!termo && (
        <Pressable style={({ pressed }) => [s.sia, pressed && s.pressed]} onPress={() => router.push('/(tutor)/assistente')} accessibilityRole="button" accessibilityLabel="Abrir assistente de inteligência artificial">
          <View style={s.siaIcon}><Ionicons name="sparkles" size={22} color="#0a2218" /></View>
          <View style={s.copy}>
            <Text style={s.siaTitle}>Pergunte à SIA</Text>
            <Text style={s.siaDescription}>Orientações, retornos e resumos clínicos</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={theme.pages.vetDashboard.heroText} />
        </Pressable>
      )}

      {gruposFiltrados.map(grupo => (
        <View key={grupo.titulo}>
          <Text style={s.sectionLabel}>{grupo.titulo}</Text>
          <View style={s.group}>
            {grupo.itens.map((item, idx) => (
              <Pressable
                key={item.chave}
                style={({ pressed }) => [s.row, idx < grupo.itens.length - 1 && s.rowBorder, pressed && s.pressed]}
                onPress={() => router.push(item.rota)}
                accessibilityRole="button"
                accessibilityLabel={`${item.titulo}. ${item.descricao}`}
              >
                <View style={[s.icon, { backgroundColor: fundoIcone(item.cor) }]}>
                  <Ionicons name={item.icone} size={20} color={corIcone(item.cor)} />
                </View>
                <View style={s.copy}>
                  <Text style={s.rowTitle}>{item.titulo}</Text>
                  <Text style={s.rowDescription} numberOfLines={1}>{item.descricao}</Text>
                </View>
                {item.selo ? (
                  <View style={s.badge}><Text style={s.badgeText}>{item.selo > 99 ? '99+' : item.selo}</Text></View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {termo && gruposFiltrados.length === 0 && (
        <Text style={s.empty}>Nenhuma ferramenta encontrada para “{busca.trim()}”.</Text>
      )}
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  const shared = theme.pages.shared;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 20, paddingBottom: 44 },
    title: { fontSize: 26, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.4 },
    subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },

    search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: shared.card, borderWidth: 1, borderColor: shared.border, borderRadius: 14, paddingHorizontal: 14, marginTop: 16, minHeight: 46 },
    searchInput: { flex: 1, fontSize: 14, color: theme.colors.text, paddingVertical: 10 },

    sia: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.pages.vetDashboard.heroBackground, borderRadius: 18, padding: 15, marginTop: 14, elevation: 2 },
    siaIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.brandAccent },
    siaTitle: { fontSize: 14, fontWeight: '800', color: theme.pages.vetDashboard.heroText },
    siaDescription: { fontSize: 11, color: theme.pages.vetDashboard.heroText, opacity: 0.8, marginTop: 2 },

    sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.colors.textSecondary, marginTop: 22, marginBottom: 10, paddingLeft: 2 },
    group: { backgroundColor: shared.card, borderRadius: 18, borderWidth: 1, borderColor: shared.border, overflow: 'hidden', elevation: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: shared.border },
    icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    copy: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
    rowDescription: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: theme.colors.danger, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
    empty: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 28 },
    pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  });
}
