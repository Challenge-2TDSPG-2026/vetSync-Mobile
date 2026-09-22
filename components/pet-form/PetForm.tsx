import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ESPECIES, GRUPOS_ESPECIE } from '../../constants';
import type { Pet } from '../../types';
import { RacaSelector } from './RacaSelector';

type Especie = Pet['especie'];
type Sexo = Pet['sexo'];

type Props = {
  petInicial?: Pet;
  editando: boolean;
  salvando: boolean;
  onSalvar: (pet: Pet) => void;
  onCancelar: () => void;
  onEspecieChange: (especie: Especie | null) => void;
};

const C = {
  mint: '#22a06b', mintDeep: '#1a7a52', fill: '#f1ece1', ink: '#1a1512',
  muted: '#7a6a5e', border: '#e8e2da', danger: '#dc3545',
};
const ESPECIES_PRINCIPAIS: Especie[] = ['cachorro', 'gato', 'coelho'];

if (Platform.OS === 'android') {
  (UIManager as unknown as { setLayoutAnimationEnabledExperimentalAndroid?: (v: boolean) => void })
    .setLayoutAnimationEnabledExperimentalAndroid?.(true);
}

function mascaraData(texto: string): string {
  const numeros = texto.replace(/\D/g, '').slice(0, 8);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

function dataParaIso(dataBr: string): string | null {
  const partes = dataBr.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) return null;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const valida = data.getFullYear() === Number(ano) && data.getMonth() === Number(mes) - 1 && data.getDate() === Number(dia);
  if (!valida || data.getTime() > Date.now()) return null;
  return `${ano}-${mes}-${dia}`;
}

function isoParaData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '';
}

