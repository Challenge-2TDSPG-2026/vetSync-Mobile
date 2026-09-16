import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePet } from '../../context/PetContext';
import { ESPECIES } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { AppIcon } from '../../components/AppIcon';
import { alertar, confirmar } from '../../utils/alert';
import { statusExibicao } from '../../utils/eventoStatus';
import type { Pet } from '../../types';
import { WalletStack } from '../../components/carteira/WalletStack';
import { CarteiraModal } from '../../components/carteira/CarteiraModal';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g400: '#3db87e', g200: '#a8e6c7', g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', w50: '#f9f7f4', w100: '#f0ece5',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', warn: '#e67e22', info: '#2563eb',
};

export default function PerfilScreen() {
  const router = useRouter();
  const [petCarteira, setPetCarteira] = useState<Pet | null>(null);
  const { logout } = useAuth();
  const { modoIdoso, alternarModoIdoso } = useAccessibility();
  const {
    pets,
    petAtivo,
    petAtivoId,
    selecionarPet,
    removerPet,
    eventos,
    preferencias,
    atualizarPreferencias,
    resetarPreferencias,
  } = usePet();

  const eventosComStatus = useMemo(
    () => eventos.map(e => ({ ...e, statusExibicao: statusExibicao(e) })),
    [eventos]
  );
  const total = eventosComStatus.length;
  const concluidos = eventosComStatus.filter(e => e.statusExibicao === 'CONCLUIDO').length;
  const pendentes = eventosComStatus.filter(e => e.statusExibicao === 'AGENDADO').length;
  const atrasados = eventosComStatus.filter(e => e.statusExibicao === 'ATRASADO').length;
  const especieInfo = ESPECIES.find(e => e.valor === petAtivo?.especie);

  function abrirCarteira(pet: Pet) {
    selecionarPet(pet.id);
    setPetCarteira(pet);
  }

  function handleResetar() {
    confirmar(
      'Resetar configurações?',
      'Isso redefine as preferências locais de notificação do aplicativo. Sua conta e seus pets continuam salvos normalmente.',
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        {
          texto: 'Resetar',
          estilo: 'destructive',
          aoConfirmar: () => {
            resetarPreferencias().catch(() =>
              alertar('Não foi possível resetar', 'Tente novamente em instantes.')
            );
          },
        },
      ]
    );
  }

  function handleSair() {
    confirmar('Sair da conta?', 'Você precisará entrar novamente para acessar seus pets e eventos.', [
      { texto: 'Cancelar', estilo: 'cancel' },
      {
        texto: 'Sair',
        estilo: 'destructive',
        aoConfirmar: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  function handleRemoverPet(id: string, nome: string) {
    if (pets.length <= 1) {
      alertar('Não é possível remover', 'Você precisa ter pelo menos 1 pet cadastrado.');
      return;
    }
    confirmar(
      `Remover ${nome}?`,
      'Os eventos de saúde desse pet também serão removidos.',
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        { texto: 'Remover', estilo: 'destructive', aoConfirmar: () => removerPet(id) },
      ]
    );
  }

  const iniciais = petAtivo?.nome ? petAtivo.nome[0].toUpperCase() : '?';

  return (
    <>
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* Banner do usuário */}
      <View style={s.banner}>
        <View style={[s.avatar, modoIdoso && sIdoso.avatar]}>
          <Text style={[s.avatarText, modoIdoso && sIdoso.avatarText]}>{iniciais}</Text>
        </View>
        <View style={s.bannerInfo}>
          <Text style={[s.bannerNome, modoIdoso && sIdoso.bannerNome]}>{petAtivo?.nome ?? '–'}</Text>
          <Text style={[s.bannerRole, modoIdoso && sIdoso.bannerRole]}>{especieInfo?.label ?? '–'}{petAtivo?.raca ? ` • ${petAtivo.raca}` : ''}</Text>
        </View>
        <View style={s.bannerStat}>
          <Text style={[s.bannerStatVal, modoIdoso && sIdoso.bannerStatVal]}>{total}</Text>
          <Text style={s.bannerStatLbl}>eventos</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={[s.statsRow, modoIdoso && sIdoso.statsRow]}>
        <StatCard valor={total} label="Total" accentColor={C.info} idoso={modoIdoso} />
        <StatCard valor={concluidos} label="Realizados" accentColor={C.g500} idoso={modoIdoso} />
        <StatCard valor={pendentes} label="Pendentes" accentColor={C.warn} idoso={modoIdoso} />
        <StatCard valor={atrasados} label="Atrasados" accentColor={C.danger} idoso={modoIdoso} />
      </View>

      {/* Acessibilidade */}
      <Text style={[s.secLabel, modoIdoso && sIdoso.secLabel]}>Acessibilidade</Text>
      <View style={s.card}>
        <PrefSwitch
          label="Modo idoso"
          desc="Tela mais limpa, com textos e botões maiores"
          valor={modoIdoso}
          onToggle={alternarModoIdoso}
          idoso={modoIdoso}
        />
      </View>

      <View style={s.secLabelRow}>
        <Text style={[s.secLabel, modoIdoso && sIdoso.secLabel]}>Carteiras de vacinação</Text>
        {pets.length > 1 && <Text style={s.secLabelContagem}>{pets.length} carteiras</Text>}
      </View>
      <WalletStack
        pets={pets}
        petAtivoId={petAtivoId}
        onSelecionar={abrirCarteira}
        onTrocarPetAtivo={selecionarPet}
      />

      {/* Meus Pets */}
      <View style={s.secLabelRow}>
        <Text style={[s.secLabel, modoIdoso && sIdoso.secLabel]}>Meus Pets</Text>
        <Text style={s.secLabelContagem}>{pets.length}</Text>
      </View>
      <View style={s.card}>
        {pets.map((p, i) => {
          const info = ESPECIES.find(e => e.valor === p.especie);
          const ativo = p.id === petAtivoId;
          return (
            <View key={p.id}>
              <Pressable style={[s.petRow, modoIdoso && sIdoso.petRow]} onPress={() => selecionarPet(p.id)}>
                <View style={[s.petRowAvatar, ativo && s.petRowAvatarAtivo, modoIdoso && sIdoso.petRowAvatar]}>
                  <AppIcon
                    name={info?.icon ?? 'paw'}
                    set={info?.iconSet ?? 'MaterialCommunityIcons'}
                    size={modoIdoso ? 22 : 18}
                    color={ativo ? C.white : C.muted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.petRowNome, modoIdoso && sIdoso.petRowNome]}>{p.nome}</Text>
                  {!modoIdoso && (
                    <Text style={s.petRowDetalhe}>{info?.label}{p.raca ? ` • ${p.raca}` : ''}</Text>
                  )}
                </View>
                {ativo && (
                  <View style={s.petRowBadge}>
                    <Text style={s.petRowBadgeText}>Ativo</Text>
                  </View>
                )}
                <Pressable
                  style={s.petRowRemover}
                  onPress={() => handleRemoverPet(p.id, p.nome)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={modoIdoso ? 20 : 16} color={C.danger} />
                </Pressable>
              </Pressable>
              {i < pets.length - 1 && <View style={s.divisor} />}
            </View>
          );
        })}
        <View style={s.divisor} />
        <Pressable style={[s.btnAddPet, modoIdoso && sIdoso.btnAddPet]} onPress={() => router.push('/add-pet')}>
          <Ionicons name="add-circle-outline" size={modoIdoso ? 22 : 18} color={C.g600} />
          <Text style={[s.btnAddPetText, modoIdoso && sIdoso.btnAddPetText]}>Adicionar novo pet</Text>
        </Pressable>
      </View>

      {/* Dados do pet ativo — no modo idoso, só o essencial */}
      <Text style={[s.secLabel, modoIdoso && sIdoso.secLabel]}>Dados do Pet</Text>
      <View style={s.card}>
        {(modoIdoso
          ? [['Nome', petAtivo?.nome ?? '–'], ['Espécie', especieInfo?.label ?? '–']]
          : [
              ['Nome', petAtivo?.nome ?? '–'],
              ['Espécie', especieInfo?.label ?? '–'],
              ['Raça', petAtivo?.raca ?? '–'],
              ['Peso', petAtivo?.peso ? `${petAtivo.peso} kg` : '–'],
            ]
        ).map(([label, valor], i, arr) => (
          <View key={label}>
            <View style={[s.infoRow, modoIdoso && sIdoso.infoRow]}>
              <Text style={[s.infoLabel, modoIdoso && sIdoso.infoLabel]}>{label}</Text>
              <Text style={[s.infoValor, modoIdoso && sIdoso.infoValor]}>{valor}</Text>
            </View>
            {i < arr.length - 1 && <View style={s.divisor} />}
          </View>
        ))}
      </View>

      {/* Notificações */}
      <Text style={[s.secLabel, modoIdoso && sIdoso.secLabel]}>Notificações</Text>
      <View style={s.card}>
        <PrefSwitch
          label="Ativar notificações"
          desc="Receba lembretes de eventos"
          valor={preferencias.ativas ?? true}
          onToggle={v => atualizarPreferencias({ ...preferencias, ativas: v })}
          idoso={modoIdoso}
        />
        <View style={s.divisor} />
        <PrefSwitch
          label="Lembrete 7 dias antes"
          desc="Aviso com antecedência"
          valor={preferencias.lembrete7 ?? true}
          onToggle={v => atualizarPreferencias({ ...preferencias, lembrete7: v })}
          idoso={modoIdoso}
        />
        <View style={s.divisor} />
        <PrefSwitch
          label="Lembrete no dia anterior"
          desc="Aviso na véspera"
          valor={preferencias.lembreteAntes ?? true}
          onToggle={v => atualizarPreferencias({ ...preferencias, lembreteAntes: v })}
          idoso={modoIdoso}
        />
      </View>


      {/* Sair */}
      <Pressable style={[s.btnSair, modoIdoso && sIdoso.btnSair]} onPress={handleSair}>
        <Ionicons name="log-out-outline" size={modoIdoso ? 20 : 16} color={C.g700} />
        <Text style={[s.btnSairText, modoIdoso && sIdoso.btnSairText]}>Sair da conta</Text>
      </Pressable>

      {/* Resetar */}
      <Pressable style={[s.btnResetar, modoIdoso && sIdoso.btnSair]} onPress={handleResetar}>
        <Ionicons name="trash-outline" size={modoIdoso ? 20 : 16} color="#fff" />
        <Text style={[s.btnResetarText, modoIdoso && sIdoso.btnSairText]}>Resetar preferências</Text>
      </Pressable>

    </ScrollView>
    <CarteiraModal
      pet={petCarteira}
      eventos={petCarteira ? eventos.filter(evento => evento.petId === petCarteira.id) : []}
      onFechar={() => setPetCarteira(null)}
    />
    </>
  );
}

function StatCard({ valor, label, accentColor, idoso }: { valor: number; label: string; accentColor: string; idoso?: boolean }) {
  return (
    <View style={[s.statCard, idoso && sIdoso.statCard, { borderBottomColor: accentColor }]}>
      <Text style={[s.statLabel, idoso && sIdoso.statLabel]}>{label}</Text>
      <Text style={[s.statVal, idoso && sIdoso.statVal, { color: accentColor }]}>{valor}</Text>
    </View>
  );
}

function PrefSwitch({ label, desc, valor, onToggle, idoso }: { label: string; desc: string; valor: boolean; onToggle: (v: boolean) => void; idoso?: boolean }) {
  return (
    <View style={[s.prefRow, idoso && sIdoso.prefRow]}>
      <View style={s.prefInfo}>
        <Text style={[s.prefLabel, idoso && sIdoso.prefLabel]}>{label}</Text>
        <Text style={[s.prefDesc, idoso && sIdoso.prefDesc]}>{desc}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.g500 }}
        thumbColor={C.white}
        style={idoso ? sIdoso.switch : undefined}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 16, paddingBottom: 40 },

  banner: {
    backgroundColor: C.g900,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.g700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: C.white },
  bannerInfo: { flex: 1 },
  bannerNome: { fontSize: 15, fontWeight: '700', color: C.white },
  bannerRole: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  bannerStat: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 },
  bannerStatVal: { fontSize: 20, fontWeight: '700', color: C.white },
  bannerStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    borderBottomWidth: 3,
  },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: C.muted, marginBottom: 4 },
  statVal: { fontSize: 22, fontWeight: '700', lineHeight: 24 },

  secLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 10,
    marginTop: 4,
    paddingLeft: 2,
  },
  secLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 2 },
  secLabelContagem: { fontSize: 11, fontWeight: '700', color: C.g600, marginBottom: 10 },

  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  divisor: { height: 1, backgroundColor: C.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  infoLabel: { fontSize: 13, color: C.muted },
  infoValor: { fontSize: 13, fontWeight: '600', color: C.text },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  prefInfo: { flex: 1 },
  prefLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  prefDesc: { fontSize: 12, color: C.muted, marginTop: 2 },

  petRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  petRowAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.w50, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  petRowAvatarAtivo: { backgroundColor: C.g600, borderColor: C.g600 },
  petRowNome: { fontSize: 14, fontWeight: '700', color: C.text },
  petRowDetalhe: { fontSize: 11, color: C.muted, marginTop: 2 },
  petRowBadge: { backgroundColor: C.g100, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  petRowBadgeText: { fontSize: 10, fontWeight: '700', color: C.g700 },
  petRowRemover: { padding: 4 },

  btnAddPet: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14,
  },
  btnAddPetText: { fontSize: 13, fontWeight: '700', color: C.g600 },

  btnSair: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  btnSairText: { color: C.g700, fontSize: 14, fontWeight: '700' },

  btnResetar: {
    backgroundColor: C.danger,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnResetarText: { color: C.white, fontSize: 14, fontWeight: '700' },
});

