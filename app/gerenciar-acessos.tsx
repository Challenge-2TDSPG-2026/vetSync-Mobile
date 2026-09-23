import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePet } from '../context/PetContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { ApiError } from '../services/api/httpClient';
import { type PermissaoPet, type RelacaoPet } from '../services/petAcessoService';
import { useAcessosPet, useCriarConvitePet, useRevogarAcessoPet } from '../hooks/usePetAcessos';
import { confirmar } from '../utils/alert';
import { mostrarToast } from '../components/ui/Toast';

const C = {
  green: '#1a7a52', greenDark: '#0a2218', mint: '#d4f2e4', mintSoft: '#edf9f3',
  cream: '#fafaf8', white: '#fff', text: '#1a1512', muted: '#685f58', border: '#dfd9d1', danger: '#bd313f',
};

function mensagemErro(erro: unknown): string {
  return erro instanceof ApiError ? erro.message : 'Não foi possível concluir esta ação. Tente novamente.';
}

export default function GerenciarAcessosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pets, petAtivoId } = usePet();
  const { modoSimples } = useAccessibility();
  const [idPet, setIdPet] = useState<string | null>(petAtivoId);
  const [email, setEmail] = useState('');
  const [relacao, setRelacao] = useState<RelacaoPet>('CUIDADOR');
  const [permissao, setPermissao] = useState<PermissaoPet>('LEITURA');

  useEffect(() => {
    if (idPet && pets.some(pet => pet.id === idPet)) return;
    setIdPet(petAtivoId ?? pets[0]?.id ?? null);
  }, [idPet, petAtivoId, pets]);

  const petSelecionado = pets.find(pet => pet.id === idPet) ?? null;
  const acessos = useAcessosPet(idPet);
  const criarConvite = useCriarConvitePet(idPet);
  const revogarAcesso = useRevogarAcessoPet(idPet);

  async function convidar() {
    const emailNormalizado = email.trim().toLowerCase();
    if (!idPet || !emailNormalizado) {
      mostrarToast('erro', 'Informe o e-mail', 'Escolha um pet e informe o e-mail de quem será convidado.');
      return;
    }
    try {
      const convite = await criarConvite.mutateAsync({ email: emailNormalizado, relacao, permissao });
      setEmail('');
      mostrarToast('sucesso', 'Convite enviado', `O convite para ${convite.email} expira em ${formatarData(convite.expiraEm)}.`);
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível enviar o convite', mensagemErro(erro));
    }
  }

  function confirmarRevogacao(idAcesso: string, nome: string) {
    confirmar(
      `Revogar acesso de ${nome}?`,
      'Essa pessoa deixará de visualizar e gerenciar o que tinha permissão neste pet.',
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        {
          texto: 'Revogar', estilo: 'destructive', aoConfirmar: async () => {
            try {
              await revogarAcesso.mutateAsync(idAcesso);
              mostrarToast('sucesso', 'Acesso revogado');
            } catch (erro) {
              mostrarToast('erro', 'Não foi possível revogar o acesso', mensagemErro(erro));
            }
          },
        },
      ]
    );
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={[s.content, modoSimples && s.contentSimple, { paddingBottom: Math.max(insets.bottom, 18) + 30 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Pressable style={s.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar para o perfil">
            <Ionicons name="arrow-back" size={22} color={C.greenDark} />
          </Pressable>
          <View style={s.headerCopy}>
            <Text style={[s.title, modoSimples && s.titleSimple]}>Gerenciar acessos</Text>
            <Text style={[s.intro, modoSimples && s.introSimple]}>Convide alguém para acompanhar um pet seu e controle quem continua com acesso.</Text>
          </View>
        </View>

        <Text style={[s.sectionTitle, modoSimples && s.sectionTitleSimple]}>Escolha o pet</Text>
        {pets.length === 0 ? (
          <View style={s.emptyCard}><Text style={s.emptyText}>Você ainda não possui pets cadastrados.</Text></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.petOptions}>
            {pets.map(pet => (
              <Pressable key={pet.id} style={[s.petOption, pet.id === idPet && s.petOptionSelected]} onPress={() => setIdPet(pet.id)} accessibilityRole="button" accessibilityState={{ selected: pet.id === idPet }}>
                <Ionicons name="paw" size={20} color={pet.id === idPet ? C.white : C.green} />
                <Text style={[s.petOptionText, pet.id === idPet && s.petOptionTextSelected]} numberOfLines={1}>{pet.nome}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Text style={[s.sectionTitle, modoSimples && s.sectionTitleSimple]}>Enviar convite</Text>
        <View style={s.card}>
          <Text style={[s.cardIntro, modoSimples && s.cardIntroSimple]}>A pessoa receberá um e-mail para criar a própria conta e acessar {petSelecionado?.nome ?? 'o pet selecionado'}.</Text>
          <Text style={s.label}>E-mail de quem será convidado</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="nome@email.com" placeholderTextColor="#8a8179" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!criarConvite.isPending && Boolean(idPet)} style={[s.input, modoSimples && s.inputSimple]} accessibilityLabel="E-mail da pessoa convidada" />

          <Choice label="Relação" value={relacao} onChange={setRelacao} options={[['CUIDADOR', 'Cuidador'], ['CONJUGE', 'Cônjuge'], ['OUTRO', 'Outro']]} simples={modoSimples} />
          <Choice label="Permissão" value={permissao} onChange={setPermissao} options={[['LEITURA', 'Somente leitura'], ['EDICAO', 'Pode agendar e editar']]} simples={modoSimples} />

          <View style={s.permissionHint}>
            <Ionicons name="information-circle-outline" size={20} color={C.green} />
            <Text style={[s.permissionHintText, modoSimples && s.permissionHintTextSimple]}>Mesmo com edição, só você pode alterar o cadastro do pet ou gerenciar acessos.</Text>
          </View>

          <Pressable style={[s.primaryButton, (!idPet || criarConvite.isPending) && s.buttonDisabled]} onPress={convidar} disabled={!idPet || criarConvite.isPending} accessibilityRole="button">
            {criarConvite.isPending ? <ActivityIndicator color={C.white} /> : <Ionicons name="mail-outline" size={21} color={C.white} />}
            <Text style={[s.primaryButtonText, modoSimples && s.primaryButtonTextSimple]}>{criarConvite.isPending ? 'Enviando convite...' : 'Enviar convite'}</Text>
          </Pressable>
        </View>

        <Text style={[s.sectionTitle, modoSimples && s.sectionTitleSimple]}>Pessoas com acesso</Text>
        <View style={s.card}>
          {acessos.isLoading ? <ActivityIndicator color={C.green} style={s.loader} /> : null}
          {acessos.isError ? <Text style={s.errorText}>{mensagemErro(acessos.error)}</Text> : null}
          {!acessos.isLoading && !acessos.isError && (acessos.data?.length ?? 0) === 0 ? <Text style={[s.emptyText, modoSimples && s.cardIntroSimple]}>Ainda não há ninguém com acesso ativo a este pet.</Text> : null}
          {acessos.data?.map((acesso, index) => (
            <View key={acesso.idAcesso}>
              {index > 0 ? <View style={s.divider} /> : null}
              <View style={s.accessRow}>
                <View style={s.accessIcon}><Ionicons name="person-outline" size={22} color={C.green} /></View>
                <View style={s.accessCopy}>
                  <Text style={[s.accessName, modoSimples && s.accessNameSimple]}>{acesso.nomeTutor}</Text>
                  <Text style={[s.accessEmail, modoSimples && s.accessEmailSimple]}>{acesso.emailTutor}</Text>
                  <Text style={s.accessMeta}>{rotuloRelacao(acesso.relacao)} · {acesso.permissao === 'EDICAO' ? 'Pode editar' : 'Somente leitura'}</Text>
                </View>
                <Pressable style={s.revokeButton} onPress={() => confirmarRevogacao(acesso.idAcesso, acesso.nomeTutor)} disabled={revogarAcesso.isPending} accessibilityRole="button" accessibilityLabel={`Revogar acesso de ${acesso.nomeTutor}`}>
                  <Ionicons name="person-remove-outline" size={20} color={C.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={s.note}>
          <Ionicons name="time-outline" size={19} color={C.muted} />
          <Text style={s.noteText}>Convites pendentes expiram em até 72 horas. A API ainda não disponibiliza uma lista de convites pendentes para cancelamento nesta tela.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Choice<T extends string>({ label, value, onChange, options, simples }: { label: string; value: T; onChange: (value: T) => void; options: [T, string][]; simples: boolean }) {
  return (
    <View style={s.choiceGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={s.choiceOptions}>
        {options.map(([optionValue, optionLabel]) => (
          <Pressable key={optionValue} style={[s.choice, value === optionValue && s.choiceSelected, simples && s.choiceSimple]} onPress={() => onChange(optionValue)} accessibilityRole="radio" accessibilityState={{ selected: value === optionValue }}>
            <Text style={[s.choiceText, value === optionValue && s.choiceTextSelected, simples && s.choiceTextSimple]}>{optionLabel}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function rotuloRelacao(relacao: RelacaoPet): string {
  return { CUIDADOR: 'Cuidador', CONJUGE: 'Cônjuge', OUTRO: 'Outro' }[relacao];
}

function formatarData(data: string): string {
  const valor = new Date(data);
  return Number.isNaN(valor.getTime()) ? 'em breve' : valor.toLocaleDateString('pt-BR');
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white }, content: { paddingHorizontal: 22, paddingTop: 18 }, contentSimple: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 30 }, backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, minWidth: 0 },
  title: { color: C.text, fontSize: 31, fontWeight: '800', letterSpacing: -0.8, lineHeight: 38 }, titleSimple: { fontSize: 38, lineHeight: 44 }, intro: { color: C.muted, fontSize: 16, lineHeight: 23, marginTop: 6 }, introSimple: { fontSize: 20, lineHeight: 30 },
  sectionTitle: { color: C.text, fontSize: 21, fontWeight: '800', marginBottom: 11 }, sectionTitleSimple: { fontSize: 26 },
  petOptions: { gap: 9, paddingBottom: 29 }, petOption: { flexDirection: 'row', alignItems: 'center', gap: 7, maxWidth: 170, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.white }, petOptionSelected: { backgroundColor: C.green, borderColor: C.green }, petOptionText: { color: C.text, fontSize: 14, fontWeight: '800', flexShrink: 1 }, petOptionTextSelected: { color: C.white },
  card: { backgroundColor: C.cream, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 17, marginBottom: 29 }, cardIntro: { color: C.muted, fontSize: 14, lineHeight: 20, marginBottom: 21 }, cardIntroSimple: { fontSize: 17, lineHeight: 24 },
  label: { color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 8 }, input: { minHeight: 52, borderWidth: 1, borderColor: C.border, borderRadius: 15, backgroundColor: C.white, paddingHorizontal: 14, fontSize: 16, color: C.text }, inputSimple: { minHeight: 62, fontSize: 20 },
  choiceGroup: { marginTop: 19 }, choiceOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { borderWidth: 1, borderColor: C.border, backgroundColor: C.white, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10 }, choiceSelected: { borderColor: C.green, backgroundColor: C.mint }, choiceSimple: { paddingHorizontal: 14, paddingVertical: 13 }, choiceText: { color: C.muted, fontSize: 13, fontWeight: '700' }, choiceTextSelected: { color: C.greenDark }, choiceTextSimple: { fontSize: 16 },
  permissionHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.mintSoft, borderRadius: 14, padding: 12, marginTop: 19 }, permissionHintText: { flex: 1, color: C.muted, fontSize: 12, lineHeight: 18 }, permissionHintTextSimple: { fontSize: 16, lineHeight: 23 },
  primaryButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 55, borderRadius: 17, backgroundColor: C.green, marginTop: 20 }, buttonDisabled: { opacity: 0.58 }, primaryButtonText: { color: C.white, fontSize: 16, fontWeight: '800' }, primaryButtonTextSimple: { fontSize: 20 },
  loader: { marginVertical: 10 }, emptyCard: { backgroundColor: C.cream, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 17, marginBottom: 28 }, emptyText: { color: C.muted, fontSize: 14, lineHeight: 20 }, errorText: { color: C.danger, fontSize: 14, lineHeight: 20 },
  accessRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7 }, accessIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center' }, accessCopy: { flex: 1, minWidth: 0 }, accessName: { color: C.text, fontSize: 15, fontWeight: '800' }, accessNameSimple: { fontSize: 19 }, accessEmail: { color: C.muted, fontSize: 12, marginTop: 2 }, accessEmailSimple: { fontSize: 15 }, accessMeta: { color: C.green, fontSize: 12, fontWeight: '700', marginTop: 4 }, revokeButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f2' }, divider: { height: 1, backgroundColor: C.border, marginVertical: 11 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 14, backgroundColor: '#f3f0ec', padding: 13 }, noteText: { flex: 1, color: C.muted, fontSize: 12, lineHeight: 18 },
});
