import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { Pet } from '../types';
import type { CarteiraVacinacao } from './petHealthService';
import { montarHtmlCarteiraPdf, nomeArquivoCarteiraPdf } from '../utils/carteiraPdf';
import { carregarLogosPdf } from '../utils/carteiraPdfLogos';
import { carregarFotoPetPdf } from '../utils/carteiraPdfFoto';

/** Folha A4 em pontos (72 dpi), usada pelo expo-print no celular. */
const A4_LARGURA = 595;
const A4_ALTURA = 842;

/**
 * Na web o `expo-print` só chama `window.print()` na página atual e ignora o HTML.
 * Por isso o documento é impresso a partir de um iframe oculto; no diálogo do navegador
 * o tutor escolhe imprimir ou "Salvar como PDF".
 */
function imprimirHtmlNaWeb(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';

    const limpar = () => { window.setTimeout(() => iframe.remove(), 1000); };

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
        limpar();
      }
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}

/** Renomeia o PDF temporário (nome aleatório) para algo legível ao compartilhar. */
async function renomearPdf(uriOriginal: string, nome: string): Promise<string> {
  try {
    const destino = new File(Paths.cache, nome);
    await new File(uriOriginal).move(destino, { overwrite: true });
    return destino.uri;
  } catch {
    return uriOriginal;
  }
}

export const carteiraPdfService = {
  /**
   * Web: abre o diálogo de impressão / salvar como PDF.
   * Celular: gera o PDF em arquivo e abre a folha de compartilhamento do sistema
   * (salvar em Arquivos, WhatsApp, e-mail, imprimir...).
   */
  async exportar(pet: Pet, carteira: CarteiraVacinacao, token?: string | null): Promise<void> {
    const [logos, fotoDataUri] = await Promise.all([carregarLogosPdf(), carregarFotoPetPdf(pet.fotoUrl, token)]);
    const html = montarHtmlCarteiraPdf({ pet, carteira, logos, fotoDataUri });

    if (Platform.OS === 'web') {
      await imprimirHtmlNaWeb(html);
      return;
    }

    const { uri } = await Print.printToFileAsync({ html, width: A4_LARGURA, height: A4_ALTURA });
    const uriFinal = await renomearPdf(uri, nomeArquivoCarteiraPdf(pet));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uriFinal, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Carteira de ${pet.nome}`,
      });
      return;
    }
    // Sem compartilhamento disponível: ao menos permite imprimir.
    await Print.printAsync({ html });
  },
};