/** Overrides aplicados por cima de `s` quando o modo idoso está ativo: textos maiores, mais espaçamento, alvos de toque maiores. */
const sIdoso = StyleSheet.create({
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { fontSize: 20 },
  bannerNome: { fontSize: 19 },
  bannerRole: { fontSize: 14 },
  bannerStatVal: { fontSize: 26 },

  statsRow: { flexWrap: 'wrap' },
  statCard: { minWidth: '47%', flexBasis: '47%', paddingVertical: 14 },
  statLabel: { fontSize: 11 },
  statVal: { fontSize: 28, lineHeight: 30 },

  secLabel: { fontSize: 14 },

  infoRow: { paddingVertical: 17 },
  infoLabel: { fontSize: 16 },
  infoValor: { fontSize: 16 },

  prefRow: { paddingVertical: 18 },
  prefLabel: { fontSize: 17 },
  prefDesc: { fontSize: 14 },
  switch: { transform: [{ scale: 1.2 }] },

  petRow: { paddingVertical: 16 },
  petRowAvatar: { width: 44, height: 44, borderRadius: 22 },
  petRowNome: { fontSize: 17 },

  btnAddPet: { paddingVertical: 18 },
  btnAddPetText: { fontSize: 16 },

  btnSair: { paddingVertical: 18 },
  btnSairText: { fontSize: 16 },
});