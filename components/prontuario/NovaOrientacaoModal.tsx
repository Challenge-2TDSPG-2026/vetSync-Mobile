import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { withAlpha, type AppTheme } from '../../constants/theme';
import { useCriarOrientacao } from '../../hooks/useProntuario';
import { mostrarToast } from '../ui/Toast';
import { CampoFormulario } from './CampoFormulario';
import { FolhaModal } from './FolhaModal';
import type { EventoOpcao } from './tiposVet';

interface NovaOrientacaoModalProps {
  visivel: boolean;
  idPet: string;
  nomePet: string;
  eventos: EventoOpcao[];
  onFechar: () => void;
}

export function NovaOrientacaoModal({ visivel, idPet, nomePet, eventos, onFechar }: NovaOrientacaoModalProps) {
  return (
    <FolhaModal visivel={visivel} titulo="Nova orientação" subtitulo={`Cuidados que o tutor de ${nomePet} deve seguir.`} onFechar={onFechar}>
      {/* Montar o formulário só enquanto aberto garante estado limpo a cada abertura. */}
      {visivel ? <FormularioOrientacao idPet={idPet} eventos={eventos} onFechar={onFechar} /> : null}
    </FolhaModal>
  );
}

function FormularioOrientacao({ idPet, eventos, onFechar }: Pick<NovaOrientacaoModalProps, 'idPet' | 'eventos' | 'onFechar'>) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const criar = useCriarOrientacao(idPet);

  const [eventoId, setEventoId] = useState<string | null>(eventos[0]?.id ?? null);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [erros, setErros] = useState<{ titulo?: string; texto?: string }>({});

  async function salvar() {
    const novosErros: typeof erros = {};
    if (!titulo.trim()) novosErros.titulo = 'Informe um título para a orientação.';
    if (!texto.trim()) novosErros.texto = 'Escreva a orientação para o tutor.';
    setErros(novosErros);
    if (!eventoId || Object.keys(novosErros).length > 0) return;

    try {
      await criar.mutateAsync({ idEvento: eventoId, titulo: titulo.trim(), texto: texto.trim() });
      mostrarToast('sucesso', 'Orientação registrada', 'O tutor já pode ver no prontuário.');
      onFechar();
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível salvar', erro instanceof Error ? erro.message : undefined);
    }
  }

  return (
    <>
      {eventos.length === 0 ? (
        <Text style={s.vazio}>Este paciente ainda não tem atendimentos para vincular uma orientação.</Text>
      ) : (
        <>
          <Text style={s.rotulo}>Atendimento</Text>
          <View style={s.chips}>
            {eventos.map(evento => {
              const ativo = evento.id === eventoId;
              return (
                <Pressable key={evento.id} style={[s.chip, ativo && s.chipAtivo]} onPress={() => setEventoId(evento.id)} accessibilityRole="button" accessibilityState={{ selected: ativo }}>
                  <Text style={[s.chipTexto, ativo && s.chipTextoAtivo]} numberOfLines={1}>{evento.rotulo}</Text>
                </Pressable>
              );
            })}
          </View>

          <CampoFormulario rotulo="Título" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Repouso por 7 dias" maxLength={120} erro={erros.titulo} />
          <CampoFormulario rotulo="Orientação" value={texto} onChangeText={setTexto} placeholder="Descreva os cuidados, retorno e sinais de alerta" maxLength={2000} multilinha erro={erros.texto} />

          <Pressable style={[s.botao, criar.isPending && s.desabilitado]} onPress={salvar} disabled={criar.isPending} accessibilityRole="button" accessibilityLabel="Salvar orientação">
            {criar.isPending ? <ActivityIndicator color={theme.colors.onPrimary} /> : null}
            <Text style={s.botaoTexto}>{criar.isPending ? 'Salvando...' : 'Salvar orientação'}</Text>
          </Pressable>
        </>
      )}
    </>
  );
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    vazio: { color: page.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center', paddingVertical: 24 },
    rotulo: { color: page.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { maxWidth: '100%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: page.border, backgroundColor: page.card },
    chipAtivo: { borderColor: theme.colors.primary, backgroundColor: withAlpha(theme.colors.primary, 0.14) },
    chipTexto: { color: page.textSecondary, fontSize: 13, fontWeight: '700' },
    chipTextoAtivo: { color: theme.colors.primary },
    botao: { minHeight: 50, marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: theme.colors.primary },
    botaoTexto: { color: theme.colors.onPrimary, fontSize: 15, fontWeight: '800' },
    desabilitado: { opacity: 0.6 },
  });
}
