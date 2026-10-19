import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import {
  clinicaService,
  type LogoClinica,
  type PerfilClinica,
  type ServicoClinica,
} from '../../services/clinicaService';
import { mostrarToast } from '../../components/ui/Toast';
import { mensagemDeErro } from '../../services/api/errorMessages';

const DIAS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export default function MinhaClinicaScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilClinica | null>(null);
  const [servicos, setServicos] = useState<ServicoClinica[]>([]);
  const [logo, setLogo] = useState<LogoClinica | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    let logoCarregada: LogoClinica | null = null;

    async function carregar() {
      try {
        const [perfilCarregado, servicosCarregados] = await Promise.all([
          clinicaService.perfil(),
          clinicaService.listarServicos(),
        ]);
        if (!ativo) return;

        setPerfil(perfilCarregado);
        setServicos(servicosCarregados);

        if (perfilCarregado.possuiLogo) {
          logoCarregada = await clinicaService.carregarLogo();
          if (ativo) setLogo(logoCarregada);
          else logoCarregada?.liberar();
        }
      } catch (erro) {
        if (ativo) {
          mostrarToast(
            'erro',
            'Não foi possível carregar a clínica',
            mensagemDeErro(erro, 'Tente novamente.'),
          );
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    void carregar();
    return () => {
      ativo = false;
      logoCarregada?.liberar();
    };
  }, []);

  const card = {
    backgroundColor: theme.colors.input,
    borderColor: theme.colors.textMuted,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={s.scroll}
    >
      <Pressable onPress={() => router.back()} style={s.back}>
        <Text style={{ color: theme.colors.primary }}>‹ Voltar</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : perfil ? (
        <>
          <View style={s.hero}>
            {logo && (
              <Image
                style={s.logo}
                source={{ uri: logo.uri, headers: logo.headers }}
              />
            )}
            <Text style={[s.title, { color: theme.colors.text }]}>{perfil.nome}</Text>
            <Text style={{ color: theme.colors.textSecondary }}>
              {perfil.cidade}
              {perfil.uf ? `, ${perfil.uf}` : ''}
            </Text>
          </View>

          <View style={[s.card, card]}>
            <Text style={[s.heading, { color: theme.colors.text }]}>
              Endereço e contato
            </Text>
            <Text style={{ color: theme.colors.text, lineHeight: 22 }}>
              {perfil.endereco || 'Endereço ainda não informado'}
            </Text>
            <Text style={{ color: theme.colors.text, marginTop: 9 }}>
              {perfil.telefone || 'Telefone ainda não informado'}
            </Text>
          </View>

          <View style={[s.card, card]}>
            <Text style={[s.heading, { color: theme.colors.text }]}>
              Horário de funcionamento
            </Text>
            {DIAS.map((dia, idx) => (
              <View style={s.row} key={dia}>
                <Text style={{ color: theme.colors.text }}>{dia}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  {perfil.horarios
                    .filter(h => h.diaSemana === idx + 1)
                    .map(h => `${h.inicio}–${h.fim}`)
                    .join(', ') || 'Fechado'}
                </Text>
              </View>
            ))}
          </View>

          <View style={[s.card, card]}>
            <Text style={[s.heading, { color: theme.colors.text }]}>Serviços</Text>
            {servicos.length ? (
              servicos.map(item => (
                <View style={s.row} key={item.id}>
                  <Text style={{ color: theme.colors.text }}>{item.nome}</Text>
                  <Text style={{ color: theme.colors.textSecondary }}>
                    {item.duracaoMinutos} min
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: theme.colors.textSecondary }}>
                Serviços ainda não publicados.
              </Text>
            )}
            <Pressable
              onPress={() => router.push('/(tutor)/agendar-servico')}
              style={[s.button, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>
                Agendar serviço
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/(tutor)/mensagens-clinica')}
            style={[s.button, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>
              Conversar com a clínica
            </Text>
          </Pressable>
        </>
      ) : (
        <Text style={{ color: theme.colors.textSecondary }}>
          Clínica não encontrada.
        </Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 18, paddingBottom: 42 },
  back: { paddingVertical: 10 },
  hero: { alignItems: 'center', paddingTop: 16, paddingBottom: 24 },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    borderRadius: 12,
    marginBottom: 15,
  },
  title: { fontSize: 25, fontWeight: '800', textAlign: 'center', marginBottom: 5 },
  card: { borderWidth: 1, borderRadius: 15, padding: 17, marginBottom: 14 },
  heading: { fontSize: 16, fontWeight: '800', marginBottom: 13 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#9ab7a9',
  },
  button: { borderRadius: 13, alignItems: 'center', padding: 15, marginTop: 14 },
});
