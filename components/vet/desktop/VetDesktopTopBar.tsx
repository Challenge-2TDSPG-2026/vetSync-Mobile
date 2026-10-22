import { EmojiFilteredTextInput } from '../../ui/EmojiFilteredTextInput';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LogoutConfirmationModal } from '../../LogoutConfirmationModal';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useVet } from '../../../context/VetContext';
import type { AppTheme } from '../../../constants/theme';
import { VetDesktopProfilePanel } from './VetDesktopProfilePanel';

function iniciais(nome?: string | null): string {
  if (!nome) return 'VT';
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase() || 'VT';
}

/** Barra superior do painel do veterinário (somente desktop): busca e perfil. */
export function VetDesktopTopBar() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { sessao, logout } = useAuth();
  const { veterinarioAtivo } = useVet();
  const [busca, setBusca] = useState('');
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [sairVisivel, setSairVisivel] = useState(false);

  const nome = veterinarioAtivo?.nome ?? sessao?.nome ?? '';

  async function confirmarLogout() {
    setSairVisivel(false);
    await logout();
    router.replace('/login');
  }

  return (
    <View style={s.bar}>
      <View style={s.search}>
        <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
        <EmojiFilteredTextInput
          value={busca}
          onChangeText={setBusca}
          onSubmitEditing={() => router.push('/(vet)/pacientes')}
          placeholder="Buscar paciente, tutor ou atendimento"
          placeholderTextColor={theme.colors.placeholder}
          accessibilityLabel="Buscar"
          style={s.searchInput}
        />
      </View>

      <Pressable
        style={s.perfil}
        onPress={() => setPerfilAberto(true)}
        accessibilityRole="button"
        accessibilityState={{ expanded: perfilAberto }}
        accessibilityLabel="Abrir perfil do veterinário"
      >
        <View style={s.avatar}>
          <Text style={s.avatarText}>{iniciais(nome)}</Text>
        </View>
        <View>
          <Text style={s.perfilNome}>{nome}</Text>
          <Text style={s.perfilCrmv}>CRMV {veterinarioAtivo?.crmv ?? '—'}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
      </Pressable>

      <VetDesktopProfilePanel
        visivel={perfilAberto}
        onFechar={() => setPerfilAberto(false)}
        onSair={() => {
          setPerfilAberto(false);
          setSairVisivel(true);
        }}
      />
      <LogoutConfirmationModal
        visivel={sairVisivel}
        onFechar={() => setSairVisivel(false)}
        onConfirmarSair={confirmarLogout}
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const p = theme.pages.vetDashboard;
  return StyleSheet.create({
    bar: { height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, backgroundColor: p.card, borderBottomWidth: 1, borderBottomColor: p.border },
    search: { width: 360, height: 40, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: p.border, backgroundColor: p.cardSecondary },
    searchInput: { flex: 1, fontSize: 14, color: theme.colors.text, paddingVertical: 0, outlineStyle: 'none' } as object,
    perfil: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
    avatarText: { fontSize: 14, fontWeight: '700', color: theme.colors.onPrimary },
    perfilNome: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    perfilCrmv: { fontSize: 12, color: theme.colors.textSecondary },
  });
}