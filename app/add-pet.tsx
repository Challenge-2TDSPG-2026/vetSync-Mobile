import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CORES, ESPECIES, GRUPOS_ESPECIE } from '../constants';
import { petService } from '../services/petService';
import { useRacas } from '../hooks/useRacas';
import type { Pet } from '../types';

type Especie = Pet['especie'];
type Sexo = Pet['sexo'];

// Espécies mostradas de cara; o resto fica escondido atrás da seta "Ver mais espécies".
const ESPECIES_PRINCIPAIS: Especie[] = ['cachorro', 'gato', 'coelho'];

if (Platform.OS === 'android') {
  (UIManager as unknown as { setLayoutAnimationEnabledExperimentalAndroid?: (v: boolean) => void })
    .setLayoutAnimationEnabledExperimentalAndroid?.(true);
}

/** Desenha o ícone certo dependendo do conjunto (Ionicons ou MaterialCommunityIcons). */
function Icone({
  nome,
  conjunto,
  tamanho,
  cor,
}: {
  nome: string;
  conjunto: 'Ionicons' | 'MaterialCommunityIcons';
  tamanho: number;
  cor: string;
}) {
  if (conjunto === 'Ionicons') {
    return <Ionicons name={nome as never} size={tamanho} color={cor} />;
  }
  return <MaterialCommunityIcons name={nome as never} size={tamanho} color={cor} />;
}

/** Aplica a máscara DD/MM/AAAA enquanto a pessoa digita. */
function mascaraData(texto: string): string {
  const numeros = texto.replace(/\D/g, '').slice(0, 8);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

/** 25/12/2020 -> 2020-12-25 (formato que a API espera). */
function dataParaIso(dataBr: string): string | null {
  const partes = dataBr.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) return null;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const valida =
    data.getFullYear() === Number(ano) &&
    data.getMonth() === Number(mes) - 1 &&
    data.getDate() === Number(dia);
  if (!valida) return null;
  if (data.getTime() > Date.now()) return null;
  return `${ano}-${mes}-${dia}`;
}

/** 2020-12-25 -> 25/12/2020 (pra mostrar no campo quando estiver editando). */
function isoParaData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return '';
  return `${dia}/${mes}/${ano}`;
}

