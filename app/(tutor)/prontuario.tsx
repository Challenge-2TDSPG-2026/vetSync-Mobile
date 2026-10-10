import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { usePet } from '../../context/PetContext';
import { useTheme } from '../../context/ThemeContext';
import { withAlpha, type AppTheme } from '../../constants/theme';
import { PetSwitcher } from '../../components/PetSwitcher';
import { PetFoto } from '../../components/pet-foto/PetFoto';
import { EmptyState } from '../../components/ui/EmptyState';
import { mostrarToast } from '../../components/ui/Toast';
import { CompartilharProntuarioModal } from '../../components/prontuario/CompartilharProntuarioModal';
import { ProntuarioLinhaDoTempo } from '../../components/prontuario/ProntuarioLinhaDoTempo';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { useProntuario } from '../../hooks/useProntuario';
import { ApiError } from '../../services/api/httpClient';
import { compartilhamentoNativoService } from '../../services/compartilhamentoNativoService';
import { prontuarioPdfService } from '../../services/prontuarioPdfService';
import type { ExameProntuario } from '../../services/prontuarioService';
import {
  contarPorTipo,
  FILTROS_LINHA_DO_TEMPO,
  montarItensProntuario,
  type FiltroLinhaDoTempo,
} from '../../utils/prontuario';

