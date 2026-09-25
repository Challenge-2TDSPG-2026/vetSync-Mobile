import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import type { Evento, Pet } from '../../types';
import { ESPECIES } from '../../constants';
import { formatarDataEvento, statusExibicao } from '../../utils/eventoStatus';
import { useAccessibility } from '../../context/AccessibilityContext';
import { ApiError } from '../../services/api/httpClient';
import { carteiraCompartilhadaService, type CarteiraCompartilhadaAtiva } from '../../services/carteiraCompartilhadaService';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../ui/Toast';
import { PetFoto } from '../pet-foto/PetFoto';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

type Props = { pet: Pet | null; eventos: Evento[]; onFechar: () => void };

function ehVacina(evento: Evento) { return evento.nomeTipoEvento.toLocaleLowerCase('pt-BR').includes('vacin'); }
function statusDoEvento(evento: Evento, theme: AppTheme) {
  switch (statusExibicao(evento)) {
    case 'CONCLUIDO': return { texto: 'Realizada', cor: theme.colors.success, fundo: theme.colors.successBackground };
    case 'ATRASADO': return { texto: 'Atrasada', cor: theme.colors.danger, fundo: theme.colors.dangerBackground };
    case 'CANCELADO': return { texto: 'Cancelada', cor: theme.colors.textSecondary, fundo: theme.colors.surfaceSubtle };
    default: return { texto: 'Agendada', cor: theme.colors.info, fundo: theme.colors.infoBackground };
  }
}