export function PetForm({ petInicial, editando, salvando, onSalvar, onCancelar, onEspecieChange }: Props) {
  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState<Especie | null>(null);
  const [sexo, setSexo] = useState<Sexo>('macho');
  const [raca, setRaca] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [peso, setPeso] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mostrarMaisEspecies, setMostrarMaisEspecies] = useState(false);

  useEffect(() => {
    if (!petInicial) return;
    setNome(petInicial.nome);
    setEspecie(petInicial.especie);
    onEspecieChange(petInicial.especie);
    setSexo(petInicial.sexo);
    setRaca(petInicial.raca);
    setDataNascimento(isoParaData(petInicial.dataNascimento));
    setPeso(petInicial.peso);
    setMostrarMaisEspecies(!ESPECIES_PRINCIPAIS.includes(petInicial.especie));
  }, [petInicial, onEspecieChange]);

  const especiesPrincipais = useMemo(
    () => ESPECIES_PRINCIPAIS.map(valor => ESPECIES.find(e => e.valor === valor)!).filter(Boolean),
    [],
  );
  const especiesPorGrupo = useMemo(
    () => GRUPOS_ESPECIE.map(grupo => ({
      grupo,
      itens: ESPECIES.filter(item => item.grupo === grupo && !ESPECIES_PRINCIPAIS.includes(item.valor)),
    })).filter(grupo => grupo.itens.length > 0),
    [],
  );

  function selecionarEspecie(novaEspecie: Especie) {
    setEspecie(novaEspecie);
    setRaca('');
    onEspecieChange(novaEspecie);
    if (erros.especie) setErros(atual => ({ ...atual, especie: '' }));
  }

  function alternarMaisEspecies() {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setMostrarMaisEspecies(anterior => !anterior);
  }

  function validar(): string | null {
    const novosErros: Record<string, string> = {};
    if (nome.trim().length < 2) novosErros.nome = 'Escreva o nome do pet.';
    if (!especie) novosErros.especie = 'Escolha a espécie.';
    const nascimentoIso = dataParaIso(dataNascimento);
    if (!nascimentoIso) novosErros.dataNascimento = 'Use o formato DD/MM/AAAA e uma data que já passou.';
    if (peso.trim()) {
      const numero = parseFloat(peso.replace(',', '.'));
      if (Number.isNaN(numero) || numero <= 0) novosErros.peso = 'Peso em kg, por exemplo 12,5.';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length ? null : nascimentoIso;
  }

  function aoSalvar() {
    const nascimentoIso = validar();
    if (!nascimentoIso || !especie) return;
    onSalvar({
      id: petInicial?.id ?? '', nome: nome.trim(), especie, sexo, raca: raca.trim(),
      dataNascimento: nascimentoIso, peso: peso.trim(),
    });
  }

  const renderEspecie = (item: (typeof ESPECIES)[number]) => {
    const selecionado = especie === item.valor;
    return (
      <Pressable key={item.valor} onPress={() => selecionarEspecie(item.valor)}
        style={[estilos.chipEspecie, selecionado && estilos.chipEspecieAtivo]}
        accessibilityRole="radio" accessibilityState={{ selected: selecionado }} accessibilityLabel={item.label}>
        <MaterialCommunityIcons name={item.icon as never} size={24} color={selecionado ? '#fff' : C.mintDeep} />
        <Text style={[estilos.textoChip, selecionado && estilos.textoChipAtivo]} numberOfLines={1}>{item.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={estilos.sheet}>
      <Text style={estilos.rotulo}>Nome</Text>
      <View style={[estilos.inputWrap, erros.nome && estilos.inputWrapErro]}>
        <Ionicons name="create-outline" size={18} color={C.muted} style={estilos.icone} />
        <TextInput style={estilos.campo} value={nome} onChangeText={texto => { setNome(texto); if (erros.nome) setErros(atual => ({ ...atual, nome: '' })); }}
          placeholder="Como você chama seu pet" placeholderTextColor={C.muted} autoCapitalize="words" returnKeyType="next" />
      </View>
      {!!erros.nome && <Text style={estilos.erro}>{erros.nome}</Text>}

      <Text style={[estilos.rotulo, estilos.rotuloEspacado]}>Espécie</Text>
      <View style={estilos.gradeEspecies}>{especiesPrincipais.map(renderEspecie)}</View>
      <Pressable onPress={alternarMaisEspecies} style={estilos.botaoMaisEspecies} accessibilityRole="button"
        accessibilityLabel={mostrarMaisEspecies ? 'Ver menos espécies' : 'Ver mais espécies'}>
        <Text style={estilos.textoMaisEspecies}>{mostrarMaisEspecies ? 'Ver menos espécies' : 'Ver mais espécies'}</Text>
        <Ionicons name={mostrarMaisEspecies ? 'chevron-up' : 'chevron-down'} size={16} color={C.mintDeep} />
      </Pressable>
      {mostrarMaisEspecies && especiesPorGrupo.map(({ grupo, itens }) => (
        <View key={grupo} style={estilos.grupo}><Text style={estilos.tituloGrupo}>{grupo}</Text><View style={estilos.gradeEspecies}>{itens.map(renderEspecie)}</View></View>
      ))}
      {!!erros.especie && <Text style={estilos.erro}>{erros.especie}</Text>}

      <Text style={[estilos.rotulo, estilos.rotuloEspacado]}>Raça</Text>
      <RacaSelector especie={especie} raca={raca} onChange={setRaca} />

      <Text style={[estilos.rotulo, estilos.rotuloEspacado]}>Sexo</Text>
      <View style={estilos.linhaSexo}>{([
        { valor: 'macho', label: 'Macho', icon: 'gender-male' }, { valor: 'femea', label: 'Fêmea', icon: 'gender-female' },
      ] as const).map(opcao => {
        const selecionado = sexo === opcao.valor;
        return <Pressable key={opcao.valor} onPress={() => setSexo(opcao.valor)} style={[estilos.botaoSexo, selecionado && estilos.botaoSexoAtivo]}
          accessibilityRole="radio" accessibilityState={{ selected: selecionado }}>
          <MaterialCommunityIcons name={opcao.icon} size={20} color={selecionado ? '#fff' : C.mintDeep} />
          <Text style={[estilos.textoChip, selecionado && estilos.textoChipAtivo]}>{opcao.label}</Text>
        </Pressable>;
      })}</View>

      <View style={estilos.linhaDupla}>
        <View style={estilos.coluna}><Text style={estilos.rotulo}>Nascimento</Text><View style={[estilos.inputWrap, erros.dataNascimento && estilos.inputWrapErro]}>
          <Ionicons name="calendar-outline" size={17} color={C.muted} style={estilos.iconePequeno} />
          <TextInput style={estilos.campo} value={dataNascimento} onChangeText={texto => { setDataNascimento(mascaraData(texto)); if (erros.dataNascimento) setErros(atual => ({ ...atual, dataNascimento: '' })); }} placeholder="DD/MM/AAAA" placeholderTextColor={C.muted} keyboardType="number-pad" maxLength={10} />
        </View></View>
        <View style={estilos.coluna}><Text style={estilos.rotulo}>Peso (kg)</Text><View style={[estilos.inputWrap, erros.peso && estilos.inputWrapErro]}>
          <MaterialCommunityIcons name="weight-kilogram" size={17} color={C.muted} style={estilos.iconePequeno} />
          <TextInput style={estilos.campo} value={peso} onChangeText={texto => { setPeso(texto); if (erros.peso) setErros(atual => ({ ...atual, peso: '' })); }} placeholder="Opcional" placeholderTextColor={C.muted} keyboardType="decimal-pad" />
        </View></View>
      </View>
      {!!erros.dataNascimento && <Text style={estilos.erro}>{erros.dataNascimento}</Text>}
      {!!erros.peso && <Text style={estilos.erro}>{erros.peso}</Text>}

      <Pressable style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado, salvando && estilos.botaoSalvando]} onPress={aoSalvar} disabled={salvando} accessibilityRole="button">
        {salvando ? <ActivityIndicator color="#fff" /> : <><Text style={estilos.textoSalvar}>{editando ? 'Salvar alterações' : 'Cadastrar pet'}</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
      </Pressable>
      <Pressable style={estilos.botaoCancelar} onPress={onCancelar}><Text style={estilos.textoCancelar}>Cancelar</Text></Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  sheet: { flexGrow: 1, backgroundColor: '#faf8f3', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -24, paddingTop: 32, paddingHorizontal: 26, paddingBottom: 40 },
  rotulo: { fontSize: 13, fontWeight: '600', color: C.ink, marginBottom: 8 }, rotuloEspacado: { marginTop: 22 }, erro: { fontSize: 12, color: C.danger, marginTop: 6, fontWeight: '600' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.fill, borderWidth: 1.5, borderColor: 'transparent', borderRadius: 14, paddingHorizontal: 15 }, inputWrapErro: { borderColor: C.danger }, icone: { marginRight: 10 }, iconePequeno: { marginRight: 8 }, campo: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.ink },
  botaoMaisEspecies: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 12, paddingVertical: 4 }, textoMaisEspecies: { fontSize: 13, fontWeight: '700', color: C.mintDeep }, grupo: { marginTop: 18, marginBottom: 2 }, tituloGrupo: { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 8 }, gradeEspecies: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipEspecie: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 13, backgroundColor: C.fill }, chipEspecieAtivo: { backgroundColor: C.mint, shadowColor: C.mint, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 }, textoChip: { fontSize: 13, fontWeight: '600', color: C.ink }, textoChipAtivo: { color: '#fff' },
  linhaSexo: { flexDirection: 'row', gap: 8 }, botaoSexo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 13, backgroundColor: C.fill }, botaoSexoAtivo: { backgroundColor: C.mint }, linhaDupla: { flexDirection: 'row', gap: 12, marginTop: 22 }, coluna: { flex: 1 },
  botaoSalvar: { flexDirection: 'row', gap: 8, marginTop: 30, backgroundColor: C.mint, borderRadius: 999, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: C.mint, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 }, botaoSalvarPressionado: { backgroundColor: C.mintDeep }, botaoSalvando: { opacity: 0.7 }, textoSalvar: { color: '#fff', fontSize: 15, fontWeight: '700' }, botaoCancelar: { marginTop: 14, paddingVertical: 10, alignItems: 'center' }, textoCancelar: { color: C.muted, fontSize: 13, fontWeight: '600' },
});
