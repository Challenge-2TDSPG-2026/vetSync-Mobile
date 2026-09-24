import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePet } from '../../context/PetContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { WalletStack } from '../../components/carteira/WalletStack';
import { CarteiraModal } from '../../components/carteira/CarteiraModal';
import { AppIcon } from '../../components/AppIcon';
import { DicaTela } from '../../components/ui/DicaTela';
import { formatarDataEvento, parseDataEvento, statusExibicao } from '../../utils/eventoStatus';
import type { Pet } from '../../types';

const C = {
  cream: '#faf8f3',
  text: '#1a1512',
  muted: '#7a6a5e',
  border: '#e8e2da',
  white: '#fff',
  green900: '#0a2218',
  green700: '#155c3f',
  green600: '#1a7a52',
  green100: '#d4f2e4',
  green50: '#edfaf3',
  blue: '#2563eb',
  warn: '#e67e22',
};

export default function CarteirinhasScreen() {
  const router = useRouter();
  const { modoSimples } = useAccessibility();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('tutor-carteirinhas');
  const { pets, petAtivo, petAtivoId, selecionarPet, eventos, carregandoEventos } = usePet();
  const [petCarteira, setPetCarteira] = useState<Pet | null>(null);

  const vacinas = useMemo(
    () => eventos.filter(evento => evento.nomeTipoEvento.toLocaleLowerCase('pt-BR').includes('vacin')),
    [eventos],
  );
  const realizadas = vacinas.filter(evento => statusExibicao(evento) === 'CONCLUIDO').length;
  const proximas = vacinas
    .filter(evento => statusExibicao(evento) === 'AGENDADO')
    .sort((a, b) => parseDataEvento(a.data).getTime() - parseDataEvento(b.data).getTime());
  const proximaVacina = proximas[0];

  function abrirCarteira(pet: Pet) {
    selecionarPet(pet.id);
    setPetCarteira(pet);
  }

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.cabecalho}>
          <Text style={[s.titulo, modoSimples && sSimples.titulo]}>Carteiras de vacinação</Text>
          <Text style={[s.descricao, modoSimples && sSimples.descricao]}>
            Acesse os registros de vacina e compartilhe a carteira do seu pet quando precisar.
          </Text>
        </View>

        {dicaVisivel && (
          <DicaTela
            titulo="Carteira de vacinação"
            texto="Toque num pet na pilha acima pra abrir a carteira dele. Lá dá pra gerar um QR Code e compartilhar o histórico de vacinas com a clínica."
            accentColor={C.green600}
            onFechar={fecharDica}
            simples={modoSimples}
          />
        )}

        <WalletStack
          pets={pets}
          petAtivoId={petAtivoId}
          onSelecionar={abrirCarteira}
          onTrocarPetAtivo={selecionarPet}
        />

        <View style={s.secaoHead}>
          <Text style={[s.secaoTitulo, modoSimples && sSimples.secaoTitulo]}>
            Resumo{petAtivo ? ` de ${petAtivo.nome}` : ''}
          </Text>
          {carregandoEventos ? <ActivityIndicator size="small" color={C.green600} /> : null}
        </View>
        <View style={[s.resumoCard, modoSimples && sSimples.resumoCard]}>
          <Resumo valor={vacinas.length} rotulo="Vacinas" cor={C.green600} simples={modoSimples} />
          <View style={s.resumoDivisor} />
          <Resumo valor={realizadas} rotulo="Realizadas" cor={C.blue} simples={modoSimples} />
          <View style={s.resumoDivisor} />
          <Resumo valor={proximas.length} rotulo="Próximas" cor={C.warn} simples={modoSimples} />
        </View>

        <View style={[s.proximaCard, modoSimples && sSimples.proximaCard]}>
          <View style={[s.proximaIcone, modoSimples && sSimples.proximaIcone]}>
            <AppIcon name="medical" set="Ionicons" size={modoSimples ? 27 : 20} color={C.green700} />
          </View>
          <View style={s.proximaInfo}>
            <Text style={[s.proximaRotulo, modoSimples && sSimples.proximaRotulo]}>PRÓXIMA VACINA</Text>
            {proximaVacina ? (
              <>
                <Text style={[s.proximaTitulo, modoSimples && sSimples.proximaTitulo]} numberOfLines={1}>
                  {proximaVacina.nomeTipoEvento}
                </Text>
                <Text style={[s.proximaMeta, modoSimples && sSimples.proximaMeta]}>
                  {formatarDataEvento(proximaVacina.data)}
                  {proximaVacina.nomeVeterinario ? ` · ${proximaVacina.nomeVeterinario}` : ''}
                </Text>
              </>
            ) : (
              <>
                <Text style={[s.proximaTitulo, modoSimples && sSimples.proximaTitulo]}>Nenhuma vacina agendada</Text>
                <Text style={[s.proximaMeta, modoSimples && sSimples.proximaMeta]}>Acompanhe a agenda para manter a proteção em dia.</Text>
              </>
            )}
          </View>
          <Pressable
            onPress={() => router.push('/(tutor)/agenda')}
            style={[s.btnAgenda, modoSimples && sSimples.btnAgenda]}
            accessibilityRole="button"
            accessibilityLabel="Abrir agenda de saúde"
          >
            <Ionicons name="arrow-forward" size={modoSimples ? 25 : 18} color={C.green700} />
          </Pressable>
        </View>

        <View style={[s.compartilharCard, modoSimples && sSimples.compartilharCard]}>
          <View style={[s.compartilharIcone, modoSimples && sSimples.compartilharIcone]}>
            <Ionicons name="qr-code-outline" size={modoSimples ? 29 : 22} color={C.white} />
          </View>
          <View style={s.compartilharInfo}>
            <Text style={[s.compartilharTitulo, modoSimples && sSimples.compartilharTitulo]}>Leve a carteira com você</Text>
            <Text style={[s.compartilharDescricao, modoSimples && sSimples.compartilharDescricao]}>
              Abra a carteira para gerar um QR Code temporário e compartilhar os registros disponíveis.
            </Text>
          </View>
          <Pressable
            onPress={() => petAtivo && setPetCarteira(petAtivo)}
            style={[s.btnCompartilhar, modoSimples && sSimples.btnCompartilhar, !petAtivo && s.btnDesativado]}
            disabled={!petAtivo}
            accessibilityRole="button"
            accessibilityLabel="Abrir carteira para compartilhar"
          >
            <Text style={[s.btnCompartilharTexto, modoSimples && sSimples.btnCompartilharTexto]}>Abrir carteira</Text>
            <Ionicons name="arrow-forward" size={modoSimples ? 22 : 16} color={C.green700} />
          </Pressable>
        </View>
      </ScrollView>

      <CarteiraModal
        pet={petCarteira}
        eventos={petCarteira ? eventos.filter(evento => evento.petId === petCarteira.id) : []}
        onFechar={() => setPetCarteira(null)}
      />
    </>
  );
}

