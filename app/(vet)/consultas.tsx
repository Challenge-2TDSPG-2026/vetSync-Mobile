import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { useTheme } from '../../context/ThemeContext';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { DicaTela } from '../../components/ui/DicaTela';
import { STATUS_EXIBICAO_BADGE, formatarDataHoraEvento, statusExibicao } from '../../utils/eventoStatus';
import type { AppTheme } from '../../constants/theme';

export default function ConsultasScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { eventosAgendados, carregando } = useVet();
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-consultas');

  const listaOrdenada = [...eventosAgendados].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} progressBackgroundColor={theme.colors.surface} />}
      >
        {dicaVisivel && (
          <DicaTela
            titulo="Suas consultas"
            texto="Veja aqui todas as consultas agendadas com você, ordenadas por data. Toque numa consulta pra ver os detalhes do paciente."
            accentColor={theme.colors.primary}
            onFechar={fecharDica}
          />
        )}

        {carregando ? (
          <SkeletonList linhas={4} />
        ) : listaOrdenada.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="Nada por aqui"
            subtitle="Nenhuma consulta agendada no momento."
            accentColor={theme.colors.primary}
          />
        ) : (
          listaOrdenada.map(item => {
            const visual = obterVisualTipoEvento(item.nomeTipoEvento);
            const sb = STATUS_EXIBICAO_BADGE[statusExibicao(item)];
            return (
              <Pressable key={item.id} style={s.card} onPress={() => router.push(`/paciente/${item.petId}`)}>
                <View style={s.cardRow}>
                  <View style={[s.eventoIcone, { backgroundColor: visual.cor }]}>
                    <AppIcon name={visual.icon} set={visual.iconSet} size={18} color={theme.colors.onPrimary} />
                  </View>
                  <View style={s.eventoInfo}>
                    <Text style={s.eventoTitulo}>{item.nomeTipoEvento}</Text>
                    <Text style={s.eventoMeta}>{formatarDataHoraEvento(item.data)}</Text>
                    {item.observacao ? <Text style={s.eventoObs} numberOfLines={2}>{item.observacao}</Text> : null}
                  </View>
                </View>
                <View style={s.cardFooter}>
                  <View style={[s.badge, { backgroundColor: sb.bg }]}>
                    <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                  </View>
                  <Pressable style={s.btnFicha} onPress={() => router.push(`/paciente/${item.petId}`)}>
                    <Text style={s.btnFichaText}>Ver ficha</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  content: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' },

  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  eventoIcone: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  eventoMeta: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 3 },
  eventoObs: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.colors.surfaceSubtle },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  btnFicha: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: theme.colors.border },
  btnFichaText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
});
