import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ESPECIES } from '../../constants';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { usePet } from '../../context/PetContext';
import { useTheme } from '../../context/ThemeContext';
import { PetSwitcher } from '../../components/PetSwitcher';
import { PetFoto } from '../../components/pet-foto/PetFoto';
import { mostrarToast } from '../../components/ui/Toast';
import { usePerfilSaudePet } from '../../hooks/useRelatorios';
import { resumoEmergenciaPdfService } from '../../services/resumoEmergenciaPdfService';
import type { AppTheme } from '../../constants/theme';

function valor(valor?: string | null): string {
  return valor?.trim() || 'Não informado';
}

function formatarData(valor?: string | null): string {
  const iso = valor?.slice(0, 10);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Não informado';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function ResumoEmergenciaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const { sessao, autenticado } = useAuth();
  const { petAtivo } = usePet();
  const s = useMemo(() => createStyles(theme), [theme]);
  const perfil = usePerfilSaudePet(petAtivo?.id ?? null, autenticado && !!petAtivo);
  const [compartilhando, setCompartilhando] = useState(false);

  async function compartilhar() {
    if (!petAtivo || !perfil.data) return;
    setCompartilhando(true);
    try {
      await resumoEmergenciaPdfService.compartilhar(petAtivo, perfil.data, sessao?.token);
    } catch {
      mostrarToast('erro', 'Não foi possível gerar a ficha', 'Tente novamente em instantes.');
    } finally {
      setCompartilhando(false);
    }
  }

  const cabecalho = (
    <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
      <Pressable style={s.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar">
        <Ionicons name="arrow-back" size={23} color={theme.components.header.icon} />
      </Pressable>
      <View style={s.headerCopy}>
        <Text style={[s.headerTitle, modoSimples && ss.headerTitle]}>Ficha de emergência</Text>
        <Text style={[s.headerSubtitle, modoSimples && ss.headerSubtitle]}>Informações rápidas do pet</Text>
      </View>
    </View>
  );

  if (!petAtivo) {
    return (
      <View style={s.container}>
        {cabecalho}
        <View style={s.center}>
          <Ionicons name="paw-outline" size={44} color={theme.colors.textMuted} />
          <Text style={s.errorTitle}>Nenhum pet selecionado</Text>
        </View>
      </View>
    );
  }

  const especie = ESPECIES.find(item => item.valor === petAtivo.especie)?.label ?? 'Não informado';

  return (
    <View style={s.container}>
      {cabecalho}
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 18) + 34 }]} showsVerticalScrollIndicator={false}>
        <PetSwitcher />

        <View style={s.hero}>
          <View style={[s.heroPhoto, modoSimples && ss.heroPhoto]}>
            <PetFoto pet={petAtivo} size={modoSimples ? 94 : 76} color={theme.colors.primary} backgroundColor={theme.pages.shared.cardSecondary} accessibilityLabel={`Foto de ${petAtivo.nome}`} />
          </View>
          <View style={s.heroCopy}>
            <Text style={[s.eyebrow, modoSimples && ss.eyebrow]}>RESUMO DE EMERGÊNCIA</Text>
            <Text style={[s.petName, modoSimples && ss.petName]}>{petAtivo.nome}</Text>
            <Text style={[s.petMeta, modoSimples && ss.petMeta]}>{especie}{petAtivo.raca?.trim() ? ` · ${petAtivo.raca}` : ''}</Text>
          </View>
          <Ionicons name="medical" size={28} color={theme.colors.danger} />
        </View>

        {perfil.isLoading ? (
          <View style={s.stateCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={s.stateText}>Carregando informações registradas...</Text>
          </View>
        ) : perfil.isError || !perfil.data ? (
          <View style={s.stateCard}>
            <Ionicons name="cloud-offline-outline" size={38} color={theme.colors.danger} />
            <Text style={s.errorTitle}>Não foi possível carregar a ficha</Text>
            <Text style={s.stateText}>Tente novamente para consultar os dados atuais do pet.</Text>
            <Pressable style={s.retryButton} onPress={() => perfil.refetch()} accessibilityRole="button">
              <Text style={s.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Secao styles={s} simples={modoSimples} titulo="Identificação" origem="Cadastro do pet" icone="paw-outline" corIcone={theme.colors.primary}>
              <Linha styles={s} simples={modoSimples} rotulo="Espécie" conteudo={especie} />
              <Linha styles={s} simples={modoSimples} rotulo="Raça" conteudo={valor(petAtivo.raca)} />
              <Linha styles={s} simples={modoSimples} rotulo="Sexo" conteudo={petAtivo.sexo === 'femea' ? 'Fêmea' : 'Macho'} />
              <Linha styles={s} simples={modoSimples} rotulo="Nascimento" conteudo={formatarData(petAtivo.dataNascimento)} />
              <Linha styles={s} simples={modoSimples} rotulo="Peso" conteudo={petAtivo.peso?.trim() ? `${petAtivo.peso} kg` : 'Não informado'} ultimo />
            </Secao>

            <Secao styles={s} simples={modoSimples} titulo="Contatos" origem="Cadastro do tutor e perfil de saúde do pet" icone="call-outline" corIcone={theme.colors.primary}>
              <Linha styles={s} simples={modoSimples} rotulo="Tutor responsável" conteudo={valor(petAtivo.tutor?.nome)} />
              <Linha styles={s} simples={modoSimples} rotulo="Telefone do tutor" conteudo={valor(petAtivo.tutor?.telefone)} />
              <Linha styles={s} simples={modoSimples} rotulo="E-mail do tutor" conteudo={valor(petAtivo.tutor?.email)} />
              <Linha styles={s} simples={modoSimples} rotulo="Contato de emergência" conteudo={valor(perfil.data.contatoEmergencia)} ultimo destaque />
            </Secao>

            <Secao styles={s} simples={modoSimples} titulo="Informações de saúde" origem="Perfil de saúde do pet" icone="medical-outline" corIcone={theme.colors.primary}>
              <Linha styles={s} simples={modoSimples} rotulo="Alergias" conteudo={valor(perfil.data.alergias)} destaque />
              <Linha styles={s} simples={modoSimples} rotulo="Medicamentos contínuos" conteudo={valor(perfil.data.medicamentosContinuos)} />
              <Linha styles={s} simples={modoSimples} rotulo="Restrições alimentares" conteudo={valor(perfil.data.restricoesAlimentares)} />
              <Linha styles={s} simples={modoSimples} rotulo="Condições preexistentes" conteudo={valor(perfil.data.condicoesPreExistentes)} />
              <Linha styles={s} simples={modoSimples} rotulo="Observações importantes" conteudo={valor(perfil.data.observacoesImportantes)} ultimo />
            </Secao>

            <View style={s.notice}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
              <Text style={[s.noticeText, modoSimples && ss.noticeText]}>Campos sem registro aparecem como “Não informado”. A ficha não substitui atendimento veterinário.</Text>
            </View>

            <Pressable style={[s.shareButton, modoSimples && ss.actionButton, compartilhando && s.buttonDisabled]} onPress={compartilhar} disabled={compartilhando} accessibilityRole="button" accessibilityLabel="Compartilhar ficha de emergência em PDF">
              {compartilhando ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Ionicons name="share-social-outline" size={modoSimples ? 25 : 20} color={theme.colors.onPrimary} />}
              <Text style={[s.shareText, modoSimples && ss.actionText]}>{compartilhando ? 'Gerando PDF...' : 'Compartilhar ficha em PDF'}</Text>
            </Pressable>
            <Pressable style={[s.editButton, modoSimples && ss.actionButton]} onPress={() => router.push({ pathname: '/(tutor)/add-pet', params: { id: petAtivo.id } })} accessibilityRole="button">
              <Ionicons name="create-outline" size={modoSimples ? 25 : 20} color={theme.colors.primary} />
              <Text style={[s.editText, modoSimples && ss.actionText]}>Editar informações</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Secao({ styles, simples, titulo, origem, icone, corIcone, children }: { styles: ReturnType<typeof createStyles>; simples: boolean; titulo: string; origem: string; icone: React.ComponentProps<typeof Ionicons>['name']; corIcone: string; children: React.ReactNode }) {
  return <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}><Ionicons name={icone} size={simples ? 25 : 20} color={corIcone} /></View>
      <View style={styles.sectionCopy}><Text style={[styles.sectionTitle, simples && ss.sectionTitle]}>{titulo}</Text><Text style={[styles.source, simples && ss.source]}>Origem: {origem}</Text></View>
    </View>
    {children}
  </View>;
}

function Linha({ styles, simples, rotulo, conteudo, ultimo, destaque }: { styles: ReturnType<typeof createStyles>; simples: boolean; rotulo: string; conteudo: string; ultimo?: boolean; destaque?: boolean }) {
  return <View style={[styles.row, ultimo && styles.rowLast]}><Text style={[styles.label, simples && ss.label]}>{rotulo}</Text><Text style={[styles.value, simples && ss.value, destaque && styles.highlight]}>{conteudo}</Text></View>;
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: page.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, paddingBottom: 15, backgroundColor: theme.components.header.background, borderBottomWidth: 1, borderBottomColor: theme.components.header.border },
    backButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.components.header.accountIconBackground },
    headerCopy: { flex: 1 },
    headerTitle: { color: theme.components.header.title, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    headerSubtitle: { color: theme.components.header.accountSubtext, fontSize: 12, marginTop: 2, opacity: 0.85 },
    content: { paddingHorizontal: 20, paddingTop: 18 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18, marginBottom: 18, padding: 18, borderRadius: 22, backgroundColor: page.card, borderWidth: 1, borderColor: page.border },
    heroPhoto: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: page.cardSecondary },
    heroCopy: { flex: 1, minWidth: 0 },
    eyebrow: { color: theme.colors.danger, fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
    petName: { color: page.text, fontSize: 24, fontWeight: '800', marginTop: 4 },
    petMeta: { color: page.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 3 },
    stateCard: { minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 28, borderRadius: 22, backgroundColor: page.card, borderWidth: 1, borderColor: page.border },
    stateText: { color: page.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 10 },
    errorTitle: { color: page.text, fontSize: 17, fontWeight: '800', textAlign: 'center', marginTop: 12 },
    retryButton: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: theme.colors.primary },
    retryText: { color: theme.colors.onPrimary, fontSize: 13, fontWeight: '700' },
    section: { marginBottom: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: page.card, borderWidth: 1, borderColor: page.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, backgroundColor: page.cardSecondary },
    sectionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: page.card },
    sectionCopy: { flex: 1 },
    sectionTitle: { color: page.text, fontSize: 16, fontWeight: '800' },
    source: { color: page.textSecondary, fontSize: 10, lineHeight: 14, marginTop: 2 },
    row: { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: page.border },
    rowLast: { borderBottomWidth: 0 },
    label: { color: page.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
    value: { color: page.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
    highlight: { color: theme.colors.danger, fontWeight: '800' },
    notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 14, marginBottom: 18, borderRadius: 16, backgroundColor: theme.colors.infoBackground },
    noticeText: { flex: 1, color: page.text, fontSize: 12, lineHeight: 18 },
    shareButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 999, backgroundColor: theme.colors.primary },
    shareText: { color: theme.colors.onPrimary, fontSize: 15, fontWeight: '800' },
    editButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 10, borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.primary },
    editText: { color: theme.colors.primary, fontSize: 14, fontWeight: '800' },
    buttonDisabled: { opacity: 0.7 },
  });
}

const ss = StyleSheet.create({
  headerTitle: { fontSize: 28 }, headerSubtitle: { fontSize: 15 }, heroPhoto: { width: 100, height: 100, borderRadius: 50 }, eyebrow: { fontSize: 11 }, petName: { fontSize: 29 }, petMeta: { fontSize: 17, lineHeight: 23 },
  sectionTitle: { fontSize: 22 }, source: { fontSize: 14, lineHeight: 19 }, label: { fontSize: 15 }, value: { fontSize: 19, lineHeight: 26 }, noticeText: { fontSize: 16, lineHeight: 23 }, actionButton: { minHeight: 62 }, actionText: { fontSize: 18 },
});
