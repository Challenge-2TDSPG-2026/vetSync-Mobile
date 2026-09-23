import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { STATUS_EXIBICAO_BADGE, formatarDataHoraEvento, statusExibicao } from '../../utils/eventoStatus';

const C = {
  g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52', g500: '#22a06b', g50: '#edfaf3', g200: '#a8e6c7',
  cream: '#fafaf8', w50: '#f9f7f4', text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', warn: '#e67e22', info: '#2563eb',
};

export default function ConsultasScreen() {
  const router = useRouter();
  const { eventosAgendados, carregando } = useVet();
  const { atualizando, aoAtualizar } = useRecarregarDados();

  const listaOrdenada = [...eventosAgendados].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={C.g600} colors={[C.g600]} />}
      >
        {carregando ? (
          <SkeletonList linhas={4} />
        ) : listaOrdenada.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="Nada por aqui"
            subtitle="Nenhuma consulta agendada no momento."
            accentColor={C.g600}
          />
        ) : (
          listaOrdenada.map(item => {
            const visual = obterVisualTipoEvento(item.nomeTipoEvento);
            const sb = STATUS_EXIBICAO_BADGE[statusExibicao(item)];
            return (
              <Pressable key={item.id} style={s.card} onPress={() => router.push(`/paciente/${item.petId}`)}>
                <View style={s.cardRow}>
                  <View style={[s.eventoIcone, { backgroundColor: visual.cor }]}>
                    <AppIcon name={visual.icon} set={visual.iconSet} size={18} color={C.white} />
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },

  content: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center' },

  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  eventoIcone: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 14, fontWeight: '700', color: C.text },
  eventoMeta: { fontSize: 11, color: C.muted, marginTop: 3 },
  eventoObs: { fontSize: 11, color: C.muted, marginTop: 4, fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.w50 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  btnFicha: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: C.border },
  btnFichaText: { color: C.text, fontSize: 12, fontWeight: '600' },
});