export default function ProntuarioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const { autenticado } = useAuth();
  const { petAtivo } = usePet();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { atualizando, aoAtualizar } = useRecarregarDados();

  const [filtro, setFiltro] = useState<FiltroLinhaDoTempo>('TUDO');
  const [compartilhando, setCompartilhando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [baixandoExameId, setBaixandoExameId] = useState<string | null>(null);

  const prontuario = useProntuario(petAtivo?.id ?? null, {}, autenticado && !!petAtivo);
  const itens = useMemo(
    () => (prontuario.data ? montarItensProntuario(prontuario.data, filtro) : []),
    [prontuario.data, filtro]
  );
  const contagem = useMemo(() => (prontuario.data ? contarPorTipo(prontuario.data) : null), [prontuario.data]);
  const semPermissao = prontuario.error instanceof ApiError && prontuario.error.status === 403;

  async function exportarPdf() {
    if (!petAtivo) return;
    setExportando(true);
    try {
      await prontuarioPdfService.exportarECompartilhar(petAtivo.id);
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível gerar o PDF', erro instanceof Error ? erro.message : 'Tente novamente em instantes.');
    } finally {
      setExportando(false);
    }
  }

  async function baixarLaudo(exame: ExameProntuario) {
    if (!petAtivo) return;
    setBaixandoExameId(exame.id);
    try {
      await compartilhamentoNativoService.baixarArquivoAutenticado(
        `/pets/${petAtivo.id}/exames/${exame.id}/arquivo`,
        exame.arquivoNome ?? `laudo-${exame.id}`
      );
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível baixar o laudo', erro instanceof Error ? erro.message : undefined);
    } finally {
      setBaixandoExameId(null);
    }
  }

  const cabecalho = (
    <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
      <Pressable style={s.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar">
        <Ionicons name="arrow-back" size={23} color={theme.components.header.icon} />
      </Pressable>
      <View style={s.headerCopy}>
        <Text style={[s.headerTitle, modoSimples && ss.headerTitle]}>Prontuário</Text>
        <Text style={[s.headerSubtitle, modoSimples && ss.headerSubtitle]}>Histórico clínico completo</Text>
      </View>
    </View>
  );

  if (!petAtivo) {
    return (
      <View style={s.container}>
        {cabecalho}
        <View style={s.center}>
          <Ionicons name="paw-outline" size={44} color={theme.colors.textMuted} />
          <Text style={s.estadoTitulo}>Nenhum pet selecionado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {cabecalho}
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 18) + 34 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      >
        <PetSwitcher />

        <View style={s.hero}>
          <PetFoto pet={petAtivo} size={modoSimples ? 80 : 64} color={theme.colors.primary} backgroundColor={theme.pages.shared.cardSecondary} accessibilityLabel={`Foto de ${petAtivo.nome}`} />
          <View style={s.heroCopy}>
            <Text style={[s.eyebrow, modoSimples && ss.eyebrow]}>PRONTUÁRIO CLÍNICO</Text>
            <Text style={[s.petNome, modoSimples && ss.petNome]} numberOfLines={1}>{petAtivo.nome}</Text>
            <Text style={[s.petMeta, modoSimples && ss.petMeta]}>
              {contagem ? `${contagem.TUDO} ${contagem.TUDO === 1 ? 'registro' : 'registros'}` : 'Carregando registros...'}
            </Text>
          </View>
        </View>

        <View style={s.acoes}>
          <Pressable
            style={[s.acaoPrimaria, modoSimples && ss.acao, !prontuario.data && s.desabilitado]}
            onPress={() => setCompartilhando(true)}
            disabled={!prontuario.data}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar prontuário"
          >
            <Ionicons name="share-social-outline" size={modoSimples ? 24 : 19} color={theme.colors.onPrimary} />
            <Text style={[s.acaoPrimariaTexto, modoSimples && ss.acaoTexto]}>Compartilhar</Text>
          </Pressable>
          <Pressable
            style={[s.acaoSecundaria, modoSimples && ss.acao, (!prontuario.data || exportando) && s.desabilitado]}
            onPress={exportarPdf}
            disabled={!prontuario.data || exportando}
            accessibilityRole="button"
            accessibilityLabel="Exportar prontuário em PDF"
          >
            {exportando ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Ionicons name="document-outline" size={modoSimples ? 24 : 19} color={theme.colors.primary} />}
            <Text style={[s.acaoSecundariaTexto, modoSimples && ss.acaoTexto]}>{exportando ? 'Gerando...' : 'Exportar PDF'}</Text>
          </Pressable>
        </View>

        {prontuario.isLoading ? (
          <View style={s.estadoCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={s.estadoTexto}>Carregando o prontuário...</Text>
          </View>
        ) : semPermissao ? (
          <View style={s.estadoCard}>
            <Ionicons name="lock-closed-outline" size={38} color={theme.colors.warning} />
            <Text style={s.estadoTitulo}>Sem acesso ao prontuário</Text>
            <Text style={s.estadoTexto}>Peça ao tutor responsável para liberar a permissão de prontuário para você.</Text>
          </View>
        ) : prontuario.isError || !prontuario.data ? (
          <View style={s.estadoCard}>
            <Ionicons name="cloud-offline-outline" size={38} color={theme.colors.danger} />
            <Text style={s.estadoTitulo}>Não foi possível carregar</Text>
            <Text style={s.estadoTexto}>Verifique sua conexão e tente novamente.</Text>
            <Pressable style={s.tentarNovamente} onPress={() => prontuario.refetch()} accessibilityRole="button">
              <Text style={s.tentarNovamenteTexto}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtros}>
              {FILTROS_LINHA_DO_TEMPO.map(opcao => {
                const ativo = filtro === opcao.chave;
                return (
                  <Pressable
                    key={opcao.chave}
                    style={[s.filtro, ativo && s.filtroAtivo]}
                    onPress={() => setFiltro(opcao.chave)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                  >
                    <Text style={[s.filtroTexto, ativo && s.filtroTextoAtivo]}>
                      {opcao.rotulo}{contagem ? ` (${contagem[opcao.chave]})` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {itens.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title={filtro === 'TUDO' ? 'Prontuário ainda vazio' : 'Nada por aqui ainda'}
                subtitle="Quando a clínica registrar atendimentos, orientações, receitas e exames, eles aparecerão aqui."
              />
            ) : (
              <ProntuarioLinhaDoTempo itens={itens} onBaixarLaudo={baixarLaudo} baixandoExameId={baixandoExameId} />
            )}

            <View style={s.aviso}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
              <Text style={[s.avisoTexto, modoSimples && ss.avisoTexto]}>
                O prontuário reúne só os atendimentos concluídos. Informações de custo e seus dados pessoais não entram no PDF nem no link compartilhado.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <CompartilharProntuarioModal
        visivel={compartilhando}
        idPet={petAtivo.id}
        nomePet={petAtivo.nome}
        onFechar={() => setCompartilhando(false)}
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: page.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, paddingBottom: 15, backgroundColor: theme.components.header.background, borderBottomWidth: 1, borderBottomColor: theme.components.header.border },
    backButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.components.header.accountIconBackground },
    headerCopy: { flex: 1 },
    headerTitle: { color: theme.components.header.title, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    headerSubtitle: { color: theme.components.header.accountSubtext, fontSize: 12, marginTop: 2, opacity: 0.85 },
    content: { paddingHorizontal: 20, paddingTop: 18 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, marginBottom: 14, padding: 16, borderRadius: 22, backgroundColor: page.card, borderWidth: 1, borderColor: page.border },
    heroCopy: { flex: 1, minWidth: 0 },
    eyebrow: { color: theme.colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
    petNome: { color: page.text, fontSize: 22, fontWeight: '800', marginTop: 3 },
    petMeta: { color: page.textSecondary, fontSize: 13, marginTop: 3 },
    acoes: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    acaoPrimaria: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: theme.colors.primary },
    acaoPrimariaTexto: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '800' },
    acaoSecundaria: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.primary },
    acaoSecundariaTexto: { color: theme.colors.primary, fontSize: 14, fontWeight: '800' },
    desabilitado: { opacity: 0.55 },
    estadoCard: { minHeight: 200, alignItems: 'center', justifyContent: 'center', padding: 26, borderRadius: 22, backgroundColor: page.card, borderWidth: 1, borderColor: page.border },
    estadoTitulo: { color: page.text, fontSize: 17, fontWeight: '800', textAlign: 'center', marginTop: 12 },
    estadoTexto: { color: page.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 },
    tentarNovamente: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: theme.colors.primary },
    tentarNovamenteTexto: { color: theme.colors.onPrimary, fontSize: 13, fontWeight: '700' },
    filtros: { gap: 8, paddingBottom: 14 },
    filtro: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: page.border, backgroundColor: page.card },
    filtroAtivo: { borderColor: theme.colors.primary, backgroundColor: withAlpha(theme.colors.primary, 0.14) },
    filtroTexto: { color: page.textSecondary, fontSize: 13, fontWeight: '700' },
    filtroTextoAtivo: { color: theme.colors.primary },
    aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 14, marginTop: 6, borderRadius: 16, backgroundColor: theme.colors.infoBackground },
    avisoTexto: { flex: 1, color: page.text, fontSize: 12, lineHeight: 18 },
  });
}

const ss = StyleSheet.create({
  headerTitle: { fontSize: 28 }, headerSubtitle: { fontSize: 15 }, eyebrow: { fontSize: 11 }, petNome: { fontSize: 27 }, petMeta: { fontSize: 16 },
  acao: { minHeight: 60 }, acaoTexto: { fontSize: 17 }, avisoTexto: { fontSize: 15, lineHeight: 22 },
});
