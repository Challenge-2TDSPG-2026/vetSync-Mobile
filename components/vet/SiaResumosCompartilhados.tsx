import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { siaJornadaService, type ResumoConsulta } from '../../services/siaJornadaService';

export function SiaResumosCompartilhados({ eventos }: { eventos: { id: string; rotulo: string }[] }) {
  const { theme } = useTheme();
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [resumos, setResumos] = useState<ResumoConsulta[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function abrir(id: string) {
    setSelecionado(id); setCarregando(true); setErro(''); setResumos([]);
    try { setResumos(await siaJornadaService.listarVet(Number(id))); }
    catch { setErro('Não foi possível consultar os resumos compartilhados.'); }
    finally { setCarregando(false); }
  }

  return <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.textMuted, gap: 10, marginBottom: 18 }}>
    <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800' }}>Resumos pré-consulta compartilhados</Text>
    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Rascunhos organizados com ajuda da SIA e autorizados pelo tutor. Não são avaliação clínica.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{eventos.map(item => <Pressable key={item.id} onPress={() => void abrir(item.id)}
      style={{ borderWidth: 1, borderColor: selecionado === item.id ? theme.colors.primary : theme.colors.textMuted, padding: 10, borderRadius: 10 }}>
      <Text style={{ color: theme.colors.text }}>{item.rotulo}</Text></Pressable>)}</View>
    {carregando && <ActivityIndicator color={theme.colors.primary} />}
    {!!erro && <Text style={{ color: theme.colors.danger }}>{erro}</Text>}
    {selecionado && !carregando && !erro && resumos.length === 0 && <Text style={{ color: theme.colors.textSecondary }}>Nenhum resumo compartilhado para esta consulta.</Text>}
    {resumos.map(item => <View key={item.id} style={{ borderTopWidth: 1, borderColor: theme.colors.textMuted, paddingTop: 10, gap: 6 }}>
      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Rascunho da SIA #{item.id}</Text>
      <Text style={{ color: theme.colors.text }}>{item.resumo}</Text>
      {!!item.perguntas && <Text style={{ color: theme.colors.textSecondary }}>Perguntas do tutor: {item.perguntas}</Text>}
    </View>)}
  </View>;
}