export default function AddPetScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;

  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState<Especie | null>(null);
  const [sexo, setSexo] = useState<Sexo>('macho');
  const [raca, setRaca] = useState('');
  const [racaFocada, setRacaFocada] = useState(false);
  const [dataNascimento, setDataNascimento] = useState('');
  const [peso, setPeso] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mostrarMaisEspecies, setMostrarMaisEspecies] = useState(false);

  // Quando a tela abre em modo edição, carrega o pet e preenche os campos uma vez.
  const { isLoading: carregandoPet } = useQuery({
    queryKey: ['pet', id],
    queryFn: async () => {
      const pet = await petService.buscarPorId(String(id));
      setNome(pet.nome);
      setEspecie(pet.especie);
      setSexo(pet.sexo);
      setRaca(pet.raca);
      setDataNascimento(pet.dataNascimento ? isoParaData(pet.dataNascimento) : '');
      setPeso(pet.peso);
      if (!ESPECIES_PRINCIPAIS.includes(pet.especie)) setMostrarMaisEspecies(true);
      return pet;
    },
    enabled: editando,
    staleTime: 0,
  });

  // Sugestões de raça vindas da API, filtradas pela espécie e pelo que já foi digitado.
  const { data: racasSugeridas = [], isFetching: buscandoRacas, error: erroRacas } = useRacas(
    especie,
    raca,
  );

  // Imprime o erro de verdade no terminal do Expo, em vez de falhar quieto.
  useEffect(() => {
    if (erroRacas) {
      console.error('[useRacas] Falha ao buscar sugestões de raça:', erroRacas);
    }
  }, [erroRacas]);

  const sugestoesVisiveis = useMemo(() => {
    if (!especie || !racaFocada) return [];
    const digitado = raca.trim().toLowerCase();
    return racasSugeridas.filter(item => item.toLowerCase() !== digitado).slice(0, 6);
  }, [especie, racaFocada, raca, racasSugeridas]);

  // As 3 espécies mostradas sempre, na ordem cachorro / gato / coelho.
  const especiesPrincipais = useMemo(
    () => ESPECIES_PRINCIPAIS.map(valor => ESPECIES.find(e => e.valor === valor)!).filter(Boolean),
    [],
  );

  // O restante, agrupado, só aparece quando a pessoa expande.
  const especiesPorGrupo = useMemo(
    () =>
      GRUPOS_ESPECIE.map(grupo => ({
        grupo,
        itens: ESPECIES.filter(e => e.grupo === grupo && !ESPECIES_PRINCIPAIS.includes(e.valor)),
      })).filter(g => g.itens.length > 0),
    [],
  );

  function alternarMaisEspecies() {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setMostrarMaisEspecies(anterior => !anterior);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const petParaSalvar: Pet = {
        id: editando ? String(id) : '',
        nome: nome.trim(),
        especie: especie as Especie,
        sexo,
        raca: raca.trim(),
        dataNascimento: dataParaIso(dataNascimento) as string,
        peso: peso.trim(),
      };
      return editando ? petService.atualizarPet(petParaSalvar) : petService.criarPet(petParaSalvar);
    },
    onSuccess: async pet => {
      await queryClient.invalidateQueries({ queryKey: ['pets'] });
      if (editando) await queryClient.invalidateQueries({ queryKey: ['pet', id] });
      if (!editando) await petService.setPetAtivoId(pet.id);
      router.back();
    },
    onError: () => {
      Alert.alert(
        'Não deu pra salvar',
        'Confira sua conexão e tente de novo. Os dados que você digitou continuam aqui.',
      );
    },
  });

  function validar(): boolean {
    const novosErros: Record<string, string> = {};
    if (nome.trim().length < 2) novosErros.nome = 'Escreva o nome do pet.';
    if (!especie) novosErros.especie = 'Escolha a espécie.';
    if (!dataParaIso(dataNascimento)) {
      novosErros.dataNascimento = 'Use o formato DD/MM/AAAA e uma data que já passou.';
    }
    if (peso.trim()) {
      const numero = parseFloat(peso.replace(',', '.'));
      if (Number.isNaN(numero) || numero <= 0) novosErros.peso = 'Peso em kg, por exemplo 12,5.';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function aoSalvar() {
    if (!validar()) return;
    salvar.mutate();
  }

  if (editando && carregandoPet) {
    return (
      <View style={estilos.centralizado}>
        <ActivityIndicator size="large" color={CORES.secundaria} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: editando ? 'Editar pet' : 'Novo pet' }} />

      <ScrollView
        contentContainerStyle={estilos.conteudoCentralizado}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Nome */}
        <Text style={estilos.rotulo}>Nome</Text>
        <TextInput
          style={[estilos.campo, erros.nome && estilos.campoComErro]}
          value={nome}
          onChangeText={texto => {
            setNome(texto);
            if (erros.nome) setErros({ ...erros, nome: '' });
          }}
          placeholder="Como você chama seu pet"
          placeholderTextColor={CORES.textoSecundario}
          autoCapitalize="words"
          returnKeyType="next"
        />
        {!!erros.nome && <Text style={estilos.erro}>{erros.nome}</Text>}

        {/* Espécie: as 3 principais sempre visíveis, o resto some atrás da seta */}
        <Text style={[estilos.rotulo, estilos.rotuloEspacado]}>Espécie</Text>
        <View style={estilos.gradeEspecies}>
          {especiesPrincipais.map(item => {
            const selecionado = especie === item.valor;
            return (
              <Pressable
                key={item.valor}
                onPress={() => {
                  setEspecie(item.valor as Especie);
                  setRaca('');
                  if (erros.especie) setErros({ ...erros, especie: '' });
                }}
                style={[estilos.chipEspecie, selecionado && estilos.chipEspecieAtivo]}
                accessibilityRole="radio"
                accessibilityState={{ selected: selecionado }}
                accessibilityLabel={item.label}
              >
                <Icone
                  nome={item.icon}
                  conjunto={item.iconSet}
                  tamanho={22}
                  cor={selecionado ? '#FFFFFF' : CORES.primaria}
                />
                <Text style={[estilos.textoChip, selecionado && estilos.textoChipAtivo]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={alternarMaisEspecies}
          style={estilos.botaoMaisEspecies}
          accessibilityRole="button"
          accessibilityLabel={mostrarMaisEspecies ? 'Ver menos espécies' : 'Ver mais espécies'}
        >
          <Text style={estilos.textoMaisEspecies}>
            {mostrarMaisEspecies ? 'Ver menos espécies' : 'Ver mais espécies'}
          </Text>
          <Ionicons
            name={mostrarMaisEspecies ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={CORES.secundaria}
          />
        </Pressable>

        {mostrarMaisEspecies &&
          especiesPorGrupo.map(({ grupo, itens }) => (
            <View key={grupo} style={estilos.grupo}>
              <Text style={estilos.tituloGrupo}>{grupo}</Text>
              <View style={estilos.gradeEspecies}>
                {itens.map(item => {
                  const selecionado = especie === item.valor;
                  return (
                    <Pressable
                      key={item.valor}
                      onPress={() => {
                        setEspecie(item.valor as Especie);
                        setRaca('');
                        if (erros.especie) setErros({ ...erros, especie: '' });
                      }}
                      style={[estilos.chipEspecie, selecionado && estilos.chipEspecieAtivo]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selecionado }}
                      accessibilityLabel={item.label}
                    >
                      <Icone
                        nome={item.icon}
                        conjunto={item.iconSet}
                        tamanho={22}
                        cor={selecionado ? '#FFFFFF' : CORES.primaria}
                      />
                      <Text
                        style={[estilos.textoChip, selecionado && estilos.textoChipAtivo]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        {!!erros.especie && <Text style={estilos.erro}>{erros.especie}</Text>}

        {/* Raça com sugestões da API */}
        <Text style={[estilos.rotulo, estilos.rotuloEspacado]}>Raça</Text>
        <TextInput
          style={[estilos.campo, !especie && estilos.campoDesativado]}
          value={raca}
          onChangeText={setRaca}
          onFocus={() => setRacaFocada(true)}
          onBlur={() => setTimeout(() => setRacaFocada(false), 150)}
          editable={!!especie}
          placeholder={especie ? 'Comece a digitar e escolha uma sugestão' : 'Escolha a espécie primeiro'}
          placeholderTextColor={CORES.textoSecundario}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {racaFocada && buscandoRacas && (
          <Text style={estilos.ajuda}>Buscando raças…</Text>
        )}
        {racaFocada && !buscandoRacas && !!erroRacas && (
          <Text style={estilos.erro}>Não deu para buscar sugestões agora. Confira sua conexão.</Text>
        )}
        {sugestoesVisiveis.length > 0 && (
          <View style={estilos.listaSugestoes}>
            {sugestoesVisiveis.map(sugestao => (
              <Pressable
                key={sugestao}
                style={estilos.sugestao}
                onPress={() => {
                  setRaca(sugestao);
                  setRacaFocada(false);
                }}
              >
                <Ionicons name="search-outline" size={16} color={CORES.textoSecundario} />
                <Text style={estilos.textoSugestao}>{sugestao}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Sexo */}
        <Text style={[estilos.rotulo, estilos.rotuloEspacado]}>Sexo</Text>
        <View style={estilos.linhaSexo}>
          {([
            { valor: 'macho', label: 'Macho', icon: 'gender-male' },
            { valor: 'femea', label: 'Fêmea', icon: 'gender-female' },
          ] as const).map(opcao => {
            const selecionado = sexo === opcao.valor;
            return (
              <Pressable
                key={opcao.valor}
                onPress={() => setSexo(opcao.valor)}
                style={[estilos.botaoSexo, selecionado && estilos.botaoSexoAtivo]}
                accessibilityRole="radio"
                accessibilityState={{ selected: selecionado }}
              >
                <MaterialCommunityIcons
                  name={opcao.icon}
                  size={20}
                  color={selecionado ? '#FFFFFF' : CORES.primaria}
                />
                <Text style={[estilos.textoChip, selecionado && estilos.textoChipAtivo]}>
                  {opcao.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Nascimento e peso */}
        <View style={estilos.linhaDupla}>
          <View style={estilos.coluna}>
            <Text style={estilos.rotulo}>Nascimento</Text>
            <TextInput
              style={[estilos.campo, erros.dataNascimento && estilos.campoComErro]}
              value={dataNascimento}
              onChangeText={texto => {
                setDataNascimento(mascaraData(texto));
                if (erros.dataNascimento) setErros({ ...erros, dataNascimento: '' });
              }}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={CORES.textoSecundario}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          <View style={estilos.coluna}>
            <Text style={estilos.rotulo}>Peso (kg)</Text>
            <TextInput
              style={[estilos.campo, erros.peso && estilos.campoComErro]}
              value={peso}
              onChangeText={texto => {
                setPeso(texto);
                if (erros.peso) setErros({ ...erros, peso: '' });
              }}
              placeholder="Opcional"
              placeholderTextColor={CORES.textoSecundario}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        {!!erros.dataNascimento && <Text style={estilos.erro}>{erros.dataNascimento}</Text>}
        {!!erros.peso && <Text style={estilos.erro}>{erros.peso}</Text>}

        <Pressable
          style={[estilos.botaoSalvar, salvar.isPending && estilos.botaoSalvarOcupado]}
          onPress={aoSalvar}
          disabled={salvar.isPending}
          accessibilityRole="button"
        >
          {salvar.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={estilos.textoSalvar}>{editando ? 'Salvar alterações' : 'Cadastrar pet'}</Text>
          )}
        </Pressable>

        <Pressable style={estilos.botaoCancelar} onPress={() => router.back()}>
          <Text style={estilos.textoCancelar}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.fundo },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CORES.fundo },
  conteudo: { padding: 20, paddingBottom: 48 },
  conteudoCentralizado: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 32 },

  rotulo: { fontSize: 15, fontWeight: '600', color: CORES.texto, marginBottom: 8 },
  rotuloEspacado: { marginTop: 24 },
  ajuda: { fontSize: 13, color: CORES.textoSecundario, marginTop: 6 },
  erro: { fontSize: 13, color: CORES.alerta, marginTop: 6 },

  campo: {
    backgroundColor: CORES.fundoCard,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: CORES.texto,
  },
  campoComErro: { borderColor: CORES.alerta },
  campoDesativado: { backgroundColor: CORES.fundoSutil, color: CORES.textoSecundario },

  botaoMaisEspecies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
  },
  textoMaisEspecies: { fontSize: 14, fontWeight: '600', color: CORES.secundaria },

  grupo: { marginTop: 16, marginBottom: 4 },
  tituloGrupo: { fontSize: 13, fontWeight: '600', color: CORES.textoSecundario, marginBottom: 8 },
  gradeEspecies: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipEspecie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.fundoCard,
  },
  chipEspecieAtivo: { backgroundColor: CORES.secundaria, borderColor: CORES.secundaria },
  textoChip: { fontSize: 14, fontWeight: '500', color: CORES.texto },
  textoChipAtivo: { color: '#FFFFFF' },

  listaSugestoes: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    backgroundColor: CORES.fundoCard,
    overflow: 'hidden',
  },
  sugestao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CORES.borda,
  },
  textoSugestao: { fontSize: 15, color: CORES.texto },

  linhaSexo: { flexDirection: 'row', gap: 8 },
  botaoSexo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.fundoCard,
  },
  botaoSexoAtivo: { backgroundColor: CORES.secundaria, borderColor: CORES.secundaria },

  linhaDupla: { flexDirection: 'row', gap: 12, marginTop: 24 },
  coluna: { flex: 1 },

  botaoSalvar: {
    marginTop: 32,
    backgroundColor: CORES.primaria,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botaoSalvarOcupado: { opacity: 0.7 },
  textoSalvar: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  botaoCancelar: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  textoCancelar: { color: CORES.textoSecundario, fontSize: 15, fontWeight: '500' },
});