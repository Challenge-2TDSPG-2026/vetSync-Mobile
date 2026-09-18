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
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ESPECIES, GRUPOS_ESPECIE } from '../constants';
import { petService } from '../services/petService';
import { useRacas } from '../hooks/useRacas';
import type { Pet } from '../types';

type Especie = Pet['especie'];
type Sexo = Pet['sexo'];

const C = {
  night: '#0a2218',
  forest: '#123d29',
  mint: '#22a06b',
  mintDeep: '#1a7a52',
  mintPale: '#bfe9d5',
  glow: '#f2c879',
  cream: '#faf8f3',
  fill: '#f1ece1',
  ink: '#1a1512',
  muted: '#7a6a5e',
  border: '#e8e2da',
  danger: '#dc3545',
};

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

  // Ícone do selo no topo: reflete a espécie escolhida, com a pata como ponto de partida.
  const iconeSelo = useMemo(() => {
    const item = ESPECIES.find(e => e.valor === especie);
    return item ? { nome: item.icon, conjunto: item.iconSet as 'Ionicons' | 'MaterialCommunityIcons' } : { nome: 'paw', conjunto: 'MaterialCommunityIcons' as const };
  }, [especie]);

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
        <ActivityIndicator size="large" color={C.mint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.night }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >

        <LinearGradient colors={[C.night, C.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.hero}>
          <MaterialCommunityIcons name="paw" size={190} color="rgba(255,255,255,0.05)" style={estilos.pawMarca} />

          <Pressable
            onPress={() => router.back()}
            style={estilos.btnFechar}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>

          <View style={estilos.seloWrap}>
            <View style={estilos.seloGlowOut} />
            <View style={estilos.seloGlowIn} />
            <View style={estilos.selo}>
              <Icone nome={iconeSelo.nome} conjunto={iconeSelo.conjunto} tamanho={28} cor="#fff" />
            </View>
          </View>

          <Text style={estilos.heroTitulo}>{editando ? 'Editar pet' : 'Vamos conhecer seu pet.'}</Text>
          <Text style={estilos.heroSub}>
            {editando
              ? 'Atualize as informações sempre que algo mudar.'
              : 'Só o essencial pra começar a cuidar da saúde dele por aqui.'}
          </Text>
        </LinearGradient>

        <View style={estilos.sheet}>

          {/* Nome */}
          <Text style={estilos.rotulo}>Nome</Text>
          <View style={[estilos.inputWrap, erros.nome && estilos.inputWrapErro]}>
            <Ionicons name="create-outline" size={18} color={C.muted} style={{ marginRight: 10 }} />
            <TextInput
              style={estilos.campo}
              value={nome}
              onChangeText={texto => {
                setNome(texto);
                if (erros.nome) setErros({ ...erros, nome: '' });
              }}
              placeholder="Como você chama seu pet"
              placeholderTextColor={C.muted}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
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
                    tamanho={24}
                    cor={selecionado ? '#FFFFFF' : C.mintDeep}
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
              size={16}
              color={C.mintDeep}
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
                          tamanho={24}
                          cor={selecionado ? '#FFFFFF' : C.mintDeep}
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
          <View style={[estilos.inputWrap, !especie && estilos.inputWrapDesativado]}>
            <Ionicons name="search-outline" size={18} color={C.muted} style={{ marginRight: 10 }} />
            <TextInput
              style={estilos.campo}
              value={raca}
              onChangeText={setRaca}
              onFocus={() => setRacaFocada(true)}
              onBlur={() => setTimeout(() => setRacaFocada(false), 150)}
              editable={!!especie}
              placeholder={especie ? 'Comece a digitar e escolha uma sugestão' : 'Escolha a espécie primeiro'}
              placeholderTextColor={C.muted}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
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
                  <Ionicons name="paw-outline" size={15} color={C.muted} />
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
                    color={selecionado ? '#FFFFFF' : C.mintDeep}
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
              <View style={[estilos.inputWrap, erros.dataNascimento && estilos.inputWrapErro]}>
                <Ionicons name="calendar-outline" size={17} color={C.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={estilos.campo}
                  value={dataNascimento}
                  onChangeText={texto => {
                    setDataNascimento(mascaraData(texto));
                    if (erros.dataNascimento) setErros({ ...erros, dataNascimento: '' });
                  }}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={C.muted}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>
            <View style={estilos.coluna}>
              <Text style={estilos.rotulo}>Peso (kg)</Text>
              <View style={[estilos.inputWrap, erros.peso && estilos.inputWrapErro]}>
                <MaterialCommunityIcons name="weight-kilogram" size={17} color={C.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={estilos.campo}
                  value={peso}
                  onChangeText={texto => {
                    setPeso(texto);
                    if (erros.peso) setErros({ ...erros, peso: '' });
                  }}
                  placeholder="Opcional"
                  placeholderTextColor={C.muted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          {!!erros.dataNascimento && <Text style={estilos.erro}>{erros.dataNascimento}</Text>}
          {!!erros.peso && <Text style={estilos.erro}>{erros.peso}</Text>}

          <Pressable
            style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado, salvar.isPending && { opacity: 0.7 }]}
            onPress={aoSalvar}
            disabled={salvar.isPending}
            accessibilityRole="button"
          >
            {salvar.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={estilos.textoSalvar}>{editando ? 'Salvar alterações' : 'Cadastrar pet'}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <Pressable style={estilos.botaoCancelar} onPress={() => router.back()}>
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  scroll: { flexGrow: 1 },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream },

  hero: {
    paddingTop: 56,
    paddingHorizontal: 28,
    paddingBottom: 46,
    overflow: 'hidden',
  },
  pawMarca: { position: 'absolute', top: -18, right: -26, transform: [{ rotate: '-16deg' }] },
  btnFechar: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  seloWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  seloGlowOut: { position: 'absolute', width: 86, height: 86, borderRadius: 43, backgroundColor: 'rgba(242,200,121,0.12)' },
  seloGlowIn: { position: 'absolute', width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(242,200,121,0.16)' },
  selo: {
    width: 48, height: 48, borderRadius: 15,
    backgroundColor: C.mint,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },

  heroTitulo: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, lineHeight: 31, marginBottom: 8, maxWidth: 300 },
  heroSub: { fontSize: 14, fontWeight: '500', color: C.mintPale, lineHeight: 20, maxWidth: 280 },

  sheet: {
    flexGrow: 1,
    backgroundColor: C.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingTop: 32,
    paddingHorizontal: 26,
    paddingBottom: 40,
  },

  rotulo: { fontSize: 13, fontWeight: '600', color: C.ink, marginBottom: 8 },
  rotuloEspacado: { marginTop: 22 },
  ajuda: { fontSize: 13, color: C.muted, marginTop: 6 },
  erro: { fontSize: 12, color: C.danger, marginTop: 6, fontWeight: '600' },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.fill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  inputWrapErro: { borderColor: C.danger },
  inputWrapDesativado: { opacity: 0.6 },
  campo: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.ink },

  botaoMaisEspecies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 4,
  },
  textoMaisEspecies: { fontSize: 13, fontWeight: '700', color: C.mintDeep },

  grupo: { marginTop: 18, marginBottom: 2 },
  tituloGrupo: { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 8 },
  gradeEspecies: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipEspecie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: C.fill,
  },
  chipEspecieAtivo: {
    backgroundColor: C.mint,
    shadowColor: C.mint, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  textoChip: { fontSize: 13, fontWeight: '600', color: C.ink },
  textoChipAtivo: { color: '#FFFFFF' },

  listaSugestoes: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  sugestao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  textoSugestao: { fontSize: 14, color: C.ink },

  linhaSexo: { flexDirection: 'row', gap: 8 },
  botaoSexo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: C.fill,
  },
  botaoSexoAtivo: { backgroundColor: C.mint },

  linhaDupla: { flexDirection: 'row', gap: 12, marginTop: 22 },
  coluna: { flex: 1 },

  botaoSalvar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 30,
    backgroundColor: C.mint,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.mint, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  botaoSalvarPressionado: { backgroundColor: C.mintDeep },
  textoSalvar: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  botaoCancelar: { marginTop: 14, paddingVertical: 10, alignItems: 'center' },
  textoCancelar: { color: C.muted, fontSize: 13, fontWeight: '600' },
});