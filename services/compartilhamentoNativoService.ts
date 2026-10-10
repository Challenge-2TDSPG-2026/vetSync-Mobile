import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { API_BASE_URL } from '../constants/api';
import { obterTokenDaSessaoEmMemoria } from './biometriaService';
import { ApiError } from './api/httpClient';
import { nomeSeguroArquivo } from '../utils/prontuario';

const A4_LARGURA = 595;
const A4_ALTURA = 842;

/** Na web não há folha de compartilhamento: abre o diálogo de impressão (que também salva em PDF). */
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

export const compartilhamentoNativoService = {
  /** Gera o PDF a partir do HTML e abre a folha de compartilhamento (ou a impressão, na web). */
  async compartilharHtmlComoPdf(html: string, nomeArquivo: string, tituloDialogo: string): Promise<void> {
    if (Platform.OS === 'web') {
      await imprimirHtmlNaWeb(html);
      return;
    }
    const { uri } = await Print.printToFileAsync({ html, width: A4_LARGURA, height: A4_ALTURA });
    const uriFinal = await renomear(uri, nomeArquivo);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uriFinal, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: tituloDialogo });
      return;
    }
    await Print.printAsync({ html });
  },

  /** Abre a folha de compartilhamento com o link; na web, copia o link se o navegador não compartilhar. */
  async compartilharLink(url: string, titulo: string): Promise<'compartilhado' | 'copiado'> {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.share) {
      await navigator.clipboard.writeText(url);
      return 'copiado';
    }
    await Share.share(Platform.OS === 'ios' ? { url, title: titulo } : { message: `${titulo}\n${url}`, title: titulo });
    return 'compartilhado';
  },

  /**
   * Baixa um arquivo de endpoint autenticado (não dá para abrir direto no navegador, pois exige o token)
   * e o entrega ao usuário: download na web, folha de compartilhamento no aparelho.
   */
  async baixarArquivoAutenticado(caminho: string, nomeSugerido: string): Promise<void> {
    const token = await obterTokenDaSessaoEmMemoria();
    const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!resposta.ok) {
      throw new ApiError(resposta.status, 'Não foi possível baixar o arquivo. Tente novamente.');
    }
    const nome = nomeSeguroArquivo(nomeSugerido, 'laudo');
    const tipo = (resposta.headers.get('content-type') ?? 'application/octet-stream').split(';')[0].trim();

    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(await resposta.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = nome;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    const arquivo = new File(Paths.cache, nome);
    arquivo.create({ overwrite: true });
    arquivo.write(new Uint8Array(await resposta.arrayBuffer()));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(arquivo.uri, { mimeType: tipo, dialogTitle: nome });
    }
  },
};