export function CarteiraModal({ pet, eventos, onFechar }: Props) {
  const { modoSimples } = useAccessibility();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [carteiraCompartilhada, setCarteiraCompartilhada] = useState<CarteiraCompartilhadaAtiva | null>(null);
  const [urlPublica, setUrlPublica] = useState<string | null>(null);
  const [carregandoCompartilhamento, setCarregandoCompartilhamento] = useState(false);
  const [gerandoQr, setGerandoQr] = useState(false);
  const [revogandoQr, setRevogandoQr] = useState(false);
  const vacinas = useMemo(() => eventos.filter(ehVacina), [eventos]);
  const especie = ESPECIES.find(item => item.valor === pet?.especie);
  const realizadas = vacinas.filter(item => statusExibicao(item) === 'CONCLUIDO').length;
  const proximas = vacinas.filter(item => statusExibicao(item) === 'AGENDADO').length;
  useEffect(() => {
    if (Platform.OS !== 'web' || !pet) return;
    const fecharComEscape = (event: KeyboardEvent) => event.key === 'Escape' && onFechar();
    window.addEventListener('keydown', fecharComEscape);
    return () => window.removeEventListener('keydown', fecharComEscape);
  }, [pet, onFechar]);

  useEffect(() => {
    let ativo = true;
    setCarteiraCompartilhada(null);
    setUrlPublica(null);
    const idPet: string = pet?.id ?? '';
    if (!idPet) return () => { ativo = false; };

    async function carregarCarteiraCompartilhada() {
      setCarregandoCompartilhamento(true);
      try {
        const carteira = await carteiraCompartilhadaService.buscarAtiva(idPet);
        if (ativo) setCarteiraCompartilhada(carteira);
      } catch (erro) {
        // 404 é o estado esperado quando o tutor ainda não criou um QR para o pet.
        if (ativo && (!(erro instanceof ApiError) || erro.status !== 404)) {
          mostrarToast('erro', 'Não foi possível consultar o QR Code', erro instanceof Error ? erro.message : undefined);
        }
      } finally {
        if (ativo) setCarregandoCompartilhamento(false);
      }
    }

    void carregarCarteiraCompartilhada();
    return () => { ativo = false; };
  }, [pet?.id]);

  async function gerarQrCode() {
    if (!pet) return;
    setGerandoQr(true);
    try {
      const criada = await carteiraCompartilhadaService.criarOuRenovar(pet.id);
      setCarteiraCompartilhada({
        id: criada.id,
        expiraEm: criada.expiraEm,
      });
      setUrlPublica(criada.urlPublica);
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível gerar o QR Code', erro instanceof Error ? erro.message : undefined);
    } finally {
      setGerandoQr(false);
    }
  }

  async function revogarQrCode() {
    if (!pet || !carteiraCompartilhada) return;
    setRevogandoQr(true);
    try {
      await carteiraCompartilhadaService.revogar(pet.id, carteiraCompartilhada.id);
      setCarteiraCompartilhada(null);
      setUrlPublica(null);
      mostrarToast('sucesso', 'QR Code revogado', 'A página pública deixou de estar disponível imediatamente.');
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível revogar o QR Code', erro instanceof Error ? erro.message : undefined);
    } finally {
      setRevogandoQr(false);
    }
  }

  function confirmarRevogacao() {
    confirmar(
      'Revogar QR Code?',
      'Quem escanear o QR atual não conseguirá mais abrir a carteira pública.',
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        { texto: 'Revogar', estilo: 'destructive', aoConfirmar: () => void revogarQrCode() },
      ],
    );
  }

  async function abrirPaginaPublica() {
    if (!urlPublica) return;
    try {
      await Linking.openURL(urlPublica);
    } catch {
      mostrarToast('erro', 'Não foi possível abrir a página pública');
    }
  }
  if (!pet) return null;
  return <Modal visible transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
    <View style={s.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} accessibilityLabel="Fechar carteira" />
      <View style={s.sheet} accessibilityViewIsModal>
        <View style={s.handle} />
        <View style={s.header}><View><Text style={s.kicker}>Carteira de vacinação</Text><Text style={[s.title, modoSimples && sSimples.title]} numberOfLines={1}>{pet.nome}</Text></View><Pressable style={[s.close, modoSimples && sSimples.close]} onPress={onFechar} hitSlop={10} accessibilityLabel="Fechar"><Ionicons name="close" size={modoSimples ? 35 : 26} color={theme.colors.text} /></Pressable></View>
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          <View style={[s.identity, modoSimples && sSimples.identity]}><PetFoto pet={pet} size={modoSimples ? 76 : 58} color={theme.colors.primary} backgroundColor={theme.colors.surfaceSubtle} accessibilityLabel={`Foto de ${pet.nome}`} /><View style={s.identityInfo}><Text style={[s.identityName, modoSimples && sSimples.identityName]}>{pet.nome}</Text><Text style={[s.identityMeta, modoSimples && sSimples.identityMeta]}>{especie?.label ?? 'Espécie não informada'}{pet.raca ? ` · ${pet.raca}` : ''}</Text></View></View>
          <View style={s.stats}><Resumo label="Registros" valor={vacinas.length} simples={modoSimples} /><Resumo label="Realizadas" valor={realizadas} simples={modoSimples} /><Resumo label="Agendadas" valor={proximas} simples={modoSimples} /></View>
          <CompartilhamentoQr
            carteira={carteiraCompartilhada}
            urlPublica={urlPublica}
            carregando={carregandoCompartilhamento}
            gerando={gerandoQr}
            revogando={revogandoQr}
            simples={modoSimples}
            onGerar={gerarQrCode}
            onAbrir={abrirPaginaPublica}
            onRevogar={confirmarRevogacao}
          />
          <View style={s.sectionHead}><View><Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Histórico de vacinas</Text>{!modoSimples && <Text style={s.sectionSub}>Registros enviados pela clínica</Text>}</View><Ionicons name="medical-outline" size={24} color={theme.colors.primary} /></View>
          {vacinas.length === 0 ? <View style={s.empty}><Ionicons name="document-text-outline" size={30} color={theme.colors.primary} /><Text style={s.emptyTitle}>Nenhuma vacina registrada</Text><Text style={s.emptyText}>Quando a clínica registrar uma vacinação, ela aparecerá aqui.</Text></View> : <View style={s.list}>{vacinas.map((evento, index) => <Registro key={evento.id} evento={evento} ultimo={index === vacinas.length - 1} simples={modoSimples} />)}</View>}
          {!modoSimples && <Text style={s.disclaimer}>Esta carteira exibe somente registros disponíveis na sua conta. Para incluir ou corrigir uma vacina, fale com a clínica responsável.</Text>}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

type CompartilhamentoQrProps = {
  carteira: CarteiraCompartilhadaAtiva | null;
  urlPublica: string | null;
  carregando: boolean;
  gerando: boolean;
  revogando: boolean;
  simples: boolean;
  onGerar: () => void;
  onAbrir: () => void;
  onRevogar: () => void;
};

function formatarExpiracao(valor: string) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'em breve';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data);
}

