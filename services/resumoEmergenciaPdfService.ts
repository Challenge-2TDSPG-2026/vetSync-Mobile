import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { PerfilSaudePet, Pet } from '../types';
import { carregarLogosPdf } from '../utils/carteiraPdfLogos';
import { carregarFotoPetPdf } from '../utils/carteiraPdfFoto';
import { montarHtmlResumoEmergencia, nomeArquivoResumoEmergenciaPdf } from '../utils/resumoEmergenciaPdf';

const A4_LARGURA = 595;
const A4_ALTURA = 842;

function imprimirHtmlNaWeb(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    iframe.onload = () => {
      try {
        const janela = iframe.contentWindow;
        if (!janela) throw new Error('Não foi possível abrir a impressão.');
        janela.focus();
        janela.print();
        resolve();
      } catch (erro) {
        reject(erro instanceof Error ? erro : new Error('Não foi possível abrir a impressão.'));
      } finally {
        window.setTimeout(() => iframe.remove(), 1000);
      }
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}

async function renomear(uri: string, nome: string): Promise<string> {
  try {
    const destino = new File(Paths.cache, nome);
    await new File(uri).move(destino, { overwrite: true });
    return destino.uri;
  } catch {
    return uri;
  }
}

export const resumoEmergenciaPdfService = {
  async compartilhar(pet: Pet, perfil: PerfilSaudePet, token?: string | null): Promise<void> {
    const [logos, fotoDataUri] = await Promise.all([
      carregarLogosPdf(),
      carregarFotoPetPdf(pet.fotoUrl, token),
    ]);
    const html = montarHtmlResumoEmergencia({ pet, perfil, logos, fotoDataUri });

    if (Platform.OS === 'web') {
      await imprimirHtmlNaWeb(html);
      return;
    }

    const { uri } = await Print.printToFileAsync({ html, width: A4_LARGURA, height: A4_ALTURA });
    const uriFinal = await renomear(uri, nomeArquivoResumoEmergenciaPdf(pet));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uriFinal, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Ficha de emergência de ${pet.nome}`,
      });
      return;
    }
    await Print.printAsync({ html });
  },
};
