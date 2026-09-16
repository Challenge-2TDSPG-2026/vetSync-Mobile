import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from './AppIcon';

const C = {
    g800: '#0e3326', g600: '#1a7a52', g500: '#22a06b',
    text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
    cream: '#fafaf8',
};

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
    idoso?: boolean;
}

export function Calendario({ mesRef, selecionado, marcadores, onSelecionar, onMudarMes, idoso }: CalendarioProps) {
    const dias = useMemo(() => gerarMatrizMes(mesRef), [mesRef]);
    const hoje = new Date();

    return (
        <View style={s.container}>
            <View style={[s.header, idoso && sIdoso.header]}>
                <Pressable style={s.navBtn} onPress={() => onMudarMes(-1)} hitSlop={8}>
                    <AppIcon name="chevron-back-outline" set="Ionicons" size={idoso ? 24 : 18} color={C.white} />
                </Pressable>
                <Text style={[s.mesLabel, idoso && sIdoso.mesLabel]}>{MESES[mesRef.getMonth()]} {mesRef.getFullYear()}</Text>
                <Pressable style={s.navBtn} onPress={() => onMudarMes(1)} hitSlop={8}>
                    <AppIcon name="chevron-forward-outline" set="Ionicons" size={idoso ? 24 : 18} color={C.white} />
                </Pressable>
            </View>

            <View style={s.semanaHead}>
                {DIAS_SEMANA.map((d, i) => (
                    <Text key={i} style={[s.semanaHeadText, idoso && sIdoso.semanaHeadText]}>{d}</Text>
                ))}
            </View>

            <View style={s.grid}>
                {dias.map((d, i) => {
                    const foraDoMes = d.getMonth() !== mesRef.getMonth();
                    const isHoje = mesmoDia(d, hoje);
                    const isSelecionado = mesmoDia(d, selecionado);
                    const cores = marcadores[dateKey(d)] ?? [];
                    return (
                        <Pressable key={i} style={[s.celula, idoso && sIdoso.celula]} onPress={() => onSelecionar(d)}>
                            <View style={[
                                s.diaCirculo,
                                idoso && sIdoso.diaCirculo,
                                isSelecionado && s.diaCirculoSelecionado,
                                isHoje && !isSelecionado && s.diaCirculoHoje,
                            ]}>
                                <Text style={[
                                    s.diaTexto,
                                    idoso && sIdoso.diaTexto,
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

const s = StyleSheet.create({
    container: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 16 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: C.g800, paddingVertical: 12, paddingHorizontal: 16,
    },
    navBtn: { padding: 4 },
    mesLabel: { color: C.white, fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },

    semanaHead: { flexDirection: 'row', paddingTop: 10, paddingHorizontal: 4, backgroundColor: C.cream },
    semanaHeadText: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: C.muted },

    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4, paddingBottom: 10, backgroundColor: C.cream },
    celula: { width: '14.28%', alignItems: 'center', paddingVertical: 4 },
    diaCirculo: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    diaCirculoSelecionado: { backgroundColor: C.g600 },
    diaCirculoHoje: { borderWidth: 1.5, borderColor: C.g500 },
    diaTexto: { fontSize: 13, color: C.text, fontWeight: '600' },
    diaTextoFora: { color: C.border },
    diaTextoSelecionado: { color: C.white },
    diaTextoHoje: { color: C.g600 },

    dotsRow: { flexDirection: 'row', gap: 2, marginTop: 2, height: 5 },
    dot: { width: 4, height: 4, borderRadius: 2 },
});

/** Overrides do modo idoso: cabeçalho, dias e alvos de toque maiores. */
const sIdoso = StyleSheet.create({
    header: { paddingVertical: 16 },
    mesLabel: { fontSize: 17 },
    semanaHeadText: { fontSize: 13 },
    celula: { paddingVertical: 6 },
    diaCirculo: { width: 36, height: 36, borderRadius: 18 },
    diaTexto: { fontSize: 15 },
});