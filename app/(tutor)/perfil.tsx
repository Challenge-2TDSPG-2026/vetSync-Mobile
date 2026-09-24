import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePet } from '../../context/PetContext';
import { ESPECIES } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { AppIcon } from '../../components/AppIcon';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../../components/ui/Toast';
import { DicaTela } from '../../components/ui/DicaTela';
import { LogoutConfirmationModal } from '../../components/LogoutConfirmationModal';

const C = {
  g900: '#0a2218', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', text: '#1a1512', muted: '#7a6a5e',
  border: '#e8e2da', white: '#fff', danger: '#dc3545',
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function obterIniciais(nome: string | undefined): string {
  const partes = nome?.trim().split(/\s+/).filter(Boolean) ?? [];
  return partes.slice(0, 2).map(parte => parte[0]).join('').toUpperCase() || '?';
}

export default function PerfilScreen() {
  const router = useRouter();
  const [modalSairVisivel, setModalSairVisivel] = useState(false);
  const { sessao, logout } = useAuth();
  const { modoSimples } = useAccessibility();
  const { pets, removerPet } = usePet();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('tutor-perfil');

  const nome = sessao?.nome?.trim() || 'Conta VetSync';
  const email = sessao?.email?.trim() || 'E-mail não disponível';
  const perfil = sessao?.perfil === 'TUTOR' ? 'Tutor responsável' : sessao?.perfil || 'Perfil não informado';
  const iniciais = obterIniciais(sessao?.nome);

  function handleSair() {
    setModalSairVisivel(true);
  }

  async function confirmarLogout() {
    setModalSairVisivel(false);
    await logout();
    router.replace('/login');
  }

  function handleRemoverPet(id: string, nomePet: string) {
    if (pets.length <= 1) {
      mostrarToast('erro', 'Não é possível remover', 'Você precisa ter pelo menos 1 pet cadastrado.');
      return;
    }
    confirmar(
      `Remover ${nomePet}?`,
      'Os eventos de saúde desse pet também serão removidos.',
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        { texto: 'Remover', estilo: 'destructive', aoConfirmar: () => removerPet(id) },
      ]
    );
  }

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[C.g900, C.g700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroGlowOne} />
          <View style={s.heroGlowTwo} />

          <View style={s.heroTop}>
            <View style={[s.avatar, modoSimples && sSimples.avatar]}>
              <Text style={[s.avatarText, modoSimples && sSimples.avatarText]}>{iniciais}</Text>
            </View>
            <View style={s.heroInfo}>
              <Text style={[s.overline, modoSimples && sSimples.overline]}>MINHA CONTA</Text>
              <Text style={[s.heroNome, modoSimples && sSimples.heroNome]} numberOfLines={2}>{nome}</Text>
              <Text style={[s.heroEmail, modoSimples && sSimples.heroEmail]} numberOfLines={1}>{email}</Text>
            </View>
          </View>

          <View style={s.heroFooter}>
            <View style={s.rolePill}>
              <Ionicons name="shield-checkmark-outline" size={14} color={C.g100} />
              <Text style={s.rolePillText}>{perfil}</Text>
            </View>
            <Text style={s.petCount}>{pets.length} {pets.length === 1 ? 'pet vinculado' : 'pets vinculados'}</Text>
          </View>
        </LinearGradient>

        {dicaVisivel && (
          <DicaTela
            titulo="Sua conta"
            texto="Aqui você vê seus dados, gerencia seus pets cadastrados e ativa o modo simples, com textos e botões maiores."
            accentColor={C.g600}
            onFechar={fecharDica}
            simples={modoSimples}
          />
        )}

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Dados da conta</Text>
        <View style={s.card}>
          <InfoRow icon="person-outline" label="Nome completo" value={nome} simples={modoSimples} />
          <View style={s.divider} />
          <InfoRow icon="mail-outline" label="E-mail" value={email} simples={modoSimples} />
          <View style={s.divider} />
          <InfoRow icon="shield-checkmark-outline" label="Tipo de conta" value={perfil} simples={modoSimples} />
        </View>

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Sua conta</Text>
        <View style={s.card}>
          <AccountAction
            icon="time-outline"
            title="Histórico clínico"
            description="Consulte os eventos de saúde registrados"
            onPress={() => router.push('/(tutor)/historico')}
            simples={modoSimples}
          />
        </View>

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Acessibilidade</Text>
        <View style={s.card}>
          <Pressable
            style={[s.accessibilityAction, modoSimples && sSimples.accessibilityAction]}
            onPress={() => router.push('/modo-simples')}
            accessibilityRole="button"
            accessibilityLabel="Abrir configurações do modo simples"
          >
            <View style={[s.accessibilityIcon, modoSimples && sSimples.accessibilityIcon]}>
              <Ionicons name="accessibility-outline" size={modoSimples ? 28 : 20} color={C.g600} />
            </View>
            <View style={s.accessibilityCopy}>
              <Text style={[s.accessibilityTitle, modoSimples && sSimples.accessibilityTitle]}>Modo simples</Text>
              <Text style={[s.accessibilityDescription, modoSimples && sSimples.accessibilityDescription]}>
                {modoSimples ? 'Ativado. Toque para revisar esta configuração.' : 'Textos e botões maiores para uma navegação mais confortável.'}
              </Text>
            </View>
            <View style={[s.modeStatus, modoSimples && s.modeStatusActive]}>
              <Text style={[s.modeStatusText, modoSimples && s.modeStatusTextActive]}>{modoSimples ? 'Ativo' : 'Ver'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={modoSimples ? 27 : 20} color={C.muted} />
          </Pressable>
        </View>

        <View style={s.sectionTitleRow}>
          <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Pets vinculados</Text>
          <View style={s.countBadge}><Text style={s.countBadgeText}>{pets.length}</Text></View>
        </View>
        <View style={s.card}>
          {pets.map((pet, index) => {
            const especie = ESPECIES.find(item => item.valor === pet.especie);
            return (
              <View key={pet.id}>
                <View style={[s.petRow, modoSimples && sSimples.petRow]}>
                  <View style={[s.petIcon, modoSimples && sSimples.petIcon]}>
                    <AppIcon name={especie?.icon ?? 'paw'} set={especie?.iconSet ?? 'MaterialCommunityIcons'} size={modoSimples ? 28 : 21} color={C.g700} />
                  </View>
                  <View style={s.petCopy}>
                    <Text style={[s.petName, modoSimples && sSimples.petName]}>{pet.nome}</Text>
                    <Text style={[s.petDetail, modoSimples && sSimples.petDetail]}>{especie?.label ?? 'Espécie não informada'}{pet.raca ? ` • ${pet.raca}` : ''}</Text>
                  </View>
                  <Pressable
                    style={s.removePet}
                    onPress={() => handleRemoverPet(pet.id, pet.nome)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${pet.nome}`}
                  >
                    <Ionicons name="trash-outline" size={modoSimples ? 25 : 19} color={C.danger} />
                  </Pressable>
                </View>
                {index < pets.length - 1 && <View style={s.divider} />}
              </View>
            );
          })}
          {pets.length > 0 && <View style={s.divider} />}
          <Pressable style={[s.addPet, modoSimples && sSimples.addPet]} onPress={() => router.push('/add-pet')} accessibilityRole="button">
            <Ionicons name="add-circle-outline" size={modoSimples ? 27 : 21} color={C.g600} />
            <Text style={[s.addPetText, modoSimples && sSimples.addPetText]}>Adicionar pet</Text>
          </Pressable>
        </View>

        <Pressable style={[s.logout, modoSimples && sSimples.logout]} onPress={handleSair} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={modoSimples ? 26 : 20} color={C.g700} />
          <Text style={[s.logoutText, modoSimples && sSimples.logoutText]}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
      <LogoutConfirmationModal
        visivel={modalSairVisivel}
        onFechar={() => setModalSairVisivel(false)}
        onConfirmarSair={confirmarLogout}
      />
    </>
  );
}

function InfoRow({ icon, label, value, simples }: { icon: IconName; label: string; value: string; simples: boolean }) {
  return (
    <View style={[s.infoRow, simples && sSimples.infoRow]}>
      <View style={[s.infoIcon, simples && sSimples.infoIcon]}><Ionicons name={icon} size={simples ? 24 : 18} color={C.g600} /></View>
      <View style={s.infoCopy}>
        <Text style={[s.infoLabel, simples && sSimples.infoLabel]}>{label}</Text>
        <Text style={[s.infoValue, simples && sSimples.infoValue]} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

function AccountAction({ icon, title, description, onPress, simples }: { icon: IconName; title: string; description: string; onPress: () => void; simples: boolean }) {
  return (
    <Pressable style={[s.accountAction, simples && sSimples.accountAction]} onPress={onPress} accessibilityRole="button">
      <View style={[s.actionIcon, simples && sSimples.actionIcon]}><Ionicons name={icon} size={simples ? 28 : 20} color={C.g600} /></View>
      <View style={s.actionCopy}>
        <Text style={[s.actionTitle, simples && sSimples.actionTitle]}>{title}</Text>
        <Text style={[s.actionDescription, simples && sSimples.actionDescription]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={simples ? 27 : 20} color={C.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 16, paddingBottom: 38 },
  hero: { borderRadius: 24, padding: 20, marginBottom: 24, overflow: 'hidden' },
  heroGlowOne: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(168,230,199,0.10)', right: -52, top: -70 },
  heroGlowTwo: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(242,200,121,0.10)', right: 30, bottom: -48 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 62, height: 62, borderRadius: 22, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.g700, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  heroInfo: { flex: 1, minWidth: 0 },
  overline: { color: 'rgba(255,255,255,0.62)', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  heroNome: { color: C.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.55, marginTop: 4 },
  heroEmail: { color: 'rgba(255,255,255,0.77)', fontSize: 13, marginTop: 3 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  rolePillText: { color: C.g100, fontSize: 11, fontWeight: '800' },
  petCount: { color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: '700', textAlign: 'right' },

  sectionTitle: { color: C.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.85, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2 },
  countBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: C.g100, marginBottom: 10 },
  countBadgeText: { color: C.g700, fontSize: 11, fontWeight: '800' },
  card: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 22 },
  divider: { height: 1, backgroundColor: C.border },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 14 },
  infoIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.g50 },
  infoCopy: { flex: 1, minWidth: 0 },
  infoLabel: { color: C.muted, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  infoValue: { color: C.text, fontSize: 15, fontWeight: '700' },

  accountAction: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  actionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.g50 },
  actionCopy: { flex: 1, minWidth: 0 },
  actionTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  actionDescription: { color: C.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },

  accessibilityAction: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  accessibilityIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.g50 },
  accessibilityCopy: { flex: 1, minWidth: 0 },
  accessibilityTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  accessibilityDescription: { color: C.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  modeStatus: { borderRadius: 999, backgroundColor: '#f0ece5', paddingHorizontal: 8, paddingVertical: 4 },
  modeStatusActive: { backgroundColor: C.g100 },
  modeStatusText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  modeStatusTextActive: { color: C.g700 },

  petRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 13 },
  petIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.g50 },
  petCopy: { flex: 1, minWidth: 0 },
  petName: { color: C.text, fontSize: 15, fontWeight: '800' },
  petDetail: { color: C.muted, fontSize: 12, marginTop: 3 },
  removePet: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff5f5' },
  addPet: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 15 },
  addPetText: { color: C.g600, fontSize: 14, fontWeight: '800' },

  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  logoutText: { color: C.g700, fontSize: 15, fontWeight: '800' },
});

const sSimples = StyleSheet.create({
  avatar: { width: 76, height: 76, borderRadius: 26 },
  avatarText: { fontSize: 27 },
  overline: { fontSize: 13 },
  heroNome: { fontSize: 27, lineHeight: 32 },
  heroEmail: { fontSize: 17 },
  sectionTitle: { fontSize: 18 },
  infoRow: { paddingVertical: 19, gap: 16 },
  infoIcon: { width: 52, height: 52, borderRadius: 17 },
  infoLabel: { fontSize: 16 },
  infoValue: { fontSize: 20, lineHeight: 26 },
  accountAction: { paddingVertical: 20, gap: 16 },
  actionIcon: { width: 58, height: 58, borderRadius: 18 },
  actionTitle: { fontSize: 22 },
  actionDescription: { fontSize: 17, lineHeight: 23 },
  accessibilityAction: { paddingVertical: 20, gap: 16 },
  accessibilityIcon: { width: 58, height: 58, borderRadius: 18 },
  accessibilityTitle: { fontSize: 22 },
  accessibilityDescription: { fontSize: 17, lineHeight: 23 },
  petRow: { paddingVertical: 19, gap: 16 },
  petIcon: { width: 58, height: 58, borderRadius: 18 },
  petName: { fontSize: 22 },
  petDetail: { fontSize: 17 },
  addPet: { paddingVertical: 21 },
  addPetText: { fontSize: 21 },
  logout: { paddingVertical: 22 },
  logoutText: { fontSize: 22 },
});