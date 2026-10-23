import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';
import { useEnviarProntuarioAnterior } from '../../hooks/useProntuario';
import { ApiError, type ArquivoUpload } from '../../services/api/httpClient';
import {
  dataBrParaIso,
  dataParaIso,
  mascaraDataBr,
  montarDadosConsultaAnterior,
  TIPOS_LAUDO_PERMITIDOS,
  validarArquivoLaudo,
} from '../../utils/prontuario';
import { mostrarToast } from '../ui/Toast';
import { CampoFormulario } from './CampoFormulario';
import { FolhaModal } from './FolhaModal';

interface EnviarProntuarioAnteriorModalProps {
  visivel: boolean;
  idPet: string;
  nomePet: string;
  onFechar: () => void;
}

type Erros = Partial<Record<'data' | 'motivo' | 'arquivo', string>>;

export function EnviarProntuarioAnteriorModal({ visivel, idPet, nomePet, onFechar }: EnviarProntuarioAnteriorModalProps) {
  return (
    <FolhaModal
      visivel={visivel}
      titulo="Enviar prontuário anterior"
      subtitulo={`Consulta antiga de ${nomePet}. O veterinário vê no prontuário clínico.`}
      onFechar={onFechar}
    >
      {/* Montar o formulário só enquanto aberto garante estado limpo a cada abertura. */}
      {visivel ? <Formulario idPet={idPet} onFechar={onFechar} /> : null}
    </FolhaModal>
  );
}

function Formulario({ idPet, onFechar }: Pick<EnviarProntuarioAnteriorModalProps, 'idPet' | 'onFechar'>) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const registrar = useEnviarProntuarioAnterior(idPet);

  const [data, setData] = useState('');
  const [motivo, setMotivo] = useState('');
  const [clinica, setClinica] = useState('');
  const [veterinario, setVeterinario] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [conduta, setConduta] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [arquivo, setArquivo] = useState<ArquivoUpload | null>(null);
  const [erros, setErros] = useState<Erros>({});

  async function escolherArquivo() {
    try {
      const escolha = await DocumentPicker.getDocumentAsync({
        type: [...TIPOS_LAUDO_PERMITIDOS],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (escolha.canceled || !escolha.assets?.[0]) return;
      const asset = escolha.assets[0];
      const problema = validarArquivoLaudo({ tipoMime: asset.mimeType, tamanho: asset.size });
      if (problema) {
        setErros(atuais => ({ ...atuais, arquivo: problema }));
        return;
      }
      setErros(atuais => ({ ...atuais, arquivo: undefined }));
      setArquivo({ uri: asset.uri, nome: asset.name, tipoMime: asset.mimeType as string });
    } catch {
      mostrarToast('erro', 'Não foi possível abrir o arquivo');
    }
  }

  async function salvar() {
    const novosErros: Erros = {};
    if (!motivo.trim()) novosErros.motivo = 'Informe o motivo da consulta.';

    const dataIso = dataBrParaIso(data);
    if (!dataIso) novosErros.data = 'Use o formato DD/MM/AAAA.';
    else if (dataIso > dataParaIso(new Date())) novosErros.data = 'A data da consulta não pode ser futura.';

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || !dataIso) return;

    try {
      const retorno = await registrar.mutateAsync({
        dados: montarDadosConsultaAnterior({ dataIso, motivo, clinica, veterinario, diagnostico, conduta, observacoes }),
        arquivo,
      });
      if (retorno.erroArquivo) {
        mostrarToast('aviso', 'Consulta salva, mas o arquivo não foi enviado', 'Tente enviar o arquivo novamente em outro registro.');
      } else {
        mostrarToast('sucesso', 'Prontuário anterior enviado', 'O veterinário já pode ver essas informações.');
      }
      onFechar();
    } catch (erro) {
      const semPermissao = erro instanceof ApiError && erro.status === 403;
      mostrarToast(
        'erro',
        'Não foi possível enviar o prontuário',
        semPermissao ? 'Sua conta não tem permissão para enviar registros ao prontuário deste pet.' : erro instanceof Error ? erro.message : undefined
      );
    }
  }

  return (
    <>
      <CampoFormulario rotulo="Data da consulta" value={data} onChangeText={texto => setData(mascaraDataBr(texto))} placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} erro={erros.data} />
      <CampoFormulario rotulo="Motivo da consulta" value={motivo} onChangeText={setMotivo} placeholder="Ex.: Vacinação, check-up, otite" maxLength={90} erro={erros.motivo} />
      <CampoFormulario rotulo="Clínica (opcional)" value={clinica} onChangeText={setClinica} placeholder="Onde foi o atendimento" maxLength={120} />
      <CampoFormulario rotulo="Veterinário (opcional)" value={veterinario} onChangeText={setVeterinario} placeholder="Nome de quem atendeu" maxLength={120} />
      <CampoFormulario rotulo="Diagnóstico (opcional)" value={diagnostico} onChangeText={setDiagnostico} placeholder="O que foi diagnosticado" maxLength={600} multilinha />
      <CampoFormulario rotulo="Conduta / tratamento (opcional)" value={conduta} onChangeText={setConduta} placeholder="Medicações, procedimentos, retornos" maxLength={900} multilinha />
      <CampoFormulario rotulo="Observações (opcional)" value={observacoes} onChangeText={setObservacoes} placeholder="Outras informações importantes" maxLength={1000} multilinha />

      <Text style={s.rotulo}>Arquivo do prontuário (opcional)</Text>
      {arquivo ? (
        <View style={s.arquivoCartao}>
          <Ionicons name="document-attach-outline" size={22} color={theme.colors.primary} />
          <Text style={s.arquivoNome} numberOfLines={1}>{arquivo.nome}</Text>
          <Pressable onPress={() => setArquivo(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remover arquivo">
            <Ionicons name="close-circle" size={22} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        <Pressable style={s.anexar} onPress={escolherArquivo} accessibilityRole="button" accessibilityLabel="Anexar arquivo do prontuário">
          <Ionicons name="attach-outline" size={20} color={theme.colors.primary} />
          <Text style={s.anexarTexto}>Anexar PDF ou foto do prontuário</Text>
        </Pressable>
      )}
      <Text style={erros.arquivo ? s.erro : s.dica}>{erros.arquivo ?? 'PDF, JPEG, PNG ou WebP, até 10 MB. Uma consulta por envio.'}</Text>

      <Pressable style={[s.botao, registrar.isPending && s.desabilitado]} onPress={salvar} disabled={registrar.isPending} accessibilityRole="button" accessibilityLabel="Enviar prontuário anterior">
        {registrar.isPending ? <ActivityIndicator color={theme.colors.onPrimary} /> : null}
        <Text style={s.botaoTexto}>{registrar.isPending ? 'Enviando...' : 'Enviar prontuário'}</Text>
      </Pressable>
    </>
  );
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    rotulo: { color: page.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 },
    anexar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.primary },
    anexarTexto: { color: theme.colors.primary, fontSize: 14, fontWeight: '800' },
    arquivoCartao: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: page.border, backgroundColor: page.card },
    arquivoNome: { flex: 1, color: page.text, fontSize: 14, fontWeight: '600' },
    dica: { color: page.textSecondary, fontSize: 12, marginTop: 6 },
    erro: { color: theme.colors.danger, fontSize: 12, marginTop: 6 },
    botao: { minHeight: 50, marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: theme.colors.primary },
    botaoTexto: { color: theme.colors.onPrimary, fontSize: 15, fontWeight: '800' },
    desabilitado: { opacity: 0.6 },
  });
}
