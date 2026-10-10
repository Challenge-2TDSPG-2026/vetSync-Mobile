import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../context/ThemeContext';
import { withAlpha, type AppTheme } from '../../constants/theme';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../ui/Toast';
import { FolhaModal } from './FolhaModal';
import {
  useCompartilhamentosProntuario,
  useCriarCompartilhamento,
  useRevogarCompartilhamento,
} from '../../hooks/useProntuario';
import { compartilhamentoNativoService } from '../../services/compartilhamentoNativoService';
import type { CompartilhamentoCriado, CompartilhamentoProntuario, SecaoProntuario } from '../../services/prontuarioService';
import {
  alternarSecao,
  DESCRICAO_SECAO,
  formatarDataHoraProntuario,
  inicioDoPeriodo,
  PERIODOS_COMPARTILHAMENTO,
  resumoSecoes,
  ROTULO_SECAO,
  situacaoCompartilhamento,
  TODAS_AS_SECOES,
  VALIDADE_PADRAO_DIAS,
  VALIDADES_DIAS,
  type PeriodoCompartilhamento,
  type SituacaoCompartilhamento,
} from '../../utils/prontuario';

interface CompartilharProntuarioModalProps {
  visivel: boolean;
  idPet: string;
  nomePet: string;
  onFechar: () => void;
}

function mensagemDeErro(erro: unknown): string | undefined {
  return erro instanceof Error ? erro.message : undefined;
}

export function CompartilharProntuarioModal({ visivel, idPet, nomePet, onFechar }: CompartilharProntuarioModalProps) {
  return (
    <FolhaModal
      visivel={visivel}
      titulo="Compartilhar prontuário"
      subtitulo={`Link temporário e somente leitura para outro atendimento de ${nomePet}.`}
      onFechar={onFechar}
    >
      {/* O conteúdo só existe enquanto aberto: o estado (e a URL do link, que só aparece uma vez) some ao fechar. */}
      {visivel ? <ConteudoCompartilhar idPet={idPet} nomePet={nomePet} /> : null}
    </FolhaModal>
  );
}

