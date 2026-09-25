import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../context/ThemeContext';
import type { AppTheme } from '../constants/theme';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function mesmoDia(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function gerarMatrizMes(mesRef: Date): Date[] {
    const ano = mesRef.getFullYear();
    const mes = mesRef.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const offset = primeiroDia.getDay(); // 0 = domingo
    const inicio = new Date(ano, mes, 1 - offset);
    const dias: Date[] = [];
    for (let i = 0; i < 42; i++) {
        dias.push(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i));
    }
    return dias;
}

interface CalendarioProps {
    mesRef: Date;
    selecionado: Date;
    marcadores: Record<string, string[]>; // dateKey -> cores dos pontinhos (até 3)
    onSelecionar: (d: Date) => void;
    onMudarMes: (offset: number) => void;
    simples?: boolean;
}

export function Calendario({ mesRef, selecionado, marcadores, onSelecionar, onMudarMes, simples }: CalendarioProps) {
    const dias = useMemo(() => gerarMatrizMes(mesRef), [mesRef]);
    const { theme } = useTheme();
    const s = useMemo(() => createStyles(theme), [theme]);
    const hoje = new Date();

    return (
        <View style={s.container}>
            <View style={[s.header, simples && sSimples.header]}>
                <Pressable style={s.navBtn} onPress={() => onMudarMes(-1)} hitSlop={8} accessibilityLabel="Mês anterior">
                    <AppIcon name="chevron-back-outline" set="Ionicons" size={simples ? 28 : 20} color={theme.colors.primary} />
                </Pressable>
                <Text style={[s.mesLabel, simples && sSimples.mesLabel]}>{MESES[mesRef.getMonth()]} {mesRef.getFullYear()}</Text>
                <Pressable style={s.navBtn} onPress={() => onMudarMes(1)} hitSlop={8} accessibilityLabel="Próximo mês">
                    <AppIcon name="chevron-forward-outline" set="Ionicons" size={simples ? 28 : 20} color={theme.colors.primary} />
                </Pressable>
            </View>

            <View style={s.semanaHead}>
                {DIAS_SEMANA.map((d, i) => (
                    <Text key={i} style={[s.semanaHeadText, simples && sSimples.semanaHeadText]}>{d}</Text>
                ))}
            </View>

            <View style={s.grid}>
                {dias.map((d, i) => {
                    const foraDoMes = d.getMonth() !== mesRef.getMonth();
                    const isHoje = mesmoDia(d, hoje);
                    const isSelecionado = mesmoDia(d, selecionado);
                    const cores = marcadores[dateKey(d)] ?? [];
                    return (
                        <Pressable key={i} style={[s.celula, simples && sSimples.celula]} onPress={() => onSelecionar(d)}>
                            <View style={[
                                s.diaCirculo,
                                simples && sSimples.diaCirculo,
                                isSelecionado && s.diaCirculoSelecionado,
                                isHoje && !isSelecionado && s.diaCirculoHoje,
                            ]}>
                                <Text style={[
                                    s.diaTexto,
                                    simples && sSimples.diaTexto,
                                    foraDoMes && s.diaTextoFora,
                                    isSelecionado && s.diaTextoSelecionado,
                                    isHoje && !isSelecionado && s.diaTextoHoje,
                                ]}>
                                    {d.getDate()}
                                </Text>
                            </View>
                            <View style={s.dotsRow}>
                                {cores.slice(0, 3).map((cor, idx) => (
                                    <View key={idx} style={[s.dot, { backgroundColor: cor }]} />
                                ))}
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { backgroundColor: theme.colors.surface, borderRadius: 24, overflow: 'hidden', marginBottom: 20, shadowColor: '#281d15', shadowOpacity: theme.mode === 'dark' ? 0 : 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: theme.colors.surface, paddingVertical: 15, paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
    },
    navBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceSubtle },
    mesLabel: { color: theme.colors.text, fontSize: 17, fontWeight: '800', textTransform: 'capitalize', letterSpacing: -0.2 },

    semanaHead: { flexDirection: 'row', paddingTop: 14, paddingHorizontal: 4, backgroundColor: theme.colors.surface },
    semanaHeadText: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '800', color: theme.colors.textSecondary },

    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4, paddingBottom: 15, backgroundColor: theme.colors.surface },
    celula: { width: '14.28%', alignItems: 'center', paddingVertical: 7 },
    diaCirculo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    diaCirculoSelecionado: { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: theme.mode === 'dark' ? 0 : 0.25, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
    diaCirculoHoje: { backgroundColor: theme.colors.surfaceSubtle, borderWidth: 1.5, borderColor: theme.colors.primary },
    diaTexto: { fontSize: 14, color: theme.colors.text, fontWeight: '700' },
    diaTextoFora: { color: theme.colors.textMuted },
    diaTextoSelecionado: { color: theme.colors.onPrimary },
    diaTextoHoje: { color: theme.colors.primary },

    dotsRow: { flexDirection: 'row', gap: 2, marginTop: 3, height: 5 },
    dot: { width: 4, height: 4, borderRadius: 2 },
  });
}

/**
 * Modo simples: ~35% maior que o padrão. O círculo do dia cresce menos que os
 * 35% dos demais elementos (36 → 42, não 48) porque a grade tem só 7 colunas
 * fixas — um círculo maior que isso encostaria nas células vizinhas.
 */
const sSimples = StyleSheet.create({
    header: { paddingVertical: 21 },
    mesLabel: { fontSize: 22 },
    semanaHeadText: { fontSize: 17 },
    celula: { paddingVertical: 8 },
    diaCirculo: { width: 42, height: 42, borderRadius: 21 },
    diaTexto: { fontSize: 18 },
});
