import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ESPECIES } from '../constants';
import { useAccessibility } from '../context/AccessibilityContext';
import { usePet } from '../context/PetContext';
import { useTheme } from '../context/ThemeContext';
import { PetFoto } from '../components/pet-foto/PetFoto';
import { EditarFotoModal } from '../components/pet-foto/EditarFotoModal';
import { confirmar } from '../utils/alert';
import { mostrarToast } from '../components/ui/Toast';
import type { AppTheme } from '../constants/theme';
import type { Pet } from '../types';

function formatarData(data: string): string {
  const apenasData = data.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(apenasData)) return 'Não informado';
  const [ano, mes, dia] = apenasData.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function PetsCadastradosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { pets, removerPet } = usePet();
  const [petFotoEditandoId, setPetFotoEditandoId] = useState<string | null>(null);
  const petFotoEditando = pets.find((pet) => pet.id === petFotoEditandoId) ?? null;

  function confirmarRemocao(pet: Pet) {
    if (pets.length <= 1) {
      mostrarToast(
        'erro',
        'Não é possível remover',
        'Você precisa ter pelo menos 1 pet cadastrado.',
      );
      return;
    }
    confirmar(`Remover ${pet.nome}?`, 'Os eventos de saúde desse pet também serão removidos.', [
      { texto: 'Cancelar', estilo: 'cancel' },
      { texto: 'Remover', estilo: 'destructive', aoConfirmar: () => removerPet(pet.id) },
    ]);
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          style={s.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar para configurações"
        >
          <Ionicons name="arrow-back" size={23} color={theme.components.header.icon} />
        </Pressable>
        <View style={s.headerCopy}>
          <Text style={[s.title, modoSimples && sSimples.title]}>Pets cadastrados</Text>
          <Text style={[s.subtitle, modoSimples && sSimples.subtitle]}>
            Dados de identificação dos seus pets.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 18) + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.infoNotice}>
          <Ionicons name="information-circle-outline" size={21} color={theme.colors.primary} />
          <Text style={[s.infoNoticeText, modoSimples && sSimples.infoNoticeText]}>
            A data de cadastro ainda não é enviada pela API. Os demais dados exibidos vêm do
            cadastro do pet.
          </Text>
        </View>

        {pets.map((pet) => {
          const especie =
            ESPECIES.find((item) => item.valor === pet.especie)?.label ?? 'Espécie não informada';
          const identificacao = pet.numero?.trim() ? `Nº ${pet.numero}` : `ID ${pet.id}`;
          return (
            <View key={pet.id} style={s.card}>
              <View style={s.cardHeader}>
                <Pressable
                  style={[s.photoButton, modoSimples && sSimples.photoButton]}
                  onPress={() => setPetFotoEditandoId(pet.id)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    pet.fotoUrl ? `Alterar foto de ${pet.nome}` : `Adicionar foto de ${pet.nome}`
                  }
                >
                  <PetFoto
                    pet={pet}
                    size={modoSimples ? 66 : 52}
                    color={theme.colors.primary}
                    backgroundColor={theme.pages.tutorProfile.cardSecondary}
                    accessibilityLabel={`Foto de ${pet.nome}`}
                  />
                  <View style={s.photoBadge}>
                    <Ionicons
                      name="camera"
                      size={modoSimples ? 15 : 12}
                      color={theme.colors.onPrimary}
                    />
                  </View>
                </Pressable>
                <View style={s.petCopy}>
                  <Text style={[s.petName, modoSimples && sSimples.petName]}>{pet.nome}</Text>
                  <Text style={[s.petMeta, modoSimples && sSimples.petMeta]}>{especie}</Text>
                </View>
                <Pressable
                  style={s.removeButton}
                  onPress={() => confirmarRemocao(pet)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${pet.nome}`}
                >
                  <Ionicons
                    name="trash-outline"
                    size={modoSimples ? 24 : 19}
                    color={theme.colors.danger}
                  />
                </Pressable>
              </View>

              <View style={s.details}>
                <Detalhe
                  styles={s}
                  simples={modoSimples}
                  label="Identificação"
                  value={identificacao}
                />
                <View style={s.divider} />
                <Detalhe
                  styles={s}
                  simples={modoSimples}
                  label="Sexo"
                  value={pet.sexo === 'femea' ? 'Fêmea' : 'Macho'}
                />
                <View style={s.divider} />
                <Detalhe
                  styles={s}
                  simples={modoSimples}
                  label="Data de nascimento"
                  value={formatarData(pet.dataNascimento)}
                />
                <View style={s.divider} />
                <Detalhe
                  styles={s}
                  simples={modoSimples}
                  label="Data de cadastro"
                  value="Não disponível"
                />
              </View>
            </View>
          );
        })}

        <Pressable
          style={[s.addPet, modoSimples && sSimples.addPet]}
          onPress={() => router.push('/(tutor)/add-pet')}
          accessibilityRole="button"
        >
          <Ionicons
            name="add-circle-outline"
            size={modoSimples ? 27 : 21}
            color={theme.colors.onPrimary}
          />
          <Text style={[s.addPetText, modoSimples && sSimples.addPetText]}>
            Cadastrar outro pet
          </Text>
        </Pressable>
      </ScrollView>

      <EditarFotoModal pet={petFotoEditando} onFechar={() => setPetFotoEditandoId(null)} />
    </View>
  );
}

function Detalhe({
  styles,
  simples,
  label,
  value,
}: {
  styles: ReturnType<typeof createStyles>;
  simples: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.detailRow, simples && sSimples.detailRow]}>
      <Text style={[styles.detailLabel, simples && sSimples.detailLabel]}>{label}</Text>
      <Text style={[styles.detailValue, simples && sSimples.detailValue]}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingHorizontal: 18,
      paddingBottom: 15,
      backgroundColor: theme.components.header.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.components.header.border,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.components.header.accountIconBackground,
    },
    headerCopy: { flex: 1, minWidth: 0 },
    title: {
      color: theme.components.header.title,
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -0.55,
    },
    subtitle: {
      color: theme.components.header.accountSubtext,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 2,
    },
    content: { paddingHorizontal: 16, paddingTop: 18 },
    infoNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      borderRadius: 16,
      backgroundColor: theme.colors.infoBackground,
      padding: 13,
      marginBottom: 16,
    },
    infoNoticeText: { flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 18 },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      backgroundColor: theme.pages.tutorProfile.card,
      padding: 16,
      marginBottom: 14,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    photoButton: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    photoBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.pages.tutorProfile.card,
      backgroundColor: theme.colors.primary,
    },
    petCopy: { flex: 1, minWidth: 0 },
    petName: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
    petMeta: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 3 },
    removeButton: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.dangerBackground,
    },
    details: {
      marginTop: 17,
      borderRadius: 15,
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
      overflow: 'hidden',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      paddingHorizontal: 13,
      paddingVertical: 12,
    },
    detailLabel: { flex: 1, color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700' },
    detailValue: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
      textAlign: 'right',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.pages.tutorProfile.border,
      marginLeft: 13,
    },
    addPet: {
      minHeight: 55,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      marginTop: 4,
    },
    addPetText: { color: theme.colors.onPrimary, fontSize: 15, fontWeight: '800' },
  });

const sSimples = StyleSheet.create({
  title: { fontSize: 31 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  infoNoticeText: { fontSize: 16, lineHeight: 23 },
  photoButton: { width: 66, height: 66 },
  petName: { fontSize: 23 },
  petMeta: { fontSize: 17 },
  detailRow: { paddingVertical: 16 },
  detailLabel: { fontSize: 15 },
  detailValue: { fontSize: 17 },
  addPet: { minHeight: 70 },
  addPetText: { fontSize: 21 },
});