function CompartilhamentoQr({ carteira, urlPublica, carregando, gerando, revogando, simples, onGerar, onAbrir, onRevogar }: CompartilhamentoQrProps) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const ocupado = gerando || revogando;
  const textoBotao = carteira ? 'Gerar novo QR Code' : 'Gerar QR Code temporário';
  return <View style={[s.shareCard, simples && sSimples.shareCard]}>
    <View style={s.shareHeading}>
      <View style={[s.shareIcon, simples && sSimples.shareIcon]}><Ionicons name="qr-code-outline" size={simples ? 31 : 23} color={theme.colors.primary} /></View>
      <View style={s.shareHeadingText}><Text style={[s.shareTitle, simples && sSimples.shareTitle]}>Compartilhar carteira</Text><Text style={[s.shareDescription, simples && sSimples.shareDescription]}>Mostre o QR para abrir uma página temporária com a identificação do pet e as vacinas.</Text></View>
    </View>
    {carregando ? <View style={s.shareLoading}><ActivityIndicator color={theme.colors.primary} /><Text style={s.shareLoadingText}>Verificando QR Code...</Text></View> : <>
      {urlPublica ? <View style={s.qrContent}>
        <View style={s.qrBox} accessibilityLabel="QR Code da carteira pública"><QRCode value={urlPublica} size={simples ? 184 : 148} color={theme.colors.navigation} backgroundColor={theme.colors.surface} quietZone={8} ecl="M" /></View>
        <Text style={[s.qrReady, simples && sSimples.qrReady]}>QR Code pronto para compartilhar</Text>
      </View> : carteira ? <View style={s.shareNotice}><Ionicons name="information-circle-outline" size={19} color={theme.colors.info} /><Text style={s.shareNoticeText}>Há um QR ativo até {formatarExpiracao(carteira.expiraEm)}. Por segurança, ele só é mostrado no momento da geração.</Text></View> : <Text style={[s.shareEmpty, simples && sSimples.shareEmpty]}>Gere um QR temporário para que outra pessoa consulte a carteira de vacinação.</Text>}
      {carteira && <Text style={[s.shareExpiry, simples && sSimples.shareExpiry]}>Expira em {formatarExpiracao(carteira.expiraEm)}.</Text>}
      <Pressable style={[s.sharePrimary, simples && sSimples.sharePrimary, ocupado && s.buttonDisabled]} onPress={onGerar} disabled={ocupado} accessibilityLabel={textoBotao}>
        {gerando ? <ActivityIndicator color={theme.colors.onPrimary} /> : <><Ionicons name="qr-code" size={19} color={theme.colors.onPrimary} /><Text style={[s.sharePrimaryText, simples && sSimples.sharePrimaryText]}>{textoBotao}</Text></>}
      </Pressable>
      {urlPublica && <Pressable style={[s.shareSecondary, simples && sSimples.shareSecondary]} onPress={onAbrir} accessibilityLabel="Abrir página pública da carteira"><Ionicons name="open-outline" size={18} color={theme.colors.primary} /><Text style={[s.shareSecondaryText, simples && sSimples.shareSecondaryText]}>Abrir página pública</Text></Pressable>}
      {carteira && <Pressable style={[s.revokeButton, (ocupado || gerando) && s.buttonDisabled]} onPress={onRevogar} disabled={ocupado} accessibilityLabel="Revogar QR Code"><Text style={s.revokeText}>{revogando ? 'Revogando QR Code...' : 'Revogar QR Code'}</Text></Pressable>}
    </>}
  </View>;
}

