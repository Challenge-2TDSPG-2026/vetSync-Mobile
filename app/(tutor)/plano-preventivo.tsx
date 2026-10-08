import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '../../components/AppIcon';
import { PetSwitcher } from '../../components/PetSwitcher';
import { EmptyState } from '../../components/ui/EmptyState';
import { mostrarToast } from '../../components/ui/Toast';
import { PlanoItemRow, corDoStatus } from '../../components/plano/PlanoItemRow';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { usePet } from '../../context/PetContext';
import { useTheme } from '../../context/ThemeContext';
import { usePlanoPreventivo } from '../../hooks/usePlanoPreventivo';
import { usePreferenciasNotificacao } from '../../hooks/useNotificacoes';
import {
  cancelarLembretesDoPlano,
  definirLembretesPlanoAtivos,
  garantirPermissaoLembretes,
  lembretesPlanoAtivos,
  sincronizarLembretesDoPlano,
} from '../../services/planoLembreteService';
import { abrirAgendamentoDoPlano } from '../../utils/planoNavegacao';
import type { PlanoItem } from '../../utils/planoPreventivo';
import type { AppTheme } from '../../constants/theme';

export default function PlanoPreventivoScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { petAtivo } = usePet();
  const { autenticado } = useAuth();
  const { itens, resumo, carregando, erro, parcial, recarregar } = usePlanoPreventivo(petAtivo?.id ?? null, autenticado);
  const preferencias = usePreferenciasNotificacao(autenticado);

  const [lembretes, setLembretes] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  // Dias de antecedência vêm das preferências de notificação do tutor.
  const diasAntes = useMemo(() => {
    const p = preferencias.data;
    if (!p) return [7, 1];
    if (!p.vacinasVencendo) return [];
    return [p.lembreteSeteDias ? 7 : null, p.lembreteUmDia ? 1 : null].filter((d): d is number => d !== null);
  }, [preferencias.data]);

  useEffect(() => { void lembretesPlanoAtivos().then(setLembretes); }, []);

  // Mantém os lembretes locais alinhados com o plano sempre que ele ou as preferências mudam.
  useEffect(() => {
    if (!lembretes || !petAtivo || carregando || erro) return;
    void sincronizarLembretesDoPlano(petAtivo.id, petAtivo.nome, itens, diasAntes).catch(() => {});
  }, [lembretes, petAtivo, itens, diasAntes, carregando, erro]);

  const alternarLembretes = useCallback(async (ativar: boolean) => {
    if (!petAtivo) return;
    try {
      if (ativar) {
        const ok = await garantirPermissaoLembretes();
        if (!ok) {
          mostrarToast('erro', 'Permissão necessária', 'Ative as notificações do VetSync nas configurações do aparelho.');
          return;
        }
        await definirLembretesPlanoAtivos(true);
        setLembretes(true);
        const total = await sincronizarLembretesDoPlano(petAtivo.id, petAtivo.nome, itens, diasAntes);
        mostrarToast('sucesso', 'Lembretes ativados', total > 0 ? `${total} lembrete${total === 1 ? '' : 's'} agendado${total === 1 ? '' : 's'}.` : 'Você será avisado quando houver vencimentos.');
      } else {
        await definirLembretesPlanoAtivos(false);
        setLembretes(false);
        await cancelarLembretesDoPlano(petAtivo.id);
        mostrarToast('sucesso', 'Lembretes desativados');
      }
    } catch {
      mostrarToast('erro', 'Não foi possível alterar os lembretes', 'Tente novamente.');
    }
  }, [petAtivo, itens, diasAntes]);

  const aoAtualizar = useCallback(async () => {
    setAtualizando(true);
    try { recarregar(); } finally { setTimeout(() => setAtualizando(false), 600); }
  }, [recarregar]);

  const atencao = itens.filter(i => i.status === 'ATRASADO' || i.status === 'VENCENDO');
  const programados = itens.filter(i => i.status === 'FUTURO');
  const emDia = itens.filter(i => i.status === 'EM_DIA');

  const agendar = (item: PlanoItem) => { if (petAtivo) abrirAgendamentoDoPlano(router, item, petAtivo.id); };
  const abrir = (item: PlanoItem) => { if (item.eventoId) router.push({ pathname: '/evento/[id]', params: { id: item.eventoId } }); };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
    >
      <Pressable onPress={() => router.back()} style={s.voltar} accessibilityRole="button" accessibilityLabel="Voltar">
        <AppIcon name="chevron-back" set="Ionicons" size={22} color={theme.colors.primary} />
        <Text style={[s.voltarTexto, modoSimples && s.voltarTextoSimples]}>Voltar</Text>
      </Pressable>

      <Text style={[s.titulo, modoSimples && s.tituloSimples]}>Plano preventivo</Text>
      <Text style={[s.subtitulo, modoSimples && s.subtituloSimples]}>
        Vacinas e cuidados de {petAtivo?.nome ?? 'seu pet'}, com datas e recomendações definidas pela clínica e pelo veterinário.
      </Text>

      <PetSwitcher />

      {carregando ? (
        <View style={s.centro}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : erro ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Não foi possível carregar o plano"
          subtitle="Verifique sua conexão e tente novamente."
          accentColor={theme.colors.danger}
          actionLabel="Tentar novamente"
          onAction={recarregar}
        />
      ) : (
        <>
          {parcial ? (
            <View style={s.aviso} accessibilityRole="alert">
              <AppIcon name="information-circle-outline" set="Ionicons" size={18} color={theme.colors.warning} />
              <Text style={s.avisoTexto}>Parte das informações não carregou. Puxe a tela para atualizar.</Text>
            </View>
          ) : null}

          <View style={s.resumo}>
            <Resumo s={s} valor={resumo.atrasados} rotulo="Atrasados" cor={corDoStatus(theme, 'ATRASADO')} simples={modoSimples} />
            <View style={s.divisor} />
            <Resumo s={s} valor={resumo.vencendo} rotulo="Vencendo" cor={corDoStatus(theme, 'VENCENDO')} simples={modoSimples} />
            <View style={s.divisor} />
            <Resumo s={s} valor={resumo.emDia + resumo.futuros} rotulo="Em dia" cor={corDoStatus(theme, 'EM_DIA')} simples={modoSimples} />
          </View>

          <View style={s.lembreteCard}>
            <View style={s.lembreteInfo}>
              <Text style={[s.lembreteTitulo, modoSimples && s.lembreteTituloSimples]}>Lembretes no celular</Text>
              <Text style={[s.lembreteTexto, modoSimples && s.lembreteTextoSimples]}>
                {diasAntes.length > 0
                  ? `Aviso ${diasAntes.map(d => (d === 1 ? '1 dia' : `${d} dias`)).join(' e ')} antes do vencimento e quando algo atrasar.`
                  : 'Aviso quando algo atrasar. Ajuste a antecedência em Notificações.'}
              </Text>
            </View>
            <Switch
              value={lembretes}
              onValueChange={v => void alternarLembretes(v)}
              trackColor={{ true: theme.colors.primary, false: theme.colors.textMuted }}
              accessibilityLabel="Ativar lembretes do plano preventivo"
            />
          </View>

          {itens.length === 0 ? (
            <EmptyState
              icon="shield-outline"
              title="Nenhum cuidado registrado ainda"
              subtitle="Quando a clínica registrar vacinas e cuidados do seu pet, o plano aparece aqui."
              actionLabel="Agendar na clínica"
              onAction={() => router.push('/(tutor)/agendar-servico')}
            />
          ) : (
            <>
              <Secao s={s} titulo="Precisa de atenção" quantidade={atencao.length} simples={modoSimples}
                vazio="Nada atrasado ou vencendo. Bom trabalho!">
                {atencao.map((item, i) => (
                  <PlanoItemRow key={item.id} item={item} semBorda={i === atencao.length - 1} onAgendar={agendar} onAbrir={item.eventoId ? abrir : undefined} />
                ))}
              </Secao>
              {programados.length > 0 && (
                <Secao s={s} titulo="Programados" quantidade={programados.length} simples={modoSimples}>
                  {programados.map((item, i) => (
                    <PlanoItemRow key={item.id} item={item} semBorda={i === programados.length - 1} onAgendar={agendar} onAbrir={item.eventoId ? abrir : undefined} />
                  ))}
                </Secao>
              )}
              {emDia.length > 0 && (
                <Secao s={s} titulo="Em dia" quantidade={emDia.length} simples={modoSimples}>
                  {emDia.map((item, i) => (
                    <PlanoItemRow key={item.id} item={item} semBorda={i === emDia.length - 1} onAbrir={item.eventoId ? abrir : undefined} />
                  ))}
                </Secao>
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Resumo({ s, valor, rotulo, cor, simples }: { s: ReturnType<typeof createStyles>; valor: number; rotulo: string; cor: string; simples?: boolean }) {
  return (
    <View style={s.resumoItem}>
      <Text style={[s.resumoValor, simples && s.resumoValorSimples, { color: cor }]}>{valor}</Text>
      <Text style={[s.resumoRotulo, simples && s.resumoRotuloSimples]}>{rotulo}</Text>
    </View>
  );
}

function Secao({ s, titulo, quantidade, children, vazio, simples }: { s: ReturnType<typeof createStyles>; titulo: string; quantidade: number; children: React.ReactNode; vazio?: string; simples?: boolean }) {
  return (
    <View style={s.secao}>
      <Text style={[s.secaoTitulo, simples && s.secaoTituloSimples]} accessibilityRole="header">{titulo} · {quantidade}</Text>
      <View style={s.secaoCard}>
        {quantidade === 0 && vazio ? <Text style={s.secaoVazio}>{vazio}</Text> : children}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 48 },
  voltar: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, minHeight: 44 },
  voltarTexto: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },
  voltarTextoSimples: { fontSize: 20 },
  titulo: { fontSize: 27, fontWeight: '800', color: theme.colors.text, marginTop: 6 },
  tituloSimples: { fontSize: 34 },
  subtitulo: { fontSize: 14, lineHeight: 20, color: theme.colors.textSecondary, marginTop: 6, marginBottom: 14 },
  subtituloSimples: { fontSize: 18, lineHeight: 26 },
  centro: { paddingVertical: 60, alignItems: 'center' },
  aviso: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: theme.colors.warningBackground, marginBottom: 14 },
  avisoTexto: { flex: 1, fontSize: 12, color: theme.colors.text },
  resumo: { flexDirection: 'row', backgroundColor: theme.pages.home.statsCard.background, borderRadius: 22, paddingVertical: 16, marginBottom: 16 },
  resumoItem: { flex: 1, alignItems: 'center' },
  divisor: { width: StyleSheet.hairlineWidth, backgroundColor: theme.pages.home.statsCard.border },
  resumoValor: { fontSize: 28, fontWeight: '800' },
  resumoValorSimples: { fontSize: 42 },
  resumoRotulo: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 2 },
  resumoRotuloSimples: { fontSize: 16 },
  lembreteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: theme.pages.home.eventCard.background, marginBottom: 20 },
  lembreteInfo: { flex: 1 },
  lembreteTitulo: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  lembreteTituloSimples: { fontSize: 21 },
  lembreteTexto: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3, lineHeight: 17 },
  lembreteTextoSimples: { fontSize: 16, lineHeight: 22 },
  secao: { marginBottom: 20 },
  secaoTitulo: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 10 },
  secaoTituloSimples: { fontSize: 23 },
  secaoCard: { backgroundColor: theme.pages.home.eventCard.background, borderRadius: 22, overflow: 'hidden' },
  secaoVazio: { padding: 18, fontSize: 13, color: theme.colors.success, fontWeight: '700' },
});