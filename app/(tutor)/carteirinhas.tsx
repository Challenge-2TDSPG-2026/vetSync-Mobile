import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePet } from '../../context/PetContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { WalletStack } from '../../components/carteira/WalletStack';
import { CarteiraModal } from '../../components/carteira/CarteiraModal';
import { AppIcon } from '../../components/AppIcon';
import { DicaTela } from '../../components/ui/DicaTela';
import { formatarDataEvento, parseDataEvento, statusExibicao } from '../../utils/eventoStatus';
import type { Pet } from '../../types';
import type { AppTheme } from '../../constants/theme';

export default function CarteirinhasScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
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
          <Text style={[s.descricao, modoSimples && sSimples.descricao]}>
            Acesse os registros de vacina e compartilhe a carteira do seu pet quando precisar.
          </Text>
        </View>

        {dicaVisivel && (
          <DicaTela
            titulo="Carteira de vacinação"
            texto="Toque num pet na pilha acima pra abrir a carteira dele. Lá dá pra gerar um QR Code e compartilhar o histórico de vacinas com a clínica."
            accentColor={theme.colors.primary}
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
          {carregandoEventos ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
        </View>
        <View style={[s.resumoCard, modoSimples && sSimples.resumoCard]}>
          <Resumo styles={s} valor={vacinas.length} rotulo="Vacinas" cor={theme.colors.primary} simples={modoSimples} />
          <View style={s.resumoDivisor} />
          <Resumo styles={s} valor={realizadas} rotulo="Realizadas" cor={theme.colors.success} simples={modoSimples} />
          <View style={s.resumoDivisor} />
          <Resumo styles={s} valor={proximas.length} rotulo="Próximas" cor={theme.colors.warning} simples={modoSimples} />
        </View>

        <View style={[s.proximaCard, modoSimples && sSimples.proximaCard]}>
          <View style={[s.proximaIcone, modoSimples && sSimples.proximaIcone]}>
            <AppIcon name="medical" set="Ionicons" size={modoSimples ? 27 : 20} color={theme.colors.primary} />
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
            <Ionicons name="arrow-forward" size={modoSimples ? 25 : 18} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View style={[s.compartilharCard, modoSimples && sSimples.compartilharCard]}>
          <View style={[s.compartilharIcone, modoSimples && sSimples.compartilharIcone]}>
            <Ionicons name="qr-code-outline" size={modoSimples ? 29 : 22} color={theme.colors.onNavigation} />
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
            <Ionicons name="arrow-forward" size={modoSimples ? 22 : 16} color={theme.colors.primary} />
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

function Resumo({ styles, valor, rotulo, cor, simples }: { styles: ReturnType<typeof createStyles>; valor: number; rotulo: string; cor: string; simples: boolean }) {
  return (
    <View style={styles.resumoItem}>
      <Text style={[styles.resumoValor, simples && sSimples.resumoValor, { color: cor }]}>{valor}</Text>
      <Text style={[styles.resumoRotulo, simples && sSimples.resumoRotulo]}>{rotulo}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingBottom: 36 },
  cabecalho: { marginBottom: 18 },
  titulo: { color: theme.colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  descricao: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 330 },

  secaoHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, marginBottom: 10 },
  secaoTitulo: { color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  resumoCard: {
    flexDirection: 'row', alignItems: 'stretch', backgroundColor: theme.colors.surface, borderRadius: 18,
    paddingVertical: 15, marginBottom: 14, shadowColor: theme.colors.text, shadowOpacity: 0.06,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  resumoItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
  resumoDivisor: { width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: 4 },
  resumoValor: { fontSize: 25, fontWeight: '800', lineHeight: 30, letterSpacing: -0.5 },
  resumoRotulo: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 },

  proximaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 18, padding: 15, gap: 11, marginBottom: 14 },
  proximaIcone: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.successBackground, justifyContent: 'center', alignItems: 'center' },
  proximaInfo: { flex: 1, minWidth: 0 },
  proximaRotulo: { color: theme.colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.75, marginBottom: 3 },
  proximaTitulo: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
  proximaMeta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 2 },
  btnAgenda: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center' },

  compartilharCard: { borderRadius: 20, backgroundColor: theme.colors.navigation, padding: 18, overflow: 'hidden' },
  compartilharIcone: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, marginBottom: 14 },
  compartilharInfo: { maxWidth: 310 },
  compartilharTitulo: { color: theme.colors.onNavigation, fontSize: 18, fontWeight: '800', letterSpacing: -0.25 },
  compartilharDescricao: { color: theme.colors.onNavigation, opacity: 0.82, fontSize: 13, lineHeight: 18, marginTop: 5 },
  btnCompartilhar: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: theme.colors.surfaceElevated, paddingHorizontal: 14, paddingVertical: 10, marginTop: 16 },
  btnCompartilharTexto: { color: theme.colors.primary, fontSize: 13, fontWeight: '800' },
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
