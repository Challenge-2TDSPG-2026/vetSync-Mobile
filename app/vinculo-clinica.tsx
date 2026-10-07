import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthField } from '../components/ui/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AppIcon } from '../components/AppIcon';
import { mostrarToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import { vinculoClinicaService } from '../services/vinculoClinicaService';
import { mensagemDeErro } from '../services/api/errorMessages';
import type { AppTheme } from '../constants/theme';

export default function VinculoClinicaScreen() {
  const router = useRouter();
  const { sessao, atualizarVinculoClinica, logout } = useAuth();
  const { modoSimples } = useAccessibility();
  const { theme } = useTheme();
  const styles = useMemo(() => criarEstilos(theme), [theme]);
  const { troca } = useLocalSearchParams<{ troca?: string }>();
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  async function confirmar(valor = codigo) {
    if (!valor.trim()) {
      mostrarToast('erro', 'Informe o código', 'Digite ou leia o código fornecido pela clínica.');
      return;
    }
    setEnviando(true);
    try {
      const validado = await vinculoClinicaService.validarCodigo(valor);
      if (sessao) {
        await vinculoClinicaService.trocar(validado.sessaoVinculo);
        await atualizarVinculoClinica(true);
        mostrarToast('sucesso', 'Clínica atualizada', `Agora você está vinculado(a) à ${validado.nomeClinica}.`);
        router.replace('/(tutor)/configuracoes');
      } else {
        router.replace({
          pathname: '/cadastro',
          params: { sessaoVinculo: validado.sessaoVinculo, clinica: validado.nomeClinica },
        });
      }
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível confirmar a clínica', mensagemDeErro(erro, 'Tente novamente.'));
    } finally {
      setEnviando(false);
    }
  }

  async function abrirScanner() {
    if (!permission?.granted) {
      const resposta = await requestPermission();
      if (!resposta.granted) {
        mostrarToast('erro', 'Câmera não autorizada', 'Autorize a câmera para ler o QR code da clínica.');
        return;
      }
    }
    setScannerAberto(true);
  }

  async function sairParaOutraConta() {
    setSaindo(true);
    try {
      await logout();
      router.replace('/login');
    } finally {
      setSaindo(false);
    }
  }

  return (
    <AuthLayout
      title={sessao || troca ? 'Troque sua clínica.' : 'Informe sua clínica.'}
      subtitle="Use o código ou leia o QR code fornecido pela clínica onde seu pet será atendido."
    >
      <View style={styles.aviso}>
        <AppIcon name="business-outline" set="Ionicons" size={22} color={theme.colors.primary} />
        <Text style={[styles.avisoTexto, modoSimples && stylesSimples.avisoTexto]}>
          Seus pets e o histórico médico continuam com você. A troca só é liberada sem atendimentos agendados.
        </Text>
      </View>
      <AuthField
        label="Código da clínica"
        icon="key-outline"
        value={codigo}
        onChangeText={setCodigo}
        placeholder="Ex: A1B2C3D4"
        autoCapitalize="characters"
      />
      <Pressable
        style={[styles.botao, modoSimples && stylesSimples.botao, enviando && styles.botaoDesabilitado]}
        onPress={() => void confirmar()}
        disabled={enviando}
      >
        {enviando ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.botaoTexto}>Confirmar clínica</Text>}
      </Pressable>
      <Pressable
        style={[styles.botaoSecundario, modoSimples && stylesSimples.botaoSecundario]}
        onPress={() => void abrirScanner()}
        disabled={enviando}
      >
        <AppIcon name="scan-outline" set="Ionicons" size={20} color={theme.colors.primary} />
        <Text style={[styles.botaoSecundarioTexto, modoSimples && stylesSimples.botaoSecundarioTexto]}>
          Ler QR code
        </Text>
      </Pressable>
      {sessao && troca ? (
        <Pressable
          style={styles.voltarCadastro}
          onPress={() => router.replace('/gerenciar-conta')}
          disabled={enviando || saindo}
          accessibilityRole="button"
          accessibilityLabel="Voltar para gerenciar conta"
        >
          <AppIcon name="arrow-back" set="Ionicons" size={18} color={theme.colors.primary} />
          <Text style={[styles.voltarCadastroTexto, modoSimples && stylesSimples.linkTexto]}>
            Voltar para gerenciar conta
          </Text>
        </Pressable>
      ) : null}
      {sessao ? (
        <Pressable
          style={styles.voltarCadastro}
          onPress={() => void sairParaOutraConta()}
          disabled={enviando || saindo}
          accessibilityRole="button"
          accessibilityLabel="Sair e entrar em outra conta"
          accessibilityState={{ disabled: enviando || saindo, busy: saindo }}
        >
          {saindo ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <AppIcon name="log-out-outline" set="Ionicons" size={18} color={theme.colors.primary} />
          )}
          <Text style={[styles.voltarCadastroTexto, modoSimples && stylesSimples.linkTexto]}>
            {saindo ? 'Saindo...' : 'Sair e entrar em outra conta'}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.voltarCadastro}
          onPress={() => router.back()}
          disabled={enviando}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao cadastro"
        >
          <AppIcon name="arrow-back" set="Ionicons" size={18} color={theme.colors.primary} />
          <Text style={[styles.voltarCadastroTexto, modoSimples && stylesSimples.linkTexto]}>
            Voltar ao cadastro
          </Text>
        </Pressable>
      )}

      <Modal visible={scannerAberto} animationType="slide" onRequestClose={() => setScannerAberto(false)}>
        <View style={styles.scannerTela}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              setScannerAberto(false);
              setCodigo(data);
              void confirmar(data);
            }}
          />
          <View style={styles.scannerTopo}>
            <Text style={styles.scannerTitulo}>Aponte a câmera para o QR code da clínica</Text>
            <Pressable style={styles.fecharScanner} onPress={() => setScannerAberto(false)}>
              <Text style={styles.fecharScannerTexto}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AuthLayout>
  );
}

const stylesSimples = StyleSheet.create({
  avisoTexto: { fontSize: 17, lineHeight: 24 },
  botao: { minHeight: 68 },
  botaoSecundario: { minHeight: 66 },
  botaoSecundarioTexto: { fontSize: 18 },
  linkTexto: { fontSize: 17 },
});

function criarEstilos(theme: AppTheme) {
  return StyleSheet.create({
    aviso: {
      flexDirection: 'row',
      gap: 11,
      padding: 16,
      borderRadius: 20,
      backgroundColor: theme.colors.successBackground,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      marginBottom: 24,
    },
    avisoTexto: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19 },
    botao: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 58,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      marginTop: 12,
    },
    botaoDesabilitado: { opacity: 0.7 },
    botaoTexto: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '800' },
    botaoSecundario: { minHeight: 56, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12, backgroundColor: theme.pages.shared.card },
    botaoSecundarioTexto: { color: theme.colors.primary, fontSize: 15, fontWeight: '800' },
    voltarCadastro: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 16 },
    voltarCadastroTexto: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },
    scannerTela: { flex: 1, backgroundColor: '#000' },
    scannerTopo: { paddingTop: 72, paddingHorizontal: 24, alignItems: 'center', gap: 18 },
    scannerTitulo: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
    fecharScanner: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)' },
    fecharScannerTexto: { color: '#fff', fontWeight: '700' },
  });
}