function Resumo({ label, valor, simples }: { label: string; valor: number; simples?: boolean }) { const { theme } = useTheme(); const s = useMemo(() => createStyles(theme), [theme]); return <View style={[s.summary, simples && sSimples.summary]}><Text style={[s.summaryValue, simples && sSimples.summaryValue]}>{valor}</Text><Text style={[s.summaryLabel, simples && sSimples.summaryLabel]}>{label}</Text></View>; }
function Registro({ evento, ultimo, simples }: { evento: Evento; ultimo: boolean; simples?: boolean }) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const visual = statusDoEvento(evento, theme);
  return <View style={[s.record, simples && sSimples.record, ultimo && s.recordLast]}><View style={[s.recordIcon, simples && sSimples.recordIcon]}><Ionicons name="medical" size={simples ? 27 : 20} color={theme.colors.primary} /></View><View style={s.recordInfo}><Text style={[s.recordName, simples && sSimples.recordName]}>{evento.nomeTipoEvento}</Text><Text style={[s.recordMeta, simples && sSimples.recordMeta]}>{formatarDataEvento(evento.data)}{evento.nomeVeterinario && evento.nomeVeterinario !== '—' ? ` · ${evento.nomeVeterinario}` : ''}</Text>{evento.observacao ? <Text style={s.recordNote}>{evento.observacao}</Text> : null}</View><View style={[s.status, simples && sSimples.status, { backgroundColor: visual.fundo }]}><Text style={[s.statusText, simples && sSimples.statusText, { color: visual.cor }]}>{visual.texto}</Text></View></View>;
}

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }, sheet: { width: '100%', maxHeight: '90%', minHeight: '56%', backgroundColor: theme.colors.surfaceElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', borderWidth: theme.mode === 'dark' ? 1 : 0, borderColor: theme.colors.border }, handle: { width: 38, height: 4, borderRadius: 4, backgroundColor: theme.colors.borderStrong, alignSelf: 'center', marginTop: 10, marginBottom: 2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }, kicker: { color: theme.colors.primary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.9, fontWeight: '800' }, title: { color: theme.colors.text, fontSize: 25, fontWeight: '800', marginTop: 2, maxWidth: 260 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceSubtle },
    body: { padding: 20, paddingBottom: 36 }, identity: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: theme.colors.surfaceSubtle, borderRadius: 14 }, identityIcon: { height: 54, width: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, marginRight: 13 }, identityInfo: { flex: 1 }, identityName: { color: theme.colors.text, fontSize: 20, fontWeight: '800' }, identityMeta: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 3 },
    stats: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginTop: 16, marginBottom: 27 }, summary: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRightWidth: 1, borderRightColor: theme.colors.border }, summaryValue: { color: theme.colors.primary, fontSize: 24, fontWeight: '800' }, summaryLabel: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
    shareCard: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 16, marginBottom: 27 }, shareHeading: { flexDirection: 'row', alignItems: 'flex-start' }, shareIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceSubtle, marginRight: 11 }, shareHeadingText: { flex: 1 }, shareTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' }, shareDescription: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 }, shareLoading: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 22 }, shareLoadingText: { color: theme.colors.textSecondary, fontSize: 13 }, shareEmpty: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 14 }, shareNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: theme.colors.infoBackground, borderRadius: 10, padding: 11, marginTop: 14 }, shareNoticeText: { flex: 1, color: theme.colors.info, fontSize: 12, lineHeight: 17 }, qrContent: { alignItems: 'center', marginTop: 15 }, qrBox: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 8 }, qrReady: { color: theme.colors.success, fontWeight: '700', fontSize: 12, marginTop: 8 }, shareExpiry: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 12, textAlign: 'center' }, sharePrimary: { minHeight: 46, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16, backgroundColor: theme.colors.primary, marginTop: 14 }, sharePrimaryText: { color: theme.colors.onPrimary, fontWeight: '800', fontSize: 14 }, shareSecondary: { minHeight: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, borderWidth: 1, borderColor: theme.colors.primary, marginTop: 9 }, shareSecondaryText: { color: theme.colors.primary, fontWeight: '800', fontSize: 13 }, revokeButton: { minHeight: 36, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, revokeText: { color: theme.colors.danger, fontSize: 12, fontWeight: '700' }, buttonDisabled: { opacity: 0.58 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, sectionTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '800' }, sectionSub: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }, list: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 13, overflow: 'hidden' },
    record: { flexDirection: 'row', gap: 11, padding: 16, borderBottomWidth: 1, borderColor: theme.colors.border }, recordLast: { borderBottomWidth: 0 }, recordIcon: { height: 42, width: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceSubtle }, recordInfo: { flex: 1, minWidth: 0 }, recordName: { color: theme.colors.text, fontSize: 16, fontWeight: '800' }, recordMeta: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 3 }, recordNote: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 17 }, status: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }, statusText: { fontSize: 12, fontWeight: '800' },
    empty: { alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', borderRadius: 13, paddingHorizontal: 20, paddingVertical: 28 }, emptyTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800', marginTop: 10 }, emptyText: { color: theme.colors.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 4 }, disclaimer: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 19, textAlign: 'center' },
  });
}

/** Modo simples: ~35% maior que o padrão. */
const sSimples = StyleSheet.create({
  title: { fontSize: 34 },
  close: { width: 60, height: 60, borderRadius: 30 },
  identity: { padding: 24 },
  identityIcon: { height: 73, width: 73, borderRadius: 37 },
  identityName: { fontSize: 27 },
  identityMeta: { fontSize: 19 },
  summary: { paddingVertical: 22 },
  summaryValue: { fontSize: 32 },
  summaryLabel: { fontSize: 16 },
  shareCard: { padding: 22 },
  shareIcon: { width: 58, height: 58, borderRadius: 29, marginRight: 15 },
  shareTitle: { fontSize: 22 },
  shareDescription: { fontSize: 16, lineHeight: 22 },
  shareEmpty: { fontSize: 17, lineHeight: 23 },
  qrReady: { fontSize: 16 },
  shareExpiry: { fontSize: 14 },
  sharePrimary: { minHeight: 60 },
  sharePrimaryText: { fontSize: 18 },
  shareSecondary: { minHeight: 56 },
  shareSecondaryText: { fontSize: 17 },
  sectionTitle: { fontSize: 26 },
  record: { padding: 22 },
  recordIcon: { height: 57, width: 57, borderRadius: 29 },
  recordName: { fontSize: 22 },
  recordMeta: { fontSize: 18 },
  status: { paddingHorizontal: 14, paddingVertical: 8 },
  statusText: { fontSize: 16 },
});
