import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVet } from '../../context/VetContext';
import { useAuth } from '../../context/AuthContext';
import { AppIcon } from '../../components/AppIcon';
import { confirmar } from '../../utils/alert';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  cream: '#fafaf8', w50: '#f9f7f4',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff', danger: '#dc3545',
};

export default function VetPerfilScreen() {
  const { veterinarioAtivo, pacientes, eventosAgendados } = useVet();
  const { sessao, logout } = useAuth();

  function handleSair() {
    confirmar('Sair da conta?', 'Você precisará entrar novamente para acessar sua agenda.', [
      { texto: 'Cancelar', estilo: 'cancel' },
      { texto: 'Sair', estilo: 'destructive', aoConfirmar: () => logout() },
    ]);
  }

  const iniciais = (veterinarioAtivo?.nome ?? sessao?.nome ?? '?')[0]?.toUpperCase() ?? '?';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      <View style={s.banner}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{iniciais}</Text>
        </View>
        <View style={s.bannerInfo}>
          <Text style={s.bannerNome}>{veterinarioAtivo?.nome ?? sessao?.nome}</Text>
          <Text style={s.bannerRole}>{sessao?.email}</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <StatCard valor={pacientes.length} label="Pacientes" />
        <StatCard valor={eventosAgendados.length} label="Agendados" />
      </View>

      <Text style={s.secLabel}>Dados profissionais</Text>
      <View style={s.card}>
        {[
          ['CRMV', veterinarioAtivo?.crmv ?? '–'],
          ['Clínica', veterinarioAtivo?.nomeClinica ?? '–'],
          ['Perfil', 'Veterinário'],
        ].map(([label, valor], i, arr) => (
          <View key={label}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValor}>{valor}</Text>
            </View>
            {i < arr.length - 1 && <View style={s.divisor} />}
          </View>
        ))}
      </View>

      <Pressable style={s.btnSair} onPress={handleSair}>
        <Ionicons name="log-out-outline" size={16} color="#fff" />
        <Text style={s.btnSairText}>Sair da conta</Text>
      </Pressable>

    </ScrollView>
  );
}

function StatCard({ valor, label }: { valor: number; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statVal}>{valor}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 16, paddingBottom: 40 },

  banner: { backgroundColor: C.g900, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.g700, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: C.white },
  bannerInfo: { flex: 1 },
  bannerNome: { fontSize: 16, fontWeight: '700', color: C.white },
  bannerRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: C.g700 },
  statLabel: { fontSize: 10, color: C.muted, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },

  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.muted, marginBottom: 10, paddingLeft: 2 },
  card: { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, marginBottom: 24 },
  divisor: { height: 1, backgroundColor: C.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  infoLabel: { fontSize: 13, color: C.muted },
  infoValor: { fontSize: 13, fontWeight: '600', color: C.text },

  btnSair: { backgroundColor: C.danger, paddingVertical: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnSairText: { color: C.white, fontSize: 14, fontWeight: '700' },
});