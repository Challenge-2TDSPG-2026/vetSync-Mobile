import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '../AppIcon';
import { PlanoItemRow, corDoStatus } from './PlanoItemRow';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { usePet } from '../../context/PetContext';
import { useAuth } from '../../context/AuthContext';
import { usePlanoPreventivo } from '../../hooks/usePlanoPreventivo';
import { itensDeAtencao, type PlanoItem } from '../../utils/planoPreventivo';
import { abrirAgendamentoDoPlano } from '../../utils/planoNavegacao';
import type { AppTheme } from '../../constants/theme';

/** Resumo do plano preventivo para o dashboard. Some se não há nada a mostrar. */
export function PlanoPreventivoCard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { petAtivo } = usePet();
  const { autenticado } = useAuth();
  const { itens, resumo, carregando, erro } = usePlanoPreventivo(petAtivo?.id ?? null, autenticado);

  const atencao = useMemo(() => itensDeAtencao(itens).slice(0, modoSimples ? 2 : 3), [itens, modoSimples]);
  const abrirPlano = () => router.push('/(tutor)/plano-preventivo');

  // Sem registros da clínica e sem erro: não ocupa espaço no dashboard.
  if (!carregando && !erro && itens.length === 0) return null;

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={s.tituloWrap}>
          <View style={s.tituloIcone}>
            <AppIcon name="shield-checkmark-outline" set="Ionicons" size={16} color={theme.colors.primary} />
          </View>
          <Text style={[s.titulo, modoSimples && s.tituloSimples]}>Plano preventivo</Text>
        </View>
        <Pressable onPress={abrirPlano} accessibilityRole="button" accessibilityLabel="Ver plano preventivo completo">
          <Text style={[s.link, modoSimples && s.linkSimples]}>Ver plano</Text>
        </Pressable>
      </View>

      {carregando ? (
        <View style={s.estado}><ActivityIndicator color={theme.colors.primary} /></View>
      ) : erro ? (
        <Pressable style={s.estado} onPress={abrirPlano} accessibilityRole="button">
          <Text style={s.estadoTexto}>Não foi possível carregar o plano. Toque para tentar novamente.</Text>
        </Pressable>
      ) : (
        <>
          <View style={s.contadores}>
            <Contador s={s} valor={resumo.atrasados} rotulo="Atrasados" cor={corDoStatus(theme, 'ATRASADO')} simples={modoSimples} />
            <View style={s.divisor} />
            <Contador s={s} valor={resumo.vencendo} rotulo="Vencendo" cor={corDoStatus(theme, 'VENCENDO')} simples={modoSimples} />
            <View style={s.divisor} />
            <Contador s={s} valor={resumo.emDia + resumo.futuros} rotulo="Em dia" cor={corDoStatus(theme, 'EM_DIA')} simples={modoSimples} />
          </View>

          {atencao.length === 0 ? (
            <View style={s.tudoEmDia}>
              <AppIcon name="checkmark-circle" set="Ionicons" size={22} color={theme.colors.success} />
              <Text style={[s.tudoEmDiaTexto, modoSimples && s.tudoEmDiaSimples]}>Nada vencendo por enquanto.</Text>
            </View>
          ) : (
            atencao.map((item: PlanoItem, i) => (
              <PlanoItemRow
                key={item.id}
                item={item}
                compacto
                semBorda={i === atencao.length - 1}
                onAbrir={abrirPlano}
              />
            ))
          )}

          {atencao.length > 0 && atencao.some(i => i.podeAgendar) ? (
            <Pressable
              style={s.cta}
              onPress={() => {
                const alvo = atencao.find(i => i.podeAgendar);
                if (alvo && petAtivo) abrirAgendamentoDoPlano(router, alvo, petAtivo.id);
              }}
              accessibilityRole="button"
              accessibilityLabel="Agendar o cuidado mais urgente"
            >
              <AppIcon name="calendar-outline" set="Ionicons" size={modoSimples ? 22 : 17} color={theme.colors.onPrimary} />
              <Text style={[s.ctaTexto, modoSimples && s.ctaTextoSimples]}>Agendar o mais urgente</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

function Contador({ s, valor, rotulo, cor, simples }: { s: ReturnType<typeof createStyles>; valor: number; rotulo: string; cor: string; simples?: boolean }) {
  return (
    <View style={s.contador}>
      <Text style={[s.contadorValor, simples && s.contadorValorSimples, { color: cor }]}>{valor}</Text>
      <Text style={[s.contadorRotulo, simples && s.contadorRotuloSimples]}>{rotulo}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    backgroundColor: theme.pages.home.eventCard.background, borderRadius: 22, marginBottom: 20, overflow: 'hidden',
    shadowColor: theme.colors.text, shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2,
  },
  head: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tituloWrap: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  tituloIcone: { width: 28, height: 28, borderRadius: 10, backgroundColor: theme.pages.home.nextActionsCard.iconBackground, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  tituloSimples: { fontSize: 23 },
  link: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },
  linkSimples: { fontSize: 20 },
  estado: { paddingHorizontal: 18, paddingBottom: 20, alignItems: 'center' },
  estadoTexto: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' },
  contadores: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.pages.home.petCard.background },
  contador: { flex: 1, alignItems: 'center' },
  divisor: { width: StyleSheet.hairlineWidth, backgroundColor: theme.pages.home.statsCard.border },
  contadorValor: { fontSize: 24, fontWeight: '800' },
  contadorValorSimples: { fontSize: 38 },
  contadorRotulo: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 2 },
  contadorRotuloSimples: { fontSize: 16 },
  tudoEmDia: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 18, paddingVertical: 14 },
  tudoEmDiaTexto: { color: theme.colors.success, fontSize: 13, fontWeight: '700' },
  tudoEmDiaSimples: { fontSize: 19 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, marginTop: 4, minHeight: 46, borderRadius: 999, backgroundColor: theme.colors.primary,
  },
  ctaTexto: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '800' },
  ctaTextoSimples: { fontSize: 20 },
});