function ConteudoCompartilhar({ idPet, nomePet }: { idPet: string; nomePet: string }) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  const [secoes, setSecoes] = useState<SecaoProntuario[]>(TODAS_AS_SECOES);
  const [periodo, setPeriodo] = useState<PeriodoCompartilhamento>('TUDO');
  const [validade, setValidade] = useState<number>(VALIDADE_PADRAO_DIAS);
  const [destinatario, setDestinatario] = useState('');
  // A URL só existe na resposta da criação: fica apenas em memória e some ao fechar a folha.
  const [criado, setCriado] = useState<CompartilhamentoCriado | null>(null);

  const links = useCompartilhamentosProntuario(idPet, true);
  const criar = useCriarCompartilhamento(idPet);
  const revogar = useRevogarCompartilhamento(idPet);


  async function gerarLink() {
    if (secoes.length === 0) {
      mostrarToast('erro', 'Escolha o que compartilhar', 'Marque ao menos uma seção do prontuário.');
      return;
    }
    try {
      const resultado = await criar.mutateAsync({
        secoes,
        validadeDias: validade,
        destinatario: destinatario.trim() || undefined,
        periodoInicio: inicioDoPeriodo(periodo),
      });
      setCriado(resultado);
      setDestinatario('');
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível gerar o link', mensagemDeErro(erro));
    }
  }

  async function compartilharLink() {
    if (!criado) return;
    try {
      const resultado = await compartilhamentoNativoService.compartilharLink(criado.urlPublica, `Prontuário de ${nomePet}`);
      if (resultado === 'copiado') mostrarToast('sucesso', 'Link copiado');
    } catch {
      mostrarToast('erro', 'Não foi possível compartilhar o link');
    }
  }

  async function abrirPagina() {
    if (!criado) return;
    try {
      await Linking.openURL(criado.urlPublica);
    } catch {
      mostrarToast('erro', 'Não foi possível abrir a página');
    }
  }

  function confirmarRevogacao(link: CompartilhamentoProntuario) {
    confirmar(
      'Revogar link?',
      'Quem tiver este link não conseguirá mais abrir o prontuário. A ação vale imediatamente.',
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        { texto: 'Revogar', estilo: 'destructive', aoConfirmar: () => void revogarLink(link) },
      ]
    );
  }

  async function revogarLink(link: CompartilhamentoProntuario) {
    try {
      await revogar.mutateAsync(link.id);
      if (criado?.id === link.id) setCriado(null);
      mostrarToast('sucesso', 'Link revogado', 'A página deixou de estar disponível.');
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível revogar o link', mensagemDeErro(erro));
    }
  }

  const ativos = (links.data ?? []).filter(item => situacaoCompartilhamento(item) === 'ATIVO');
  const anteriores = (links.data ?? []).filter(item => situacaoCompartilhamento(item) !== 'ATIVO').slice(0, 3);

  return (
    <>
      {criado ? (
        <View style={s.cartaoLink}>
          <View style={s.qrCaixa} accessibilityLabel="QR Code do link do prontuário">
            <QRCode value={criado.urlPublica} size={168} color="#111111" backgroundColor="#FFFFFF" quietZone={8} ecl="M" />
          </View>
          <Text style={s.linkPronto}>Link pronto para compartilhar</Text>
          <Text style={s.linkAviso}>
            Expira em {formatarDataHoraProntuario(criado.expiraEm)}. {resumoSecoes(criado.secoes)}. Por segurança, o link só é mostrado agora.
          </Text>
          <Pressable style={s.botaoPrimario} onPress={compartilharLink} accessibilityRole="button" accessibilityLabel="Compartilhar link">
            <Ionicons name="share-social-outline" size={19} color={theme.colors.onPrimary} />
            <Text style={s.botaoPrimarioTexto}>Compartilhar link</Text>
          </Pressable>
          <Pressable style={s.botaoSecundario} onPress={abrirPagina} accessibilityRole="button" accessibilityLabel="Abrir página">
            <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
            <Text style={s.botaoSecundarioTexto}>Abrir página</Text>
          </Pressable>
          <Pressable style={s.botaoTexto} onPress={() => setCriado(null)} accessibilityRole="button">
            <Text style={s.botaoTextoLabel}>Gerar outro link</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={s.rotuloSecao}>O que compartilhar</Text>
          <View style={s.grupo}>
            {TODAS_AS_SECOES.map((secao, indice) => {
              const marcada = secoes.includes(secao);
              return (
                <Pressable
                  key={secao}
                  style={[s.linhaSecao, indice > 0 && s.linhaDivisor]}
                  onPress={() => setSecoes(atuais => alternarSecao(atuais, secao))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: marcada }}
                  accessibilityLabel={ROTULO_SECAO[secao]}
                >
                  <Ionicons name={marcada ? 'checkbox' : 'square-outline'} size={24} color={marcada ? theme.colors.primary : theme.colors.textMuted} />
                  <View style={s.linhaTexto}>
                    <Text style={s.linhaTitulo}>{ROTULO_SECAO[secao]}</Text>
                    <Text style={s.linhaDescricao}>{DESCRICAO_SECAO[secao]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.rotuloSecao}>Período</Text>
          <View style={s.chips}>
            {PERIODOS_COMPARTILHAMENTO.map(opcao => (
              <Chip key={opcao.chave} rotulo={opcao.rotulo} selecionado={periodo === opcao.chave} onPress={() => setPeriodo(opcao.chave)} estilos={s} />
            ))}
          </View>

          <Text style={s.rotuloSecao}>Validade do link</Text>
          <View style={s.chips}>
            {VALIDADES_DIAS.map(dias => (
              <Chip key={dias} rotulo={dias === 1 ? '1 dia' : `${dias} dias`} selecionado={validade === dias} onPress={() => setValidade(dias)} estilos={s} />
            ))}
          </View>

          <Text style={s.rotuloSecao}>Para quem? (opcional)</Text>
          <TextInput
            style={s.input}
            value={destinatario}
            onChangeText={setDestinatario}
            placeholder="Ex.: Clínica Pet Norte"
            placeholderTextColor={theme.colors.placeholder}
            maxLength={150}
            accessibilityLabel="Para quem é o link"
          />
          <Text style={s.dica}>Só você vê essa identificação. Ela ajuda a saber qual link foi para qual atendimento.</Text>

          <Pressable
            style={[s.botaoPrimario, criar.isPending && s.desabilitado]}
            onPress={gerarLink}
            disabled={criar.isPending}
            accessibilityRole="button"
            accessibilityLabel="Gerar link"
          >
            {criar.isPending ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Ionicons name="link-outline" size={19} color={theme.colors.onPrimary} />}
            <Text style={s.botaoPrimarioTexto}>{criar.isPending ? 'Gerando link...' : 'Gerar link'}</Text>
          </Pressable>
          <View style={s.aviso}>
            <Ionicons name="shield-checkmark-outline" size={19} color={theme.colors.info} />
            <Text style={s.avisoTexto}>O link não inclui custos nem seus dados pessoais. Cada acesso fica registrado e você pode revogar quando quiser.</Text>
          </View>
        </>
      )}

      <Text style={[s.rotuloSecao, s.rotuloLista]}>Links ativos</Text>
      {links.isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={s.carregando} />
      ) : links.isError ? (
        <Text style={s.dica}>Não foi possível carregar os links agora.</Text>
      ) : ativos.length === 0 ? (
        <Text style={s.dica}>Nenhum link ativo no momento.</Text>
      ) : (
        ativos.map(link => <LinkItem key={link.id} link={link} revogando={revogar.isPending && revogar.variables === link.id} onRevogar={() => confirmarRevogacao(link)} estilos={s} cores={theme} />)
      )}

      {anteriores.length > 0 && (
        <>
          <Text style={[s.rotuloSecao, s.rotuloLista]}>Anteriores</Text>
          {anteriores.map(link => <LinkItem key={link.id} link={link} revogando={false} estilos={s} cores={theme} />)}
        </>
      )}
    </>
  );
}

type Estilos = ReturnType<typeof createStyles>;

function Chip({ rotulo, selecionado, onPress, estilos }: { rotulo: string; selecionado: boolean; onPress: () => void; estilos: Estilos }) {
  return (
    <Pressable style={[estilos.chip, selecionado && estilos.chipAtivo]} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: selecionado }}>
      <Text style={[estilos.chipTexto, selecionado && estilos.chipTextoAtivo]}>{rotulo}</Text>
    </Pressable>
  );
}

