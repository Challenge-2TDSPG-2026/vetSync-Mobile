import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import type { LogosPdf } from './carteiraPdf';

/** assets/logo.png = versão branca (fundo escuro); assets/logo1.png = versão colorida (fundo branco). */
const LOGO_BRANCO = require('../assets/logo.png');
const LOGO_COR = require('../assets/logo1.png');

function blobParaDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error('Falha ao ler o logo.'));
    leitor.readAsDataURL(blob);
  });
}

async function paraDataUri(modulo: number): Promise<string | null> {
  try {
    const [asset] = await Asset.loadAsync(modulo);
    if (Platform.OS === 'web') {
      const resposta = await fetch(asset.uri);
      return await blobParaDataUri(await resposta.blob());
    }
    if (!asset.localUri) return null;
    const base64 = await new File(asset.localUri).base64();
    return `data:image/png;base64,${base64}`;
  } catch {
    // O logo é um enfeite: se não carregar, o PDF sai sem ele em vez de falhar.
    return null;
  }
}

/** Carrega os logos do VetSync como data URI para embutir no HTML do PDF. */
export async function carregarLogosPdf(): Promise<LogosPdf> {
  const [branco, cor] = await Promise.all([paraDataUri(LOGO_BRANCO), paraDataUri(LOGO_COR)]);
  return { branco, cor };
}