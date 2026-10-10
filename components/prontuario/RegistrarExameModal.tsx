import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import { withAlpha, type AppTheme } from '../../constants/theme';
import { useRegistrarExame } from '../../hooks/useProntuario';
import type { ArquivoUpload } from '../../services/api/httpClient';
import { dataBrParaIso, dataParaIso, mascaraDataBr, TIPOS_LAUDO_PERMITIDOS, validarArquivoLaudo } from '../../utils/prontuario';
import { mostrarToast } from '../ui/Toast';
import { CampoFormulario } from './CampoFormulario';
import { FolhaModal } from './FolhaModal';
import type { EventoOpcao } from './tiposVet';

interface RegistrarExameModalProps {
  visivel: boolean;
  idPet: string;
  nomePet: string;
  eventos: EventoOpcao[];
  onFechar: () => void;
}

type Erros = Partial<Record<'nome' | 'resultadoEm' | 'coletadoEm' | 'arquivo', string>>;

function hojeBr(): string {
  const [ano, mes, dia] = dataParaIso(new Date()).split('-');
  return `${dia}/${mes}/${ano}`;
}

export function RegistrarExameModal({ visivel, idPet, nomePet, eventos, onFechar }: RegistrarExameModalProps) {
  return (
    <FolhaModal visivel={visivel} titulo="Registrar exame" subtitulo={`Resultado de exame de ${nomePet}.`} onFechar={onFechar}>
      {/* Montar o formulário só enquanto aberto garante estado limpo a cada abertura. */}
      {visivel ? <FormularioExame idPet={idPet} eventos={eventos} onFechar={onFechar} /> : null}
    </FolhaModal>
  );
}

function FormularioExame({ idPet, eventos, onFechar }: Pick<RegistrarExameModalProps, 'idPet' | 'eventos' | 'onFechar'>) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const registrar = useRegistrarExame(idPet);

  const [nome, setNome] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [resultadoEm, setResultadoEm] = useState(hojeBr);
  const [coletadoEm, setColetadoEm] = useState('');
  const [resultado, setResultado] = useState('');
  const [interpretacao, setInterpretacao] = useState('');
  const [eventoId, setEventoId] = useState<string | null>(null);
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
    if (!nome.trim()) novosErros.nome = 'Informe o nome do exame.';

    const resultadoIso = dataBrParaIso(resultadoEm);
    if (!resultadoIso) novosErros.resultadoEm = 'Use o formato DD/MM/AAAA.';
    else if (resultadoIso > dataParaIso(new Date())) novosErros.resultadoEm = 'A data do resultado não pode ser futura.';

    let coletaIso: string | null = null;
    if (coletadoEm.trim()) {
      coletaIso = dataBrParaIso(coletadoEm);
      if (!coletaIso) novosErros.coletadoEm = 'Use o formato DD/MM/AAAA.';
      else if (resultadoIso && coletaIso > resultadoIso) novosErros.coletadoEm = 'A coleta não pode ser depois do resultado.';
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || !resultadoIso) return;

    try {
      const retorno = await registrar.mutateAsync({
        dados: {
          idEvento: eventoId,
          nome: nome.trim(),
          laboratorio: laboratorio.trim() || undefined,
          coletadoEm: coletaIso ?? undefined,
          resultadoEm: resultadoIso,
          resultado: resultado.trim() || undefined,
          interpretacao: interpretacao.trim() || undefined,
        },
        arquivo,
      });
      if (retorno.erroArquivo) {
        mostrarToast('aviso', 'Exame salvo, mas o laudo não foi enviado', 'Você pode tentar anexar o arquivo novamente depois.');
      } else {
        mostrarToast('sucesso', 'Exame registrado');
      }
      onFechar();
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível salvar o exame', erro instanceof Error ? erro.message : undefined);
    }
  }

  return (
    <>
      <CampoFormulario rotulo="Exame" value={nome} onChangeText={setNome} placeholder="Ex.: Hemograma completo" maxLength={120} erro={erros.nome} />
      <CampoFormulario rotulo="Laboratório (opcional)" value={laboratorio} onChangeText={setLaboratorio} placeholder="Ex.: Lab Vet Centro" maxLength={120} />
      <CampoFormulario rotulo="Data do resultado" value={resultadoEm} onChangeText={texto => setResultadoEm(mascaraDataBr(texto))} placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} erro={erros.resultadoEm} />
      <CampoFormulario rotulo="Data da coleta (opcional)" value={coletadoEm} onChangeText={texto => setColetadoEm(mascaraDataBr(texto))} placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} erro={erros.coletadoEm} />
      <CampoFormulario rotulo="Resultado (opcional)" value={resultado} onChangeText={setResultado} placeholder="Valores e achados principais" maxLength={2000} multilinha />
      <CampoFormulario rotulo="Interpretação (opcional)" value={interpretacao} onChangeText={setInterpretacao} placeholder="Conclusão clínica" maxLength={1000} multilinha />

      {eventos.length > 0 && (
        <>
          <Text style={s.rotulo}>Atendimento relacionado (opcional)</Text>
          <View style={s.chips}>
            <Chip rotulo="Sem vínculo" ativo={eventoId === null} onPress={() => setEventoId(null)} estilos={s} />
            {eventos.map(evento => (
              <Chip key={evento.id} rotulo={evento.rotulo} ativo={evento.id === eventoId} onPress={() => setEventoId(evento.id)} estilos={s} />
            ))}
          </View>
        </>
      )}

      <Text style={s.rotulo}>Laudo (opcional)</Text>
      {arquivo ? (
        <View style={s.arquivoCartao}>
          <Ionicons name="document-attach-outline" size={22} color={theme.colors.primary} />
          <Text style={s.arquivoNome} numberOfLines={1}>{arquivo.nome}</Text>
          <Pressable onPress={() => setArquivo(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remover arquivo">
            <Ionicons name="close-circle" size={22} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        <Pressable style={s.anexar} onPress={escolherArquivo} accessibilityRole="button" accessibilityLabel="Anexar laudo">
          <Ionicons name="attach-outline" size={20} color={theme.colors.primary} />
          <Text style={s.anexarTexto}>Anexar PDF ou imagem</Text>
        </Pressable>
      )}
      <Text style={erros.arquivo ? s.erro : s.dica}>{erros.arquivo ?? 'PDF, JPEG, PNG ou WebP, até 10 MB.'}</Text>

      <Pressable style={[s.botao, registrar.isPending && s.desabilitado]} onPress={salvar} disabled={registrar.isPending} accessibilityRole="button" accessibilityLabel="Salvar exame">
        {registrar.isPending ? <ActivityIndicator color={theme.colors.onPrimary} /> : null}
        <Text style={s.botaoTexto}>{registrar.isPending ? 'Salvando...' : 'Salvar exame'}</Text>
      </Pressable>
    </>
  );
}

function Chip({ rotulo, ativo, onPress, estilos }: { rotulo: string; ativo: boolean; onPress: () => void; estilos: ReturnType<typeof createStyles> }) {
  return (
    <Pressable style={[estilos.chip, ativo && estilos.chipAtivo]} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: ativo }}>
      <Text style={[estilos.chipTexto, ativo && estilos.chipTextoAtivo]} numberOfLines={1}>{rotulo}</Text>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    rotulo: { color: page.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { maxWidth: '100%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: page.border, backgroundColor: page.card },
    chipAtivo: { borderColor: theme.colors.primary, backgroundColor: withAlpha(theme.colors.primary, 0.14) },
    chipTexto: { color: page.textSecondary, fontSize: 13, fontWeight: '700' },
    chipTextoAtivo: { color: theme.colors.primary },
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