function rotuloSituacao(situacao: SituacaoCompartilhamento): string {
  if (situacao === 'ATIVO') return 'Ativo';
  return situacao === 'REVOGADO' ? 'Revogado' : 'Expirado';
}

function LinkItem({ link, revogando, onRevogar, estilos, cores }: { link: CompartilhamentoProntuario; revogando: boolean; onRevogar?: () => void; estilos: Estilos; cores: AppTheme }) {
  const situacao = situacaoCompartilhamento(link);
  const corSituacao = situacao === 'ATIVO' ? cores.colors.success : cores.colors.textMuted;
  return (
    <View style={estilos.linkItem}>
      <View style={estilos.linkTopo}>
        <Text style={estilos.linkTitulo} numberOfLines={1}>{link.destinatario ?? resumoSecoes(link.secoes)}</Text>
        <View style={[estilos.selo, { backgroundColor: withAlpha(corSituacao, 0.14) }]}>
          <Text style={[estilos.seloTexto, { color: corSituacao }]}>{rotuloSituacao(situacao)}</Text>
        </View>
      </View>
      {link.destinatario ? <Text style={estilos.linkMeta}>{resumoSecoes(link.secoes)}</Text> : null}
      <Text style={estilos.linkMeta}>Criado em {formatarDataHoraProntuario(link.criadaEm)} · expira em {formatarDataHoraProntuario(link.expiraEm)}</Text>
      <Text style={estilos.linkMeta}>
        {link.totalAcessos === 0 ? 'Ainda não foi aberto' : `${link.totalAcessos} ${link.totalAcessos === 1 ? 'acesso' : 'acessos'} · último em ${formatarDataHoraProntuario(link.ultimoAcessoEm)}`}
      </Text>
      {onRevogar && situacao === 'ATIVO' ? (
        <Pressable style={[estilos.revogar, revogando && estilos.desabilitado]} onPress={onRevogar} disabled={revogando} accessibilityRole="button" accessibilityLabel="Revogar link">
          <Text style={estilos.revogarTexto}>{revogando ? 'Revogando...' : 'Revogar link'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    rotuloSecao: { color: page.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 },
    rotuloLista: { marginTop: 26 },
    grupo: { borderRadius: 14, borderWidth: 1, borderColor: page.border, backgroundColor: page.card, overflow: 'hidden' },
    linhaSecao: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    linhaDivisor: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: page.border },
    linhaTexto: { flex: 1 },
    linhaTitulo: { color: page.text, fontSize: 15, fontWeight: '700' },
    linhaDescricao: { color: page.textSecondary, fontSize: 12, marginTop: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: page.border, backgroundColor: page.card },
    chipAtivo: { borderColor: theme.colors.primary, backgroundColor: withAlpha(theme.colors.primary, 0.14) },
    chipTexto: { color: page.textSecondary, fontSize: 13, fontWeight: '700' },
    chipTextoAtivo: { color: theme.colors.primary },
    input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: page.border, backgroundColor: page.input, color: page.text, paddingHorizontal: 14, fontSize: 15 },
    dica: { color: page.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 6 },
    botaoPrimario: { minHeight: 50, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: theme.colors.primary },
    botaoPrimarioTexto: { color: theme.colors.onPrimary, fontSize: 15, fontWeight: '800' },
    botaoSecundario: { minHeight: 46, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.primary, alignSelf: 'stretch' },
    botaoSecundarioTexto: { color: theme.colors.primary, fontSize: 14, fontWeight: '800' },
    botaoTexto: { minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    botaoTextoLabel: { color: page.textSecondary, fontSize: 13, fontWeight: '700' },
    desabilitado: { opacity: 0.6 },
    aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, marginTop: 14, backgroundColor: theme.colors.infoBackground },
    avisoTexto: { flex: 1, color: page.text, fontSize: 12, lineHeight: 17 },
    cartaoLink: { alignItems: 'stretch', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: page.border, backgroundColor: page.card },
    qrCaixa: { alignSelf: 'center', padding: 8, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: page.border },
    linkPronto: { color: theme.colors.success, fontSize: 13, fontWeight: '800', textAlign: 'center', marginTop: 10 },
    linkAviso: { color: page.textSecondary, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 6 },
    carregando: { marginVertical: 14 },
    linkItem: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: page.border, backgroundColor: page.card, marginBottom: 10 },
    linkTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    linkTitulo: { flex: 1, color: page.text, fontSize: 14, fontWeight: '800' },
    selo: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
    seloTexto: { fontSize: 11, fontWeight: '800' },
    linkMeta: { color: page.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
    revogar: { minHeight: 36, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    revogarTexto: { color: theme.colors.danger, fontSize: 13, fontWeight: '800' },
  });
}
