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
  const { modoSimples, alternarModoSimples } = useAccessibility();
  const {
    pets,
    petAtivo,
    petAtivoId,
    selecionarPet,
    removerPet,
    eventos,
    preferencias,
    atualizarPreferencias,
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
  const mostrarListaPets = !modoSimples || pets.length > 1;

  function abrirCarteira(pet: Pet) {
    selecionarPet(pet.id);
    setPetCarteira(pet);
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
          <View style={[s.avatar, modoSimples && sSimples.avatar]}>
            <Text style={[s.avatarText, modoSimples && sSimples.avatarText]}>{iniciais}</Text>
          </View>
          <View style={s.bannerInfo}>
            <Text style={[s.bannerNome, modoSimples && sSimples.bannerNome]}>{petAtivo?.nome ?? '–'}</Text>
            <Text style={[s.bannerRole, modoSimples && sSimples.bannerRole]}>{especieInfo?.label ?? '–'}{petAtivo?.raca ? ` • ${petAtivo.raca}` : ''}</Text>
          </View>
          <View style={s.bannerStat}>
            <Text style={[s.bannerStatVal, modoSimples && sSimples.bannerStatVal]}>{total}</Text>
            <Text style={[s.bannerStatLbl, modoSimples && sSimples.bannerStatLbl]}>eventos</Text>
          </View>
        </View>

        {/* Stats row — some no modo simples */}
        {!modoSimples && (
          <View style={s.statsRow}>
            <StatCard valor={total} label="Total" accentColor={C.info} />
            <StatCard valor={concluidos} label="Realizados" accentColor={C.g500} />
            <StatCard valor={pendentes} label="Pendentes" accentColor={C.warn} />
            <StatCard valor={atrasados} label="Atrasados" accentColor={C.danger} />
          </View>
        )}

        {/* Acessibilidade */}
        <Text style={[s.secLabel, modoSimples && sSimples.secLabel]}>Acessibilidade</Text>
        <View style={s.card}>
          <PrefSwitch
            label="Modo simples"
            desc="Tela mais limpa, com textos e botões bem maiores"
            valor={modoSimples}
            onToggle={alternarModoSimples}
            simples={modoSimples}
          />
        </View>

        <View style={s.secLabelRow}>
          <Text style={[s.secLabel, modoSimples && sSimples.secLabel]}>Carteiras de vacinação</Text>
          {pets.length > 1 && <Text style={s.secLabelContagem}>{pets.length} carteiras</Text>}
        </View>
        <WalletStack
          pets={pets}
          petAtivoId={petAtivoId}
          onSelecionar={abrirCarteira}
          onTrocarPetAtivo={selecionarPet}
        />

        {/* Meus Pets */}
        {mostrarListaPets && (
          <>
            <View style={s.secLabelRow}>
              <Text style={[s.secLabel, modoSimples && sSimples.secLabel]}>Meus Pets</Text>
              <Text style={s.secLabelContagem}>{pets.length}</Text>
            </View>
            <View style={s.card}>
              {pets.map((p, i) => {
                const info = ESPECIES.find(e => e.valor === p.especie);
                const ativo = p.id === petAtivoId;
                return (
                  <View key={p.id}>
                    <Pressable style={[s.petRow, modoSimples && sSimples.petRow]} onPress={() => selecionarPet(p.id)}>
                      <View style={[s.petRowAvatar, ativo && s.petRowAvatarAtivo, modoSimples && sSimples.petRowAvatar]}>
                        <AppIcon
                          name={info?.icon ?? 'paw'}
                          set={info?.iconSet ?? 'MaterialCommunityIcons'}
                          size={modoSimples ? 30 : 22}
                          color={ativo ? C.white : C.muted}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.petRowNome, modoSimples && sSimples.petRowNome]}>{p.nome}</Text>
                        {!modoSimples && (
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
                        <Ionicons name="trash-outline" size={modoSimples ? 26 : 20} color={C.danger} />
                      </Pressable>
                    </Pressable>
                    {i < pets.length - 1 && <View style={s.divisor} />}
                  </View>
                );
              })}
              <View style={s.divisor} />
              <Pressable style={[s.btnAddPet, modoSimples && sSimples.btnAddPet]} onPress={() => router.push('/add-pet')}>
                <Ionicons name="add-circle-outline" size={modoSimples ? 28 : 22} color={C.g600} />
                <Text style={[s.btnAddPetText, modoSimples && sSimples.btnAddPetText]}>Adicionar novo pet</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Dados do pet ativo */}
        <Text style={[s.secLabel, modoSimples && sSimples.secLabel]}>Dados do Pet</Text>
        <View style={s.card}>
          {(modoSimples
            ? [['Nome', petAtivo?.nome ?? '–'], ['Espécie', especieInfo?.label ?? '–']]
            : [
              ['Nome', petAtivo?.nome ?? '–'],
              ['Espécie', especieInfo?.label ?? '–'],
              ['Raça', petAtivo?.raca ?? '–'],
              ['Peso', petAtivo?.peso ? `${petAtivo.peso} kg` : '–'],
            ]
          ).map(([label, valor], i, arr) => (
            <View key={label}>
              <View style={[s.infoRow, modoSimples && sSimples.infoRow]}>
                <Text style={[s.infoLabel, modoSimples && sSimples.infoLabel]}>{label}</Text>
                <Text style={[s.infoValor, modoSimples && sSimples.infoValor]}>{valor}</Text>
              </View>
              {i < arr.length - 1 && <View style={s.divisor} />}
            </View>
          ))}
        </View>

        {/* Notificações */}
        <Text style={[s.secLabel, modoSimples && sSimples.secLabel]}>Notificações</Text>
        <View style={s.card}>
          <PrefSwitch
            label="Ativar notificações"
            desc="Receba lembretes de eventos"
            valor={preferencias.ativas ?? true}
            onToggle={v => atualizarPreferencias({ ...preferencias, ativas: v })}
            simples={modoSimples}
          />
          <View style={s.divisor} />
          <PrefSwitch
            label="Lembrete 7 dias antes"
            desc="Aviso com antecedência"
            valor={preferencias.lembrete7 ?? true}
            onToggle={v => atualizarPreferencias({ ...preferencias, lembrete7: v })}
            simples={modoSimples}
          />
          <View style={s.divisor} />
          <PrefSwitch
            label="Lembrete no dia anterior"
            desc="Aviso na véspera"
            valor={preferencias.lembreteAntes ?? true}
            onToggle={v => atualizarPreferencias({ ...preferencias, lembreteAntes: v })}
            simples={modoSimples}
          />
        </View>

        {/* Sair */}
        <Pressable style={[s.btnSair, modoSimples && sSimples.btnSair]} onPress={handleSair}>
          <Ionicons name="log-out-outline" size={modoSimples ? 26 : 20} color={C.g700} />
          <Text style={[s.btnSairText, modoSimples && sSimples.btnSairText]}>Sair da conta</Text>
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

function StatCard({ valor, label, accentColor }: { valor: number; label: string; accentColor: string }) {
  return (
    <View style={[s.statCard, { borderBottomColor: accentColor }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statVal, { color: accentColor }]}>{valor}</Text>
    </View>
  );
}

function PrefSwitch({ label, desc, valor, onToggle, simples }: { label: string; desc: string; valor: boolean; onToggle: (v: boolean) => void; simples?: boolean }) {
  return (
    <View style={[s.prefRow, simples && sSimples.prefRow]}>
      <View style={s.prefInfo}>
        <Text style={[s.prefLabel, simples && sSimples.prefLabel]}>{label}</Text>
        <Text style={[s.prefDesc, simples && sSimples.prefDesc]}>{desc}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.g500 }}
        thumbColor={C.white}
        style={[s.switch, simples && sSimples.switch]}
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
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.g700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: C.white },
  bannerInfo: { flex: 1 },
  bannerNome: { fontSize: 19, fontWeight: '700', color: C.white },
  bannerRole: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  bannerStat: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 },
  bannerStatVal: { fontSize: 26, fontWeight: '700', color: C.white },
  bannerStatLbl: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    minWidth: '47%',
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    borderBottomWidth: 3,
  },
  statLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: C.muted, marginBottom: 5 },
  statVal: { fontSize: 28, fontWeight: '700', lineHeight: 30 },

  secLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 11,
    marginTop: 5,
    paddingLeft: 2,
  },
  secLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 2 },
  secLabelContagem: { fontSize: 12, fontWeight: '700', color: C.g600, marginBottom: 11 },

  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    marginBottom: 22,
    overflow: 'hidden',
  },
  divisor: { height: 1, backgroundColor: C.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 17 },
  infoLabel: { fontSize: 16, color: C.muted },
  infoValor: { fontSize: 16, fontWeight: '600', color: C.text },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12 },
  prefInfo: { flex: 1 },
  prefLabel: { fontSize: 17, fontWeight: '600', color: C.text },
  prefDesc: { fontSize: 14, color: C.muted, marginTop: 3 },
  switch: { transform: [{ scale: 1.2 }] },

  petRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  petRowAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.w50, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  petRowAvatarAtivo: { backgroundColor: C.g600, borderColor: C.g600 },
  petRowNome: { fontSize: 17, fontWeight: '700', color: C.text },
  petRowDetalhe: { fontSize: 13, color: C.muted, marginTop: 2 },
  petRowBadge: { backgroundColor: C.g100, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, marginRight: 6 },
  petRowBadgeText: { fontSize: 11, fontWeight: '700', color: C.g700 },
  petRowRemover: { padding: 6 },

  btnAddPet: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 18,
  },
  btnAddPetText: { fontSize: 16, fontWeight: '700', color: C.g600 },

  btnSair: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 18,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  btnSairText: { color: C.g700, fontSize: 16, fontWeight: '700' },
});

const sSimples = StyleSheet.create({
  avatar: { width: 76, height: 76, borderRadius: 38 },
  avatarText: { fontSize: 27 },
  bannerNome: { fontSize: 26 },
  bannerRole: { fontSize: 19 },
  bannerStatVal: { fontSize: 35 },
  bannerStatLbl: { fontSize: 14 },

  secLabel: { fontSize: 19 },

  infoRow: { paddingVertical: 23 },
  infoLabel: { fontSize: 22 },
  infoValor: { fontSize: 22 },

  prefRow: { paddingVertical: 24 },
  prefLabel: { fontSize: 23 },
  prefDesc: { fontSize: 19 },
  switch: { transform: [{ scale: 1.5 }] },

  petRow: { paddingVertical: 22 },
  petRowAvatar: { width: 60, height: 60, borderRadius: 30 },
  petRowNome: { fontSize: 23 },

  btnAddPet: { paddingVertical: 24 },
  btnAddPetText: { fontSize: 22 },

  btnSair: { paddingVertical: 24 },
  btnSairText: { fontSize: 22 },
});