function Resumo({ valor, rotulo, cor, simples }: { valor: number; rotulo: string; cor: string; simples: boolean }) {
  return (
    <View style={s.resumoItem}>
      <Text style={[s.resumoValor, simples && sSimples.resumoValor, { color: cor }]}>{valor}</Text>
      <Text style={[s.resumoRotulo, simples && sSimples.resumoRotulo]}>{rotulo}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 18, paddingBottom: 36 },
  cabecalho: { marginBottom: 18 },
  titulo: { color: C.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  descricao: { color: C.muted, fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 330 },

  secaoHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, marginBottom: 10 },
  secaoTitulo: { color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  resumoCard: {
    flexDirection: 'row', alignItems: 'stretch', backgroundColor: C.white, borderRadius: 18,
    paddingVertical: 15, marginBottom: 14, shadowColor: '#281d15', shadowOpacity: 0.06,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  resumoItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
  resumoDivisor: { width: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 4 },
  resumoValor: { fontSize: 25, fontWeight: '800', lineHeight: 30, letterSpacing: -0.5 },
  resumoRotulo: { color: C.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },

  proximaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 18, padding: 15, gap: 11, marginBottom: 14 },
  proximaIcone: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.green100, justifyContent: 'center', alignItems: 'center' },
  proximaInfo: { flex: 1, minWidth: 0 },
  proximaRotulo: { color: C.green600, fontSize: 10, fontWeight: '800', letterSpacing: 0.75, marginBottom: 3 },
  proximaTitulo: { color: C.text, fontSize: 14, fontWeight: '800' },
  proximaMeta: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  btnAgenda: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.green50, justifyContent: 'center', alignItems: 'center' },

  compartilharCard: { borderRadius: 20, backgroundColor: C.green900, padding: 18, overflow: 'hidden' },
  compartilharIcone: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green600, marginBottom: 14 },
  compartilharInfo: { maxWidth: 310 },
  compartilharTitulo: { color: C.white, fontSize: 18, fontWeight: '800', letterSpacing: -0.25 },
  compartilharDescricao: { color: 'rgba(212,242,228,0.82)', fontSize: 13, lineHeight: 18, marginTop: 5 },
  btnCompartilhar: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 10, marginTop: 16 },
  btnCompartilharTexto: { color: C.green700, fontSize: 13, fontWeight: '800' },
  btnDesativado: { opacity: 0.5 },
});

const sSimples = StyleSheet.create({
  titulo: { fontSize: 34, lineHeight: 40 },
  descricao: { fontSize: 19, lineHeight: 26, marginTop: 9 },
  secaoTitulo: { fontSize: 25 },
  resumoCard: { paddingVertical: 22 },
  resumoValor: { fontSize: 34, lineHeight: 40 },
  resumoRotulo: { fontSize: 14 },
  proximaCard: { padding: 21, gap: 15 },
  proximaIcone: { width: 60, height: 60, borderRadius: 19 },
  proximaRotulo: { fontSize: 13, marginBottom: 4 },
  proximaTitulo: { fontSize: 20 },
  proximaMeta: { fontSize: 16, lineHeight: 22, marginTop: 4 },
  btnAgenda: { width: 52, height: 52, borderRadius: 26 },
  compartilharCard: { padding: 24 },
  compartilharIcone: { width: 60, height: 60, borderRadius: 19, marginBottom: 17 },
  compartilharTitulo: { fontSize: 25 },
  compartilharDescricao: { fontSize: 17, lineHeight: 24, marginTop: 7 },
  btnCompartilhar: { paddingHorizontal: 18, paddingVertical: 14, marginTop: 19 },
  btnCompartilharTexto: { fontSize: 17